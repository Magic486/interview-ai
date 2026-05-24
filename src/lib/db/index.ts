import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle>;

let _db: DrizzleDb | null = null;

function initDb(): DrizzleDb {
  // 动态 require，避免构建时加载 better-sqlite3 原生模块
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");

  const sqlite = new Database(
    process.env.DATABASE_URL?.replace("file:", "") || "./interview.db"
  );
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      raw_text TEXT NOT NULL,
      parsed_skills TEXT,
      parsed_experience TEXT,
      education TEXT,
      file_url TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      resume_id TEXT REFERENCES resumes(id),
      role TEXT NOT NULL,
      company_type TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'normal',
      stress_mode INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'in_progress',
      current_stage TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      stage TEXT NOT NULL,
      code_snippet TEXT,
      score INTEGER,
      feedback TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
      overall_score INTEGER NOT NULL,
      dimension_scores TEXT NOT NULL,
      strengths TEXT,
      weaknesses TEXT,
      per_question_analysis TEXT,
      improvement_plan TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      target_role TEXT NOT NULL,
      gap_analysis TEXT NOT NULL,
      steps TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  return drizzle(sqlite, { schema });
}

/**
 * 懒加载数据库实例。
 * 使用 Proxy 确保所有属性访问触发初始化，
 * 调用方无需修改（db.select() 等写法保持不变）。
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = initDb();
    }
    return Reflect.get(_db, prop, receiver);
  },
});
