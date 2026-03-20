/**
 * 认证中间件模块
 *
 * 提供 JWT 认证和权限校验功能
 *
 * @module middlewares/auth
 */

import { Request, Response, NextFunction, RequestHandler } from 'express'
import * as jwtUtil from '../utils/jwt'
import { AppError } from './errorHandler'
import type { JwtPayload } from '../types'

/**
 * 认证中间件
 *
 * 验证请求头中的 JWT Token，将用户信息挂载到 req.user
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 */
export const authMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 从请求头提取 Token
  const token = jwtUtil.extractToken(req.headers.authorization)

  if (!token) {
    return next(new AppError('未提供认证令牌', 401, 401))
  }

  // 验证 Token
  const payload = jwtUtil.verifyAccessToken(token)
  if (!payload) {
    return next(new AppError('无效或已过期的认证令牌', 401, 401))
  }

  // 将用户信息挂载到请求对象
  req.user = {
    id: payload.id,
    username: payload.username,
    role: payload.role
  }

  next()
}

/**
 * 可选认证中间件
 *
 * 尝试验证 Token，但不强制要求认证
 * 如果 Token 有效，则挂载用户信息；否则继续执行
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 */
export const optionalAuthMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = jwtUtil.extractToken(req.headers.authorization)

  if (token) {
    const payload = jwtUtil.verifyAccessToken(token)
    if (payload) {
      req.user = {
        id: payload.id,
        username: payload.username,
        role: payload.role
      }
    }
  }

  next()
}

/**
 * 角色权限中间件工厂
 *
 * 创建检查用户角色的中间件
 *
 * @param roles - 允许的角色列表
 * @returns 角色检查中间件
 *
 * @example
 * router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser)
 */
export function requireRole(...roles: Array<'super' | 'admin' | 'user'>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('未认证', 401, 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('权限不足', 403, 403))
    }

    next()
  }
}

/**
 * 管理员权限中间件
 *
 * 快捷方式，等同于 requireRole('admin')
 */
export const adminOnly: RequestHandler = requireRole('admin')

/**
 * 提取用户ID
 *
 * 从请求对象中获取当前用户ID
 * 如果用户未认证，返回 null
 *
 * @param req - Express 请求对象
 * @returns 用户ID或null
 */
export function getUserId(req: Request): string | null {
  return req.user?.id ?? null
}

/**
 * 要求用户已认证
 *
 * 从请求对象中获取用户ID，如果未认证则抛出错误
 *
 * @param req - Express 请求对象
 * @returns 用户ID
 * @throws 未认证错误
 */
export function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError('未认证', 401, 401)
  }
  return req.user.id
}