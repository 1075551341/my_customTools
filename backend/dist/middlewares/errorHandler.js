"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.ValidationError = exports.AppError = void 0;
exports.asyncHandler = asyncHandler;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 自定义业务错误类
 *
 * 用于抛出可预期的业务错误，错误信息会直接返回给客户端
 *
 * @example
 * throw new AppError('用户名已存在', 400);
 * throw new AppError('未授权访问', 401);
 */
class AppError extends Error {
    code;
    statusCode;
    isOperational;
    /**
     * 创建业务错误
     *
     * @param message - 错误消息
     * @param code - 业务错误码（默认 400）
     * @param statusCode - HTTP 状态码（默认 400）
     */
    constructor(message, code = 400, statusCode = 400) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = true; // 标记为可预期的业务错误
    }
}
exports.AppError = AppError;
/**
 * 验证错误类
 *
 * 用于参数校验失败时返回详细错误信息
 *
 * @example
 * throw new ValidationError('参数校验失败', { username: '用户名不能为空' });
 */
class ValidationError extends AppError {
    details;
    /**
     * 创建验证错误
     *
     * @param message - 错误消息
     * @param details - 详细错误信息（字段名 -> 错误描述）
     */
    constructor(message, details = {}) {
        super(message, 400, 400);
        this.name = 'ValidationError';
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
/**
 * 404 处理中间件
 *
 * 当请求路径不存在时触发
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 */
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`路径不存在: ${req.method} ${req.originalUrl}`, 404, 404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
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
const errorHandler = (err, req, res, next) => {
    // 如果响应已经发送，则交给 Express 默认错误处理
    if (res.headersSent) {
        return next(err);
    }
    // 提取错误信息
    let statusCode = err.statusCode || 500;
    let code = err.code || 500;
    let message = err.message || '服务器内部错误';
    let details = null;
    // 记录错误日志
    if (statusCode >= 500) {
        logger_1.default.error('服务器错误', {
            method: req.method,
            url: req.originalUrl,
            error: err.message,
            stack: err.stack
        });
    }
    else {
        logger_1.default.warn('业务错误', {
            method: req.method,
            url: req.originalUrl,
            code,
            message
        });
    }
    // 开发环境返回详细堆栈
    if (process.env.NODE_ENV === 'development') {
        details = {
            stack: err.stack
        };
    }
    // 处理特定错误类型
    if (err.name === 'ValidationError' && err.details) {
        details = { ...details, ...err.details };
    }
    // JWT 错误处理
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 401;
        message = '无效的认证令牌';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 401;
        message = '认证令牌已过期';
    }
    // 返回错误响应
    return res.status(statusCode).json({
        code,
        msg: message,
        data: details
    });
};
exports.errorHandler = errorHandler;
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
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map