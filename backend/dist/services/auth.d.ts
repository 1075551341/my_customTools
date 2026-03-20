/**
 * 认证服务模块
 *
 * 提供用户注册、登录、密码管理等功能
 *
 * @module services/auth
 */
import type { User } from '../types';
/**
 * 注册请求参数
 */
export interface RegisterParams {
    username: string;
    password: string;
}
/**
 * 登录请求参数
 */
export interface LoginParams {
    username: string;
    password: string;
}
/**
 * 登录响应
 */
export interface LoginResult {
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
}
/**
 * 注册新用户
 *
 * @param params - 注册参数
 * @returns 登录结果
 * @throws 用户名已存在
 * @throws 系统禁止注册
 */
export declare function register(params: RegisterParams): Promise<LoginResult>;
/**
 * 用户登录
 *
 * @param params - 登录参数
 * @returns 登录结果
 * @throws 用户名或密码错误
 */
export declare function login(params: LoginParams): Promise<LoginResult>;
/**
 * 刷新访问令牌
 *
 * @param refreshToken - 刷新令牌
 * @returns 新的访问令牌和刷新令牌
 * @throws 无效的刷新令牌
 */
export declare function refreshToken(refreshToken: string): {
    accessToken: string;
    refreshToken: string;
};
/**
 * 获取用户信息
 *
 * @param userId - 用户ID
 * @returns 用户信息（不含密码）
 * @throws 用户不存在
 */
export declare function getUserInfo(userId: string): Omit<User, 'passwordHash'>;
/**
 * 修改密码
 *
 * @param userId - 用户ID
 * @param oldPassword - 旧密码
 * @param newPassword - 新密码
 * @throws 用户不存在
 * @throws 旧密码错误
 */
export declare function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
//# sourceMappingURL=auth.d.ts.map