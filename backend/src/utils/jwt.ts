/**
 * JWT 工具模块
 *
 * 提供 Token 生成和验证功能
 *
 * @module utils/jwt
 */

import jwt from 'jsonwebtoken'
import config from '../config'
import type { JwtPayload } from '../types'

/**
 * 生成访问令牌
 *
 * @param payload - Token 载荷
 * @returns 访问令牌
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  } as jwt.SignOptions)
}

/**
 * 生成刷新令牌
 *
 * @param payload - Token 载荷
 * @returns 刷新令牌
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  } as jwt.SignOptions)
}

/**
 * 验证访问令牌
 *
 * @param token - 访问令牌
 * @returns 解码后的载荷或null
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload
  } catch {
    return null
  }
}

/**
 * 验证刷新令牌
 *
 * @param token - 刷新令牌
 * @returns 解码后的载荷或null
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload
  } catch {
    return null
  }
}

/**
 * 从请求头提取 Token
 *
 * @param authHeader - Authorization 请求头
 * @returns Token 字符串或null
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}