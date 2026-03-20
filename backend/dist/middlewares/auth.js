"use strict";
/**
 * 认证中间件模块
 *
 * 提供 JWT 认证和权限校验功能
 *
 * @module middlewares/auth
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
exports.requireRole = requireRole;
exports.getUserId = getUserId;
exports.requireUserId = requireUserId;
const jwtUtil = __importStar(require("../utils/jwt"));
const errorHandler_1 = require("./errorHandler");
/**
 * 认证中间件
 *
 * 验证请求头中的 JWT Token，将用户信息挂载到 req.user
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 */
const authMiddleware = (req, res, next) => {
    // 从请求头提取 Token
    const token = jwtUtil.extractToken(req.headers.authorization);
    if (!token) {
        return next(new errorHandler_1.AppError('未提供认证令牌', 401, 401));
    }
    // 验证 Token
    const payload = jwtUtil.verifyAccessToken(token);
    if (!payload) {
        return next(new errorHandler_1.AppError('无效或已过期的认证令牌', 401, 401));
    }
    // 将用户信息挂载到请求对象
    req.user = {
        id: payload.id,
        username: payload.username,
        role: payload.role
    };
    next();
};
exports.authMiddleware = authMiddleware;
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
const optionalAuthMiddleware = (req, res, next) => {
    const token = jwtUtil.extractToken(req.headers.authorization);
    if (token) {
        const payload = jwtUtil.verifyAccessToken(token);
        if (payload) {
            req.user = {
                id: payload.id,
                username: payload.username,
                role: payload.role
            };
        }
    }
    next();
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
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
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('未认证', 401, 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('权限不足', 403, 403));
        }
        next();
    };
}
/**
 * 管理员权限中间件
 *
 * 快捷方式，等同于 requireRole('admin')
 */
exports.adminOnly = requireRole('admin');
/**
 * 提取用户ID
 *
 * 从请求对象中获取当前用户ID
 * 如果用户未认证，返回 null
 *
 * @param req - Express 请求对象
 * @returns 用户ID或null
 */
function getUserId(req) {
    return req.user?.id ?? null;
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
function requireUserId(req) {
    if (!req.user?.id) {
        throw new errorHandler_1.AppError('未认证', 401, 401);
    }
    return req.user.id;
}
//# sourceMappingURL=auth.js.map