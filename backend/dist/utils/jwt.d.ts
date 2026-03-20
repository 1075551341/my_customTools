/**
 * JWT 工具模块
 *
 * 提供 Token 生成和验证功能
 *
 * @module utils/jwt
 */
import type { JwtPayload } from '../types';
/**
 * 生成访问令牌
 *
 * @param payload - Token 载荷
 * @returns 访问令牌
 */
export declare function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
/**
 * 生成刷新令牌
 *
 * @param payload - Token 载荷
 * @returns 刷新令牌
 */
export declare function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
/**
 * 验证访问令牌
 *
 * @param token - 访问令牌
 * @returns 解码后的载荷或null
 */
export declare function verifyAccessToken(token: string): JwtPayload | null;
/**
 * 验证刷新令牌
 *
 * @param token - 刷新令牌
 * @returns 解码后的载荷或null
 */
export declare function verifyRefreshToken(token: string): JwtPayload | null;
/**
 * 从请求头提取 Token
 *
 * @param authHeader - Authorization 请求头
 * @returns Token 字符串或null
 */
export declare function extractToken(authHeader: string | undefined): string | null;
//# sourceMappingURL=jwt.d.ts.map