// services/database.ts
import { Pool } from 'pg';

// Neon DB接続URLは環境変数から取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set. Database functions will be skipped.");
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
        // DB未接続時は制限なし
        return true; 
    }

    try {
        // SQL履歴に基づき、api_usageテーブルにアクセスし、日次利用回数をチェック
        // 現在の日付の利用回数を取得
        const result = await db.query(
            `SELECT count FROM api_usage WHERE date = CURRENT_DATE AND user_id = $1;`,
            [userId] // ユーザーごとのレートリミットをチェックするために user_id を追加
        );
        
        // user_id $1 の WHERE句を追加したため、UPSERTロジックと整合性を取るため、
        // api_usageテーブルに user_id カラムが必要です。

        const count = result.rows.length > 0 ? result.rows[0].count : 0;
        const limit = 50; // 例として1日50回の上限を設定

        console.log(`[RATE LIMIT CHECK] User ${userId}: ${count}/${limit} uses today.`);

        return count < limit;

    } catch (error) {
        console.error("Failed to check rate limit:", error);
        // DBエラー時は安全のため許可（APIの可用性を優先）
        return true; 
    }
}

/**
 * API利用回数をインクリメントする関数 (評価ログ後などに呼び出す)
 * @param userId - ユーザーの固有ID
 * @returns 処理完了を示すPromise<void>
 */
export async function incrementApiUsage(userId: string): Promise<void> {
    if (!db) {
        return;
    }

    try {
        // user_id を追加して、ユーザーごとにカウントする
        const query = `
            INSERT INTO api_usage (date, user_id, count)
            VALUES (CURRENT_DATE, $1, 1)
            ON CONFLICT (date, user_id) DO UPDATE
            SET count = api_usage.count + 1;
        `;
        // api_usageテーブルには `(date, user_id)` の複合ユニークインデックスが必要です。
        await db.query(query, [userId]);
    } catch (error) {
        console.error("Failed to increment API usage count:", error);
    }
}

/**
 * 課題リストをデータベースから取得する関数 (ダミー実装)
 * 現状はAPI側の動的生成を使うため、ここでは空の配列を返す。
 * @param userId - ユーザーID (現時点では未使用)
 * @returns {Promise<any[]>} - ケースデータの配列
 */
export async function getCaseListFromDB(userId: string): Promise<any[]> {
    console.log(`[DB LOG MOCK] Attempting to fetch cases for user: ${userId}`);
    // データベースが実装されるまで、空の配列を返します。
    return [];
}
