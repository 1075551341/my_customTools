/**
 * 配置模块主入口
 *
 * 功能说明：
 * - 合并环境变量和持久化配置
 * - 提供统一的配置访问接口
 * - 支持配置热更新
 *
 * @module config
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import defaults from './defaults'

// 加载 .env 文件
dotenv.config({ path: path.join(__dirname, '../../.env') })

// 数据目录路径
const DATA_DIR = process.env.DATA_DIR || './data'
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

/**
 * 视频配置接口
 */
interface VideoConfig {
  parallelLimit: number
  maxFileSize: number
  allowedInputFormats: string[]
}

/**
 * 图片配置接口
 */
interface ImgConfig {
  parallelLimit: number
  maxFileSize: number
  allowedInputFormats: string[]
}

/**
 * 上传配置接口
 */
interface UploadConfig {
  chunkSize: number
  maxParallelUploads: number
}

/**
 * 应用配置接口
 */
interface AppConfig {
  server: {
    port: number
    nodeEnv: string
    baseUrl: string
  }
  jwt: {
    secret: string
    refreshSecret: string
    expiresIn: string
    refreshExpiresIn: string
  }
  redis: {
    host: string
    port: number
    password: string
  }
  storage: {
    uploadDir: string
    outputDir: string
    dataDir: string
    logDir: string
  }
  features: {
    allowRegister: boolean
    enableRateLimit: boolean
  }
  ffmpeg: {
    path: string
    ffprobePath: string
  }
  cors: {
    origins: string[]
  }
  video: VideoConfig
  img: ImgConfig
  upload: UploadConfig
}

/**
 * 从 JSON 文件加载持久化配置
 *
 * @returns 持久化配置对象
 */
function loadPersistedConfig(): Partial<AppConfig> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.warn('加载持久化配置失败，使用默认配置:', (error as Error).message)
  }
  return {}
}

/**
 * 合并配置
 *
 * 优先级：环境变量 > 持久化配置 > 默认配置
 *
 * @param key - 配置键名
 * @param defaultValue - 默认值
 * @returns 最终配置值
 */
function getConfigValue<T>(key: string, defaultValue: T): T {
  // 优先使用环境变量
  if (process.env[key] !== undefined) {
    const envValue = process.env[key]
    // 尝试解析布尔值
    if (envValue === 'true') return true as T
    if (envValue === 'false') return false as T
    // 尝试解析数字
    const num = Number(envValue)
    if (!isNaN(num)) return num as T
    return envValue as T
  }
  return defaultValue
}

/**
 * 应用配置对象
 *
 * 包含所有配置项，按模块分组
 */
const config: AppConfig = {
  /**
   * 服务配置
   */
  server: {
    port: getConfigValue('PORT', defaults.server.port),
    nodeEnv: getConfigValue('NODE_ENV', defaults.server.nodeEnv),
    baseUrl: getConfigValue('BASE_URL', defaults.server.baseUrl)
  },

  /**
   * JWT 认证配置
   */
  jwt: {
    secret: getConfigValue('JWT_SECRET', defaults.jwt.secret),
    refreshSecret: getConfigValue('JWT_REFRESH_SECRET', defaults.jwt.refreshSecret),
    expiresIn: getConfigValue('JWT_EXPIRES_IN', defaults.jwt.expiresIn),
    refreshExpiresIn: getConfigValue('JWT_REFRESH_EXPIRES_IN', defaults.jwt.refreshExpiresIn)
  },

  /**
   * Redis 配置
   */
  redis: {
    host: getConfigValue('REDIS_HOST', defaults.redis.host),
    port: getConfigValue('REDIS_PORT', defaults.redis.port),
    password: getConfigValue('REDIS_PASSWORD', defaults.redis.password)
  },

  /**
   * 存储路径配置
   */
  storage: {
    uploadDir: getConfigValue('UPLOAD_DIR', defaults.storage.uploadDir),
    outputDir: getConfigValue('OUTPUT_DIR', defaults.storage.outputDir),
    dataDir: DATA_DIR,
    logDir: getConfigValue('LOG_DIR', defaults.storage.logDir)
  },

  /**
   * 功能开关配置
   */
  features: {
    allowRegister: getConfigValue('ALLOW_REGISTER', defaults.features.allowRegister),
    enableRateLimit: getConfigValue('ENABLE_RATE_LIMIT', defaults.features.enableRateLimit)
  },

  /**
   * FFmpeg 配置
   */
  ffmpeg: {
    path: getConfigValue('FFMPEG_PATH', defaults.ffmpeg.path),
    ffprobePath: getConfigValue('FFPROBE_PATH', defaults.ffmpeg.ffprobePath)
  },

  /**
   * CORS 配置
   */
  cors: {
    origins: (getConfigValue('CORS_ORIGINS', defaults.cors.origins) as string).split(',').map(s => s.trim())
  },

  /**
   * 视频转码配置（从持久化配置加载或使用默认值）
   */
  video: {
    parallelLimit: 3,
    maxFileSize: 5368709120, // 5GB
    allowedInputFormats: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ts']
  },

  /**
   * 图片转码配置（从持久化配置加载或使用默认值）
   */
  img: {
    parallelLimit: 5,
    maxFileSize: 52428800, // 50MB
    allowedInputFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'tiff', 'gif', 'heic']
  },

  /**
   * 上传配置
   */
  upload: {
    chunkSize: 5242880, // 5MB
    maxParallelUploads: 2
  }
}

// 合并持久化配置
const persistedConfig = loadPersistedConfig()
if (persistedConfig.video) {
  config.video = { ...config.video, ...persistedConfig.video }
}
if (persistedConfig.img) {
  config.img = { ...config.img, ...persistedConfig.img }
}
if (persistedConfig.upload) {
  config.upload = { ...config.upload, ...persistedConfig.upload }
}

export default config