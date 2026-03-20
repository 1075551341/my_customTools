/**
 * 全局错误处理中间件
 *
 * 捕获所有未处理的错误，统一返回错误响应格式
 *
 * 功能说明：
 * - 捕获同步和异步错误
 * - 区分已知业务错误和未知系统错误
 * - 开发环境返回详细错误堆栈
 * - 生产环境隐藏敏感信息
 *
 * @module middlewares/errorHandler
 */

import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express'
import logger from '../utils/logger'

/**
 * 自定义业务错误类
 *
 * 用于抛出可预期的业务错误，错误信息会直接返回给客户端
 *
 * @example
 * throw new AppError('用户名已存在', 400);
 * throw new AppError('未授权访问', 401);
 */
export class AppError extends Error {
  public code: number
  public statusCode: number
  public isOperational: boolean

  /**
   * 创建业务错误
   *
   * @param message - 错误消息
   * @param code - 业务错误码（默认 400）
   * @param statusCode - HTTP 状态码（默认 400）
   */
  constructor(message: string, code: number = 400, statusCode: number = 400) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = true // 标记为可预期的业务错误
  }
}

/**
 * 验证错误类
 *
 * 用于参数校验失败时返回详细错误信息
 *
 * @example
 * throw new ValidationError('参数校验失败', { username: '用户名不能为空' });
 */
export class ValidationError extends AppError {
  public details: Record<string, string>

  /**
   * 创建验证错误
   *
   * @param message - 错误消息
   * @param details - 详细错误信息（字段名 -> 错误描述）
   */
  constructor(message: string, details: Record<string, string> = {}) {
    super(message, 400, 400)
    this.name = 'ValidationError'
    this.details = details
  }
}

/**
 * 404 处理中间件
 *
 * 当请求路径不存在时触发
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 */
export const notFoundHandler: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`路径不存在: ${req.method} ${req.originalUrl}`, 404, 404)
  next(err)
}

/**
 * 全局错误处理中间件
 *
 * 必须放在所有路由之后注册
 *
 * @param err - 错误对象
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error & Partial<AppError>,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 如果响应已经发送，则交给 Express 默认错误处理
  if (res.headersSent) {
    return next(err)
  }

  // 提取错误信息
  let statusCode = err.statusCode || 500
  let code = err.code || 500
  let message = err.message || '服务器内部错误'
  let details: Record<string, unknown> | null = null

  // 记录错误日志
  if (statusCode >= 500) {
    logger.error('服务器错误', {
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack
    })
  } else {
    logger.warn('业务错误', {
      method: req.method,
      url: req.originalUrl,
      code,
      message
    })
  }

  // 开发环境返回详细堆栈
  if (process.env.NODE_ENV === 'development') {
    details = {
      stack: err.stack
    }
  }

  // 处理特定错误类型
  if (err.name === 'ValidationError' && (err as ValidationError).details) {
    details = { ...details, ...(err as ValidationError).details }
  }

  // JWT 错误处理
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 401
    message = '无效的认证令牌'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    code = 401
    message = '认证令牌已过期'
  }

  // 返回错误响应
  return res.status(statusCode).json({
    code,
    msg: message,
    data: details
  })
}

/**
 * 异步路由包装器
 *
 * 用于包装异步路由处理器，自动捕获 Promise 错误并传递给错误中间件
 *
 * @param fn - 异步路由处理器
 * @returns 包装后的路由处理器
 *
 * @example
 * // 使用方式
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   return success(res, users);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}