import { Pool } from 'pg';
// import { v4 as uuidv4 } from 'uuid'; // UUID生成用 (今回は未使用)

// Neon DB接続URLは環境変数から取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set.");
}

// PostgreSQLクライアントの初期化
// connectionStringが存在しない場合、dbはnullとなり、APIがクラッシュするのを防ぎます。
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

/**
 * 評価ログをデータベースに記録する関数
 * @param userId - ユーザーの固有ID
 * @param caseId - 課題のID
 * @param userText - ユーザーが提出した修正カルテテキスト
 * @param scores - 個別のスコアを含むオブジェクト (DBScores型)
 * @param responseBody - AIからの完全な評価レポートJSONオブジェクト
 * @returns 処理完了を示すPromise<void>
 */
export async function logEvaluation(
    userId: string,
    caseId: string,
    userText: string,
    scores: DBScores, // 個別のスコアを含むオブジェクト
    responseBody: any // AIからの完全なレポート
): Promise<void> {
    if (!db) {
        console.warn("Database connection is not initialized. Skipping log.");
        return;
    }

    // データベースに挿入するためのSQLクエリ
    // $1から$11は、VALUESの配列の要素に対応します。
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
            response_body,
            created_at  -- ログ記録日時を追加するのが一般的
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW());
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
            JSON.stringify(responseBody) // JSONB型フィールドに格納するため文字列化
        ]);
        console.log(`[DB SUCCESS] Evaluation logged for user: ${userId}, case: ${caseId}`);
    } catch (error) {
        console.error("Failed to log evaluation to database:", error);
        // エラーが発生した場合でも、API呼び出し元（evaluate.ts）はブロックしない
    }
}

/**
 * レートリミットチェック関数（現時点では未使用だがエクスポートは維持）
 * @param userId - ユーザーの固有ID
 * @returns 制限を超えていない場合はtrue
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
    if (!db) {
        return true; // DBがない場合は制限チェックをスキップ
    }

    // 実際には、過去24時間の利用回数をカウントし、しきい値と比較するロジックが入ります。
    // 例:
    /*
    const result = await db.query(
        `SELECT COUNT(*) FROM evaluations 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
        [userId]
    );
    const count = parseInt(result.rows[0].count, 10);
    const limit = 50; // 1日のリミット

    return count < limit;
    */
    
    return true; 
}