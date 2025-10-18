
// pages/api/test-db.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { initDB } from "../../services/database";
import type { DBScores } from "../../services/database-types";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await initDB();
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  // 簡単なクエリ例
  try {
    const result = await db.query("SELECT NOW() AS now;");
    return res.status(200).json({ time: result.rows[0].now });
  } catch (err) {
    return res.status(500).json({ error: "Query failed", details: err });
  }
}
