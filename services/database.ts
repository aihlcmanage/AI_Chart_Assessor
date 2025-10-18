// services/database.ts

/**
 * データベース接続および操作を管理するモジュール
 * - Vercel のビルド環境でも動作するよう dynamic import を採用
 * - DATABASE_URL が未設定の場合は安全にスキップ
 */
export {}; // ← これでモジュールとして認識されます
let pool: any = null;

/**
 * DB接続の初期化（dynamic importで解決）
 */
async function initDB(): Promise<any> {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "❌ DATABASE_URL environment variable is not set. Database functions will be skipped."
    );
    return null;
  }

  try {
    // dynamic import で pg を読み込む
    const pgModule = await import("pg");
    const { Pool } = pgModule;
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    console.log("✅ Database connection pool initialized successfully.");
    return pool;
  } catch (error) {
    console.error("❌ Failed to initialize database pool:", error);
    return null;
  }
}

/**
 * スコア構造体
 */
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
 * 評価ログをデータベースに記録
 */
export async function logEvaluation(
  userId: string,
  caseId: string,
  userText: string,
  scores: DBScores,
  responseBody: any
): Promise<void> {
  const db = await initDB();
  if (!db) {
    console.warn("⚠️ Database connection not available. Skipping log.");
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
      JSON.stringify(responseBody),
    ]);
    console.log(`✅ [DB] Evaluation logged: user=${userId}, case=${caseId}`);
  } catch (error) {
    console.error("❌ Failed to log evaluation:", error);
  }
}

/**
 * レートリミットの確認
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
  const db = await initDB();
  if (!db) return true;

  try {
    const result = await db.query(
      `SELECT count FROM api_usage WHERE date = CURRENT_DATE AND user_id = $1;`,
      [userId]
    );

    const count = result.rows.length > 0 ? result.rows[0].count : 0;
    const limit = 50;

    console.log(`📊 [RATE LIMIT] ${userId}: ${count}/${limit}`);
    return count < limit;
  } catch (error) {
    console.error("❌ Failed to check rate limit:", error);
    return true;
  }
}

/**
 * API使用回数のインクリメント
 */
export async function incrementApiUsage(userId: string): Promise<void> {
  const db = await initDB();
  if (!db) return;

  try {
    const query = `
      INSERT INTO api_usage (date, user_id, count)
      VALUES (CURRENT_DATE, $1, 1)
      ON CONFLICT (date, user_id) DO UPDATE
      SET count = api_usage.count + 1;
    `;
    await db.query(query, [userId]);
    console.log(`🔁 [DB] API usage incremented for user=${userId}`);
  } catch (error) {
    console.error("❌ Failed to increment API usage count:", error);
  }
}

/**
 * 症例リスト取得（仮）
 */
export async function getCaseListFromDB(userId: string): Promise<any[]> {
  console.log(`🧩 [DB MOCK] Fetching cases for user: ${userId}`);
  return [];
}
