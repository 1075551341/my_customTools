/**
 * JWT 工具模块
 *
 * 提供 Token 生成和验证功能
 * 支持 HttpOnly Cookie 安全存储
 *
 * @module utils/jwt
 */

import jwt from "jsonwebtoken";
import { Response } from "express";
import config from "../config";
import type { JwtPayload } from "../types";

/** Cookie 名称常量 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

/** Cookie 配置 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
} as const;

/**
 * 生成访问令牌
 *
 * @param payload - Token 载荷
 * @returns 访问令牌
 */
export function generateAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

/**
 * 生成刷新令牌
 *
 * @param payload - Token 载荷
 * @returns 刷新令牌
 */
export function generateRefreshToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

/**
 * 验证访问令牌
 *
 * @param token - 访问令牌
 * @returns 解码后的载荷或null
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    return null;
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
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 从请求头提取 Token
 *
 * @param authHeader - Authorization 请求头
 * @returns Token 字符串或null
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * 设置认证 Cookie
 *
 * 将 accessToken 和 refreshToken 设置为 HttpOnly Cookie
 *
 * @param res - Express 响应对象
 * @param accessToken - 访问令牌
 * @param refreshToken - 刷新令牌
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  // accessToken 有效期较短（如 15 分钟）
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: parseTimeToMs(config.jwt.expiresIn),
  });

  // refreshToken 有效期较长（如 7 天）
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: parseTimeToMs(config.jwt.refreshExpiresIn),
  });
}

/**
 * 清除认证 Cookie
 *
 * @param res - Express 响应对象
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { path: "/" });
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: "/" });
}

/**
 * 从 Cookie 提取 Token
 *
 * @param cookies - 请求 cookies 对象
 * @returns accessToken 和 refreshToken
 */
export function extractTokensFromCookies(
  cookies: Record<string, string> | undefined,
): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: cookies?.[COOKIE_NAMES.ACCESS_TOKEN] ?? null,
    refreshToken: cookies?.[COOKIE_NAMES.REFRESH_TOKEN] ?? null,
  };
}

/**
 * 解析时间字符串为毫秒
 *
 * @param timeStr - 时间字符串（如 '15m', '7d', '1h'）
 * @returns 毫秒数
 */
function parseTimeToMs(timeStr: string): number {
  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(0, -1), 10);

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return value; // 假设已经是毫秒
  }
}
