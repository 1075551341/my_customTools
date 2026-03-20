/**
 * SQLite 数据库连接模块
 *
 * 提供单例数据库连接，自动初始化表结构
 *
 * @module db/sqlite
 */

import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import config from '../config'

// 数据库文件路径
const DB_PATH = path.join(config.storage.dataDir, 'app.db')

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 创建数据库连接（单例）
const db: DatabaseType = new Database(DB_PATH)

// 启用 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL')

// 初始化表结构
db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
  );

  -- 任务表
  CREATE TABLE IF NOT EXISTS tasks (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    file_name     TEXT NOT NULL,
    original_name TEXT,
    type          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'waiting',
    progress      INTEGER DEFAULT 0,
    config        TEXT,
    output_path   TEXT,
    error         TEXT,
    file_size     INTEGER,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at  DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 上传会话表
  CREATE TABLE IF NOT EXISTS upload_sessions (
    id            TEXT PRIMARY KEY,
    file_name     TEXT NOT NULL,
    file_size     INTEGER NOT NULL,
    chunk_size    INTEGER NOT NULL,
    total_chunks  INTEGER NOT NULL,
    uploaded_chunks TEXT DEFAULT '[]',
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at    DATETIME
  );

  -- 系统配置表
  CREATE TABLE IF NOT EXISTS system_config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
  CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);
`)

console.log(`[SQLite] 数据库已连接: ${DB_PATH}`)

export default db