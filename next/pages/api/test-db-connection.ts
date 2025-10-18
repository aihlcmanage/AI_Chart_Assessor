// pages/api/test-db-connection.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { initDB } from "../../services/database";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await initDB();
  if (!db) return res.status(500).json({ ok: false, message: "DB connection failed" });

  try {
    const result = await db.query("SELECT NOW()");
    return res.status(200).json({ ok: true, time: result.rows[0].now });
  } catch (error) {
    return res.status(500).json({ ok: false, error });
  }
}
