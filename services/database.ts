import { Pool } from 'pg';
//import { v4 as uuidv4 } from 'uuid'; // UUID生成用

// Neon DB接続URLは環境変数から取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set.");
}

// PostgreSQLクライアントの初期化
export const db = connectionString ? new Pool({ connectionString }) : null;

// データベースに記録するためのスコア構造
interface DBScores {
    total_score: number;
    conciseness_score: number;
    accuracy_score: number;
    clarity_score: number;
    structure_score: number;
    terminology_score: number;
    clinical_sensitivity_score: number;
}

// 評価ログをデータベースに記録する関数
// この関数は、pages/api/evaluate.ts で抽出された DBScores 型のオブジェクトを受け取ります
export async function logEvaluation(
    userId: string,
    caseId: string,
    userText: string,
    scores: DBScores, // 個別のスコアを含むオブジェクト
    responseBody: any
): Promise<void> {
    if (!db) {
        console.warn("Database connection is not initialized. Skipping log.");
        return;
    }

    // ★ 修正箇所: テーブル名を 'evaluation_logs' から 'evaluations' に変更
    const query = `
        INSERT INTO evaluations (
            user_id, 
            case_id, 
            user_text, 
            total_score, 
            conciseness_score, 
            accuracy_score, 
            clarity_score, 
            structure_score, 
            terminology_score, 
            clinical_sensitivity_score,
            response_body  -- ★ response_body に修正
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
    `;

    try {
        await db.query(query, [
            userId, 
            caseId, 
            userText, 
            scores.total_score, 
            scores.conciseness_score,
            scores.accuracy_score,
            scores.clarity_score,
            scores.structure_score,
            scores.terminology_score,
            scores.clinical_sensitivity_score,
            JSON.stringify(responseBody) // AIレスポンス全体も保存
        ]);
    } catch (error) {
        console.error("Failed to log evaluation to database:", error);
    }
}
// レートリミットチェック（現時点では未使用だがエクスポートは維持）
export async function checkRateLimit(userId: string): Promise<boolean> {
    // 実際にはユーザーの1日の利用回数をチェックするロジックが入ります
    return true; 
}