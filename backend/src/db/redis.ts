/**
 * Redis 连接模块
 *
 * 提供缓存、Session、Token 黑名单等功能
 *
 * @module db/redis
 */

import Redis from 'ioredis'
import config from '../config'

// 创建 Redis 连接
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.error('[Redis] 连接失败，已放弃重试')
      return null
    }
    console.log(`[Redis] 正在重连... (${times}/3)`)
    return Math.min(times * 1000, 3000)
  },
})

redis.on('connect', () => {
  console.log('[Redis] 连接成功')
})

redis.on('error', (err) => {
  console.error('[Redis] 连接错误:', err.message)
})

redis.on('close', () => {
  console.log('[Redis] 连接已关闭')
})

/**
 * 缓存键前缀
 */
const CACHE_PREFIX = 'cache:'
const SESSION_PREFIX = 'session:'
const TOKEN_BLACKLIST_PREFIX = 'token:blacklist:'

/**
 * 缓存操作
 */
export const cache = {
  /**
   * 设置缓存
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（秒）
   */
  async set(key: string, value: unknown, ttl: number = 300): Promise<void> {
    const data = JSON.stringify(value)
    await redis.setex(`${CACHE_PREFIX}${key}`, ttl, data)
  },

  /**
   * 获取缓存
   * @param key - 缓存键
   * @returns 缓存值或 null
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(`${CACHE_PREFIX}${key}`)
    if (!data) return null
    try {
      return JSON.parse(data) as T
    } catch {
      return null
    }
  },

  /**
   * 删除缓存
   * @param key - 缓存键
   */
  async del(key: string): Promise<void> {
    await redis.del(`${CACHE_PREFIX}${key}`)
  },

  /**
   * 批量删除缓存
   * @param pattern - 缓存键模式
   */
  async delPattern(pattern: string): Promise<number> {
    const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`)
    if (keys.length === 0) return 0
    return redis.del(...keys)
  },
}

/**
 * Session 操作
 */
export const session = {
  /**
   * 设置 Session
   * @param sessionId - Session ID
   * @param data - Session 数据
   * @param ttl - 过期时间（秒），默认 7 天
   */
  async set(sessionId: string, data: Record<string, unknown>, ttl: number = 604800): Promise<void> {
    await redis.setex(`${SESSION_PREFIX}${sessionId}`, ttl, JSON.stringify(data))
  },

  /**
   * 获取 Session
   * @param sessionId - Session ID
   */
  async get<T extends Record<string, unknown>>(sessionId: string): Promise<T | null> {
    const data = await redis.get(`${SESSION_PREFIX}${sessionId}`)
    if (!data) return null
    try {
      return JSON.parse(data) as T
    } catch {
      return null
    }
  },

  /**
   * 删除 Session
   * @param sessionId - Session ID
   */
  async del(sessionId: string): Promise<void> {
    await redis.del(`${SESSION_PREFIX}${sessionId}`)
  },

  /**
   * 刷新 Session 过期时间
   * @param sessionId - Session ID
   * @param ttl - 过期时间（秒）
   */
  async refresh(sessionId: string, ttl: number = 604800): Promise<boolean> {
    const result = await redis.expire(`${SESSION_PREFIX}${sessionId}`, ttl)
    return result === 1
  },
}

/**
 * Token 黑名单操作
 */
export const tokenBlacklist = {
  /**
   * 将 Token 加入黑名单
   * @param tokenId - Token 唯一标识
   * @param ttl - 过期时间（秒）
   */
  async add(tokenId: string, ttl: number): Promise<void> {
    await redis.setex(`${TOKEN_BLACKLIST_PREFIX}${tokenId}`, ttl, '1')
  },

  /**
   * 检查 Token 是否在黑名单中
   * @param tokenId - Token 唯一标识
   */
  async has(tokenId: string): Promise<boolean> {
    const result = await redis.exists(`${TOKEN_BLACKLIST_PREFIX}${tokenId}`)
    return result === 1
  },
}

export default redis