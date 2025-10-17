// services/database.ts
import { Pool } from 'pg';

// Neon DB接続URLは環境変数から取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set. Database functions will be skipped.");
}

// PostgreSQLクライアントの初期化
export const db = connectionString ? new Pool({ connectionString }) : null;

// データベースに記録するためのスコア構造
export interface DBScores {
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
 */
export async function logEvaluation(
    userId: string,
    caseId: string,
    userText: string,
    scores: DBScores, 
    responseBody: any
): Promise<void> {
    if (!db) {
        console.warn("Database connection is not initialized. Skipping log.");
        return;
    }

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
            userText,
            scores.total_score, 
            scores.conciseness_score,
            scores.accuracy_score,
            scores.clarity_score,
            scores.structure_score,
            scores.terminology_score,
            scores.clinical_sensitivity_score,
            JSON.stringify(responseBody)
        ]);
        console.log(`[DB SUCCESS] Evaluation logged for user: ${userId}, case: ${caseId}`);
    } catch (error) {
        console.error("Failed to log evaluation to database:", error);
    }
}

export async function checkRateLimit(userId: string): Promise<boolean> {
    if (!db) return true;

    try {
        const result = await db.query(
            `SELECT count FROM api_usage WHERE date = CURRENT_DATE AND user_id = $1;`,
            [userId]
        );

        const count = result.rows.length > 0 ? result.rows[0].count : 0;
        const limit = 50;

        console.log(`[RATE LIMIT CHECK] User ${userId}: ${count}/${limit} uses today.`);
        return count < limit;
    } catch (error) {
        console.error("Failed to check rate limit:", error);
        return true;
    }
}

export async function incrementApiUsage(userId: string): Promise<void> {
    if (!db) return;

    try {
        const query = `
            INSERT INTO api_usage (date, user_id, count)
            VALUES (CURRENT_DATE, $1, 1)
            ON CONFLICT (date, user_id) DO UPDATE
            SET count = api_usage.count + 1;
        `;
        await db.query(query, [userId]);
    } catch (error) {
        console.error("Failed to increment API usage count:", error);
    }
}

export async function getCaseListFromDB(userId: string): Promise<any[]> {
    console.log(`[DB LOG MOCK] Attempting to fetch cases for user: ${userId}`);
    return [];
}
