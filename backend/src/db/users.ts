/**
 * 用户数据持久化模块
 *
 * 使用 SQLite 存储用户数据
 *
 * @module db/users
 */

import db from './sqlite'
import type { User } from '../types'

/**
 * 获取所有用户
 *
 * @returns 用户列表
 */
export function findAll(): User[] {
  const rows = db.prepare(`
    SELECT id, username, password_hash, role, created_at, last_login_at
    FROM users
    ORDER BY created_at DESC
  `).all() as any[]

  return rows.map(row => ({
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined
  }))
}

/**
 * 根据ID查找用户
 *
 * @param id - 用户ID
 * @returns 用户对象或undefined
 */
export function findById(id: string): User | undefined {
  const row = db.prepare(`
    SELECT id, username, password_hash, role, created_at, last_login_at
    FROM users
    WHERE id = ?
  `).get(id) as any

  if (!row) return undefined

  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined
  }
}

/**
 * 根据用户名查找用户
 *
 * @param username - 用户名
 * @returns 用户对象或undefined
 */
export function findByUsername(username: string): User | undefined {
  const row = db.prepare(`
    SELECT id, username, password_hash, role, created_at, last_login_at
    FROM users
    WHERE username = ?
  `).get(username) as any

  if (!row) return undefined

  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined
  }
}

/**
 * 创建新用户
 *
 * @param user - 用户对象（不含id和createdAt）
 * @returns 创建的用户对象
 */
export function create(user: Omit<User, 'id' | 'createdAt'>): User {
  const id = generateId()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO users (id, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, user.username, user.passwordHash, user.role, now)

  return {
    ...user,
    id,
    createdAt: now
  }
}

/**
 * 更新用户信息
 *
 * @param id - 用户ID
 * @param updates - 要更新的字段
 * @returns 更新后的用户对象或undefined
 */
export function update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined {
  const existing = findById(id)
  if (!existing) return undefined

  const fields: string[] = []
  const values: any[] = []

  if (updates.passwordHash !== undefined) {
    fields.push('password_hash = ?')
    values.push(updates.passwordHash)
  }
  if (updates.role !== undefined) {
    fields.push('role = ?')
    values.push(updates.role)
  }
  if (updates.lastLoginAt !== undefined) {
    fields.push('last_login_at = ?')
    values.push(updates.lastLoginAt)
  }

  if (fields.length === 0) return existing

  values.push(id)
  db.prepare(`
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = ?
  `).run(...values)

  return findById(id)
}

/**
 * 删除用户
 *
 * @param id - 用户ID
 * @returns 是否删除成功
 */
export function remove(id: string): boolean {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return result.changes > 0
}

/**
 * 检查用户名是否存在
 *
 * @param username - 用户名
 * @returns 是否存在
 */
export function existsByUsername(username: string): boolean {
  const row = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)
  return !!row
}

/**
 * 生成唯一ID
 *
 * @returns 唯一ID字符串
 */
function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}