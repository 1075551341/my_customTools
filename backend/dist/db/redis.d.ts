/**
 * Redis 连接模块
 *
 * 提供缓存、Session、Token 黑名单等功能
 *
 * @module db/redis
 */
import Redis from 'ioredis';
declare const redis: Redis;
/**
 * 缓存操作
 */
export declare const cache: {
    /**
     * 设置缓存
     * @param key - 缓存键
     * @param value - 缓存值
     * @param ttl - 过期时间（秒）
     */
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    /**
     * 获取缓存
     * @param key - 缓存键
     * @returns 缓存值或 null
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * 删除缓存
     * @param key - 缓存键
     */
    del(key: string): Promise<void>;
    /**
     * 批量删除缓存
     * @param pattern - 缓存键模式
     */
    delPattern(pattern: string): Promise<number>;
};
/**
 * Session 操作
 */
export declare const session: {
    /**
     * 设置 Session
     * @param sessionId - Session ID
     * @param data - Session 数据
     * @param ttl - 过期时间（秒），默认 7 天
     */
    set(sessionId: string, data: Record<string, unknown>, ttl?: number): Promise<void>;
    /**
     * 获取 Session
     * @param sessionId - Session ID
     */
    get<T extends Record<string, unknown>>(sessionId: string): Promise<T | null>;
    /**
     * 删除 Session
     * @param sessionId - Session ID
     */
    del(sessionId: string): Promise<void>;
    /**
     * 刷新 Session 过期时间
     * @param sessionId - Session ID
     * @param ttl - 过期时间（秒）
     */
    refresh(sessionId: string, ttl?: number): Promise<boolean>;
};
/**
 * Token 黑名单操作
 */
export declare const tokenBlacklist: {
    /**
     * 将 Token 加入黑名单
     * @param tokenId - Token 唯一标识
     * @param ttl - 过期时间（秒）
     */
    add(tokenId: string, ttl: number): Promise<void>;
    /**
     * 检查 Token 是否在黑名单中
     * @param tokenId - Token 唯一标识
     */
    has(tokenId: string): Promise<boolean>;
};
export default redis;
//# sourceMappingURL=redis.d.ts.map