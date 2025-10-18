// services/database-types.ts
import type { Pool } from "pg";

/** PostgreSQL Pool 型 */
export type DBPool = Pool | null;

/** スコア構造体 */
export interface DBScores {
  total_score: number;
  conciseness_score: number;
  accuracy_score: number;
  clarity_score: number;
  structure_score: number;
  terminology_score: number;
  clinical_sensitivity_score: number;
}
