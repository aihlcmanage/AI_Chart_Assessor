import { Pool } from 'pg';

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
 * @param userId - ユーザーの固有ID (外部キー制約なし)
 * @param caseId - 課題のID
 * @param userText - ユーザーが提出した修正カルテテキスト (DBカラム名は modified_text)
 * @param scores - 個別のスコアを含むオブジェクト (DBScores型)
 * @param responseBody - AIからの完全な評価レポートJSONオブジェクト
 * @returns 処理完了を示すPromise<void>
 */
export async function logEvaluation(
    userId: string,
    caseId: string,
    userText: string, // この引数はDBでは modified_text に対応
    scores: DBScores, 
    responseBody: any // JSONBとして保存
): Promise<void> {
    if (!db) {
        console.warn("Database connection is not initialized. Skipping log.");
        return;
    }

    // データベースに挿入するためのSQLクエリ
    // スキーマに合わせて `user_text` を **`modified_text`** に変更。
    // `timestamp` はデフォルト値があるので明示的に挿入する必要なし。
    const query = `
        INSERT INTO evaluations (
            user_id, 
            case_id, 
            modified_text, 
            total_score, 
            conciseness_score, 
            accuracy_score, 
            clarity_score, 
            structure_score, 
            terminology_score, 
            clinical_sensitivity_score,
            response_body
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
    `;

    try {
        await db.query(query, [
            userId, 
            caseId, 
            userText, // modified_text に格納されるデータ
            scores.total_score, 
            scores.conciseness_score,
            scores.accuracy_score,
            scores.clarity_score,
            scores.structure_score,
            scores.terminology_score,
            scores.clinical_sensitivity_score,
            JSON.stringify(responseBody) // JSONB型フィールドに格納
        ]);
        console.log(`[DB SUCCESS] Evaluation logged for user: ${userId}, case: ${caseId}`);
    } catch (error) {
        console.error("Failed to log evaluation to database:", error);
    }
}

/**
 * レートリミットチェック関数
 * @param userId - ユーザーの固有ID
 * @returns 制限を超えていない場合はtrue
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
    if (!db) {
        return true; 
    }

    try {
        // SQL履歴に基づき、api_usageテーブルにアクセスし、日次利用回数をチェック
        // 現在の日付の利用回数を取得
        const result = await db.query(
            `SELECT count FROM api_usage WHERE date = CURRENT_DATE;`
        );
        
        const count = result.rows.length > 0 ? result.rows[0].count : 0;
        const limit = 50; // 例として1日50回の上限を設定

        return count < limit;

    } catch (error) {
        console.error("Failed to check rate limit:", error);
        // DBエラー時は安全のため許可（APIの可用性を優先）
        return true; 
    }
}

/**
 * API利用回数をインクリメントする関数 (評価ログ後などに呼び出す)
 * @returns 処理完了を示すPromise<void>
 */
export async function incrementApiUsage(): Promise<void> {
    if (!db) {
        return;
    }

    try {
        // UPSERT (あれば更新、なければ挿入) を使用して日次カウンターを更新
        const query = `
            INSERT INTO api_usage (date, count)
            VALUES (CURRENT_DATE, 1)
            ON CONFLICT (date) DO UPDATE
            SET count = api_usage.count + 1;
        `;
        await db.query(query);
    } catch (error) {
        console.error("Failed to increment API usage count:", error);
    }
}