/**
 * 认证服务模块
 *
 * 提供用户注册、登录、密码管理等功能
 *
 * @module services/auth
 */

import bcrypt from 'bcryptjs'
import * as usersDb from '../db/users'
import * as jwtUtil from '../utils/jwt'
import config from '../config'
import type { User } from '../types'

/**
 * 注册请求参数
 */
export interface RegisterParams {
  username: string
  password: string
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string
  password: string
}

/**
 * 登录响应
 */
export interface LoginResult {
  user: Omit<User, 'passwordHash'>
  accessToken: string
  refreshToken: string
}

/**
 * 注册新用户
 *
 * @param params - 注册参数
 * @returns 登录结果
 * @throws 用户名已存在
 * @throws 系统禁止注册
 */
export async function register(params: RegisterParams): Promise<LoginResult> {
  // 检查是否允许注册
  if (!config.features.allowRegister) {
    throw new Error('系统已关闭注册功能')
  }

  const { username, password } = params

  // 验证用户名
  if (!username || username.length < 3 || username.length > 20) {
    throw new Error('用户名长度必须在 3-20 个字符之间')
  }

  // 验证密码
  if (!password || password.length < 6) {
    throw new Error('密码长度至少 6 个字符')
  }

  // 检查用户名是否已存在
  if (usersDb.existsByUsername(username)) {
    throw new Error('用户名已存在')
  }

  // 哈希密码
  const passwordHash = await hashPassword(password)

  // 创建用户（第一个用户自动设为管理员）
  const isFirstUser = usersDb.findAll().length === 0
  const user = usersDb.create({
    username,
    passwordHash,
    role: isFirstUser ? 'admin' : 'user'
  })

  // 生成 Token
  const tokenPayload = { id: user.id, username: user.username, role: user.role }
  const accessToken = jwtUtil.generateAccessToken(tokenPayload)
  const refreshToken = jwtUtil.generateRefreshToken(tokenPayload)

  // 返回结果（不包含密码哈希）
  const { passwordHash: _, ...userWithoutPassword } = user
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken
  }
}

/**
 * 用户登录
 *
 * @param params - 登录参数
 * @returns 登录结果
 * @throws 用户名或密码错误
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  const { username, password } = params

  // 查找用户
  const user = usersDb.findByUsername(username)
  if (!user) {
    throw new Error('用户名或密码错误')
  }

  // 验证密码
  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    throw new Error('用户名或密码错误')
  }

  // 更新最后登录时间
  usersDb.update(user.id, { lastLoginAt: new Date().toISOString() })

  // 生成 Token
  const tokenPayload = { id: user.id, username: user.username, role: user.role }
  const accessToken = jwtUtil.generateAccessToken(tokenPayload)
  const refreshToken = jwtUtil.generateRefreshToken(tokenPayload)

  // 返回结果
  const { passwordHash: _, ...userWithoutPassword } = user
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken
  }
}

/**
 * 刷新访问令牌
 *
 * @param refreshToken - 刷新令牌
 * @returns 新的访问令牌和刷新令牌
 * @throws 无效的刷新令牌
 */
export function refreshToken(refreshToken: string): { accessToken: string; refreshToken: string } {
  const payload = jwtUtil.verifyRefreshToken(refreshToken)
  if (!payload) {
    throw new Error('无效的刷新令牌')
  }

  // 检查用户是否仍然存在
  const user = usersDb.findById(payload.id)
  if (!user) {
    throw new Error('用户不存在')
  }

  // 生成新的 Token
  const tokenPayload = { id: user.id, username: user.username, role: user.role }
  return {
    accessToken: jwtUtil.generateAccessToken(tokenPayload),
    refreshToken: jwtUtil.generateRefreshToken(tokenPayload)
  }
}

/**
 * 获取用户信息
 *
 * @param userId - 用户ID
 * @returns 用户信息（不含密码）
 * @throws 用户不存在
 */
export function getUserInfo(userId: string): Omit<User, 'passwordHash'> {
  const user = usersDb.findById(userId)
  if (!user) {
    throw new Error('用户不存在')
  }

  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 修改密码
 *
 * @param userId - 用户ID
 * @param oldPassword - 旧密码
 * @param newPassword - 新密码
 * @throws 用户不存在
 * @throws 旧密码错误
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const user = usersDb.findById(userId)
  if (!user) {
    throw new Error('用户不存在')
  }

  // 验证旧密码
  const isValid = await verifyPassword(oldPassword, user.passwordHash)
  if (!isValid) {
    throw new Error('旧密码错误')
  }

  // 验证新密码
  if (!newPassword || newPassword.length < 6) {
    throw new Error('新密码长度至少 6 个字符')
  }

  // 哈希新密码并更新
  const passwordHash = await hashPassword(newPassword)
  usersDb.update(userId, { passwordHash })
}

/**
 * 哈希密码
 *
 * @param password - 明文密码
 * @returns 密码哈希
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * 验证密码
 *
 * @param password - 明文密码
 * @param hash - 密码哈希
 * @returns 是否匹配
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}