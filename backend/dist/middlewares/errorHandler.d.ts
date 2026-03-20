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
import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
/**
 * 自定义业务错误类
 *
 * 用于抛出可预期的业务错误，错误信息会直接返回给客户端
 *
 * @example
 * throw new AppError('用户名已存在', 400);
 * throw new AppError('未授权访问', 401);
 */
export declare class AppError extends Error {
    code: number;
    statusCode: number;
    isOperational: boolean;
    /**
     * 创建业务错误
     *
     * @param message - 错误消息
     * @param code - 业务错误码（默认 400）
     * @param statusCode - HTTP 状态码（默认 400）
     */
    constructor(message: string, code?: number, statusCode?: number);
}
/**
 * 验证错误类
 *
 * 用于参数校验失败时返回详细错误信息
 *
 * @example
 * throw new ValidationError('参数校验失败', { username: '用户名不能为空' });
 */
export declare class ValidationError extends AppError {
    details: Record<string, string>;
    /**
     * 创建验证错误
     *
     * @param message - 错误消息
     * @param details - 详细错误信息（字段名 -> 错误描述）
     */
    constructor(message: string, details?: Record<string, string>);
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
export declare const notFoundHandler: RequestHandler;
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
export declare const errorHandler: ErrorRequestHandler;
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
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler;
//# sourceMappingURL=errorHandler.d.ts.map