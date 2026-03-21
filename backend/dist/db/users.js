"use strict";
/**
 * 用户数据持久化模块
 *
 * 使用 SQLite 存储用户数据
 *
 * @module db/users
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = findAll;
exports.findById = findById;
exports.findByUsername = findByUsername;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.existsByUsername = existsByUsername;
const sqlite_1 = __importDefault(require("./sqlite"));
/**
 * 获取所有用户
 *
 * @returns 用户列表
 */
function findAll() {
    const rows = sqlite_1.default.prepare(`
    SELECT id, username, password_hash, role, created_at, last_login_at
    FROM users
    ORDER BY created_at DESC
  `).all();
    return rows.map(row => ({
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at || undefined
    }));
}
/**
 * 根据ID查找用户
 *
 * @param id - 用户ID
 * @returns 用户对象或undefined
 */
function findById(id) {
    const row = sqlite_1.default.prepare(`
    SELECT id, username, password_hash, role, created_at, last_login_at
    FROM users
    WHERE id = ?
  `).get(id);
    if (!row)
        return undefined;
    return {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at || undefined
    };
}
/**
 * 根据用户名查找用户
 *
 * @param username - 用户名
 * @returns 用户对象或undefined
 */
function findByUsername(username) {
    const row = sqlite_1.default.prepare(`
    SELECT id, username, password_hash, role, created_at, last_login_at
    FROM users
    WHERE username = ?
  `).get(username);
    if (!row)
        return undefined;
    return {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at || undefined
    };
}
/**
 * 创建新用户
 *
 * @param user - 用户对象（不含id和createdAt）
 * @returns 创建的用户对象
 */
function create(user) {
    const id = generateId();
    const now = new Date().toISOString();
    sqlite_1.default.prepare(`
    INSERT INTO users (id, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, user.username, user.passwordHash, user.role, now);
    return {
        ...user,
        id,
        createdAt: now
    };
}
/**
 * 更新用户信息
 *
 * @param id - 用户ID
 * @param updates - 要更新的字段
 * @returns 更新后的用户对象或undefined
 */
function update(id, updates) {
    const existing = findById(id);
    if (!existing)
        return undefined;
    const fields = [];
    const values = [];
    if (updates.passwordHash !== undefined) {
        fields.push('password_hash = ?');
        values.push(updates.passwordHash);
    }
    if (updates.role !== undefined) {
        fields.push('role = ?');
        values.push(updates.role);
    }
    if (updates.lastLoginAt !== undefined) {
        fields.push('last_login_at = ?');
        values.push(updates.lastLoginAt);
    }
    if (fields.length === 0)
        return existing;
    values.push(id);
    sqlite_1.default.prepare(`
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = ?
  `).run(...values);
    return findById(id);
}
/**
 * 删除用户
 *
 * @param id - 用户ID
 * @returns 是否删除成功
 */
function remove(id) {
    const result = sqlite_1.default.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
}
/**
 * 检查用户名是否存在
 *
 * @param username - 用户名
 * @returns 是否存在
 */
function existsByUsername(username) {
    const row = sqlite_1.default.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
    return !!row;
}
/**
 * 生成唯一ID
 *
 * @returns 唯一ID字符串
 */
function generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
//# sourceMappingURL=users.js.map