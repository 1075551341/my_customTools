/**
 * 数据迁移模块
 *
 * 将 JSON 文件数据迁移到 SQLite
 *
 * @module db/migrate
 */

import fs from 'fs'
import path from 'path'
import db from './sqlite'
import config from '../config'

/**
 * 迁移用户数据
 */
function migrateUsers(): void {
  const usersFile = path.join(config.storage.dataDir, 'users.json')

  if (!fs.existsSync(usersFile)) {
    console.log('[迁移] 无需迁移用户数据')
    return
  }

  // 检查是否已有数据
  const existingCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0
  if (existingCount > 0) {
    console.log('[迁移] 用户数据已存在，跳过迁移')
    return
  }

  try {
    const content = fs.readFileSync(usersFile, 'utf-8')
    const data = JSON.parse(content)

    if (!data.users || !Array.isArray(data.users)) {
      console.log('[迁移] 无效的用户数据格式')
      return
    }

    const insert = db.prepare(`
      INSERT INTO users (id, username, password_hash, role, created_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (const user of data.users) {
      insert.run(
        user.id,
        user.username,
        user.passwordHash,
        user.role,
        user.createdAt,
        user.lastLoginAt || null
      )
    }

    console.log(`[迁移] 成功迁移 ${data.users.length} 个用户`)

    // 备份原文件
    const backupFile = `${usersFile}.backup`
    fs.renameSync(usersFile, backupFile)
    console.log(`[迁移] 原文件已备份至 ${backupFile}`)
  } catch (err) {
    console.error('[迁移] 用户数据迁移失败:', (err as Error).message)
  }
}

/**
 * 迁移任务数据
 */
function migrateTasks(): void {
  const tasksFile = path.join(config.storage.dataDir, 'tasks.json')

  if (!fs.existsSync(tasksFile)) {
    console.log('[迁移] 无需迁移任务数据')
    return
  }

  const existingCount = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any)?.count || 0
  if (existingCount > 0) {
    console.log('[迁移] 任务数据已存在，跳过迁移')
    return
  }

  try {
    const content = fs.readFileSync(tasksFile, 'utf-8')
    const data = JSON.parse(content)

    if (!data.tasks || !Array.isArray(data.tasks)) {
      console.log('[迁移] 无效的任务数据格式')
      return
    }

    const insert = db.prepare(`
      INSERT INTO tasks (id, user_id, file_name, original_name, type, status, progress, config, output_path, error, file_size, created_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const task of data.tasks) {
      insert.run(
        task.id,
        task.userId || 'unknown',
        task.fileName,
        task.originalName || task.fileName,
        task.type,
        task.status,
        task.progress || 0,
        JSON.stringify(task.config || {}),
        task.outputPath || null,
        task.error || null,
        task.fileSize || 0,
        task.createdAt,
        task.updatedAt || task.createdAt,
        task.completedAt || null
      )
    }

    console.log(`[迁移] 成功迁移 ${data.tasks.length} 个任务`)

    const backupFile = `${tasksFile}.backup`
    fs.renameSync(tasksFile, backupFile)
    console.log(`[迁移] 原文件已备份至 ${backupFile}`)
  } catch (err) {
    console.error('[迁移] 任务数据迁移失败:', (err as Error).message)
  }
}

/**
 * 执行所有迁移
 */
export function runMigrations(): void {
  console.log('[迁移] 开始数据迁移...')
  migrateUsers()
  migrateTasks()
  console.log('[迁移] 数据迁移完成')
}