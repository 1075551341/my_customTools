"use strict";
/**
 * 认证服务模块
 *
 * 提供用户注册、登录、密码管理等功能
 *
 * @module services/auth
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.getUserInfo = getUserInfo;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const usersDb = __importStar(require("../db/users"));
const jwtUtil = __importStar(require("../utils/jwt"));
const config_1 = __importDefault(require("../config"));
/**
 * 注册新用户
 *
 * @param params - 注册参数
 * @returns 登录结果
 * @throws 用户名已存在
 * @throws 系统禁止注册
 */
async function register(params) {
    // 检查是否允许注册
    if (!config_1.default.features.allowRegister) {
        throw new Error('系统已关闭注册功能');
    }
    const { username, password } = params;
    // 验证用户名
    if (!username || username.length < 3 || username.length > 20) {
        throw new Error('用户名长度必须在 3-20 个字符之间');
    }
    // 验证密码
    if (!password || password.length < 6) {
        throw new Error('密码长度至少 6 个字符');
    }
    // 检查用户名是否已存在
    if (usersDb.existsByUsername(username)) {
        throw new Error('用户名已存在');
    }
    // 哈希密码
    const passwordHash = await hashPassword(password);
    // 创建用户（第一个用户自动设为管理员）
    const isFirstUser = usersDb.findAll().length === 0;
    const user = usersDb.create({
        username,
        passwordHash,
        role: isFirstUser ? 'admin' : 'user'
    });
    // 生成 Token
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = jwtUtil.generateAccessToken(tokenPayload);
    const refreshToken = jwtUtil.generateRefreshToken(tokenPayload);
    // 返回结果（不包含密码哈希）
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken
    };
}
/**
 * 用户登录
 *
 * @param params - 登录参数
 * @returns 登录结果
 * @throws 用户名或密码错误
 */
async function login(params) {
    const { username, password } = params;
    // 查找用户
    const user = usersDb.findByUsername(username);
    if (!user) {
        throw new Error('用户名或密码错误');
    }
    // 验证密码
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        throw new Error('用户名或密码错误');
    }
    // 更新最后登录时间
    usersDb.update(user.id, { lastLoginAt: new Date().toISOString() });
    // 生成 Token
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = jwtUtil.generateAccessToken(tokenPayload);
    const refreshToken = jwtUtil.generateRefreshToken(tokenPayload);
    // 返回结果
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken
    };
}
/**
 * 刷新访问令牌
 *
 * @param refreshToken - 刷新令牌
 * @returns 新的访问令牌和刷新令牌
 * @throws 无效的刷新令牌
 */
function refreshToken(refreshToken) {
    const payload = jwtUtil.verifyRefreshToken(refreshToken);
    if (!payload) {
        throw new Error('无效的刷新令牌');
    }
    // 检查用户是否仍然存在
    const user = usersDb.findById(payload.id);
    if (!user) {
        throw new Error('用户不存在');
    }
    // 生成新的 Token
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    return {
        accessToken: jwtUtil.generateAccessToken(tokenPayload),
        refreshToken: jwtUtil.generateRefreshToken(tokenPayload)
    };
}
/**
 * 获取用户信息
 *
 * @param userId - 用户ID
 * @returns 用户信息（不含密码）
 * @throws 用户不存在
 */
function getUserInfo(userId) {
    const user = usersDb.findById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
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
async function changePassword(userId, oldPassword, newPassword) {
    const user = usersDb.findById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) {
        throw new Error('旧密码错误');
    }
    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
        throw new Error('新密码长度至少 6 个字符');
    }
    // 哈希新密码并更新
    const passwordHash = await hashPassword(newPassword);
    usersDb.update(userId, { passwordHash });
}
/**
 * 哈希密码
 *
 * @param password - 明文密码
 * @returns 密码哈希
 */
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
/**
 * 验证密码
 *
 * @param password - 明文密码
 * @param hash - 密码哈希
 * @returns 是否匹配
 */
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
//# sourceMappingURL=auth.js.map