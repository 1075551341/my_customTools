"use strict";
/**
 * JWT 工具模块
 *
 * 提供 Token 生成和验证功能
 *
 * @module utils/jwt
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.extractToken = extractToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
/**
 * 生成访问令牌
 *
 * @param payload - Token 载荷
 * @returns 访问令牌
 */
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, {
        expiresIn: config_1.default.jwt.expiresIn
    });
}
/**
 * 生成刷新令牌
 *
 * @param payload - Token 载荷
 * @returns 刷新令牌
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.refreshSecret, {
        expiresIn: config_1.default.jwt.refreshExpiresIn
    });
}
/**
 * 验证访问令牌
 *
 * @param token - 访问令牌
 * @returns 解码后的载荷或null
 */
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
    }
    catch {
        return null;
    }
}
/**
 * 验证刷新令牌
 *
 * @param token - 刷新令牌
 * @returns 解码后的载荷或null
 */
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.default.jwt.refreshSecret);
    }
    catch {
        return null;
    }
}
/**
 * 从请求头提取 Token
 *
 * @param authHeader - Authorization 请求头
 * @returns Token 字符串或null
 */
function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
//# sourceMappingURL=jwt.js.map