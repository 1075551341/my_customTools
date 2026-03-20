/**
 * 默认配置值
 *
 * 定义所有配置项的默认值，当环境变量未设置时使用
 *
 * @module config/defaults
 */

/**
 * 服务配置
 */
export interface ServerConfig {
  port: number
  nodeEnv: string
  baseUrl: string
}

/**
 * JWT 配置
 */
export interface JwtConfig {
  secret: string
  refreshSecret: string
  expiresIn: string
  refreshExpiresIn: string
}

/**
 * Redis 配置
 */
export interface RedisConfig {
  host: string
  port: number
  password: string
}

/**
 * 存储配置
 */
export interface StorageConfig {
  uploadDir: string
  outputDir: string
  dataDir: string
  logDir: string
}

/**
 * 功能开关配置
 */
export interface FeaturesConfig {
  allowRegister: boolean
  enableRateLimit: boolean
}

/**
 * FFmpeg 配置
 */
export interface FfmpegConfig {
  path: string
  ffprobePath: string
}

/**
 * CORS 配置
 */
export interface CorsConfig {
  origins: string
}

/**
 * 完整配置接口
 */
export interface DefaultConfig {
  server: ServerConfig
  jwt: JwtConfig
  redis: RedisConfig
  storage: StorageConfig
  features: FeaturesConfig
  ffmpeg: FfmpegConfig
  cors: CorsConfig
}

/**
 * 默认配置值
 */
const defaults: DefaultConfig = {
  /**
   * 服务默认配置
   */
  server: {
    port: 3001,
    nodeEnv: 'development',
    baseUrl: 'http://localhost:3001'
  },

  /**
   * JWT 默认配置
   */
  jwt: {
    secret: 'default-jwt-secret-change-in-production',
    refreshSecret: 'default-refresh-secret-change-in-production',
    expiresIn: '2h',
    refreshExpiresIn: '7d'
  },

  /**
   * Redis 默认配置
   */
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: ''
  },

  /**
   * 存储路径默认配置
   */
  storage: {
    uploadDir: './uploads',
    outputDir: './outputs',
    dataDir: './data',
    logDir: './logs'
  },

  /**
   * 功能开关默认配置
   */
  features: {
    allowRegister: true,
    enableRateLimit: true
  },

  /**
   * FFmpeg 默认配置
   */
  ffmpeg: {
    path: '', // 留空则从 PATH 中查找
    ffprobePath: ''
  },

  /**
   * CORS 默认配置
   */
  cors: {
    origins: 'http://localhost:5173,http://localhost:5174,http://localhost:5999,http://localhost:6000,http://localhost:6001'
  }
}

export default defaults