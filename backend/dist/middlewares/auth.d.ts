/**
 * 认证中间件模块
 *
 * 提供 JWT 认证和权限校验功能
 *
 * @module middlewares/auth
 */
import { Request, RequestHandler } from 'express';
/**
 * 认证中间件
 *
 * 验证请求头中的 JWT Token，将用户信息挂载到 req.user
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 */
export declare const authMiddleware: RequestHandler;
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
export declare const optionalAuthMiddleware: RequestHandler;
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
export declare function requireRole(...roles: Array<'admin' | 'user'>): RequestHandler;
/**
 * 管理员权限中间件
 *
 * 快捷方式，等同于 requireRole('admin')
 */
export declare const adminOnly: RequestHandler;
/**
 * 提取用户ID
 *
 * 从请求对象中获取当前用户ID
 * 如果用户未认证，返回 null
 *
 * @param req - Express 请求对象
 * @returns 用户ID或null
 */
export declare function getUserId(req: Request): string | null;
/**
 * 要求用户已认证
 *
 * 从请求对象中获取用户ID，如果未认证则抛出错误
 *
 * @param req - Express 请求对象
 * @returns 用户ID
 * @throws 未认证错误
 */
export declare function requireUserId(req: Request): string;
//# sourceMappingURL=auth.d.ts.map