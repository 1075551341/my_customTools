/**
 * 系统配置数据持久化模块
 *
 * 使用 JSON 文件存储系统配置
 *
 * @module db/config
 */

import fs from 'fs'
import path from 'path'
import config from '../config'
import logger from '../utils/logger'

/**
 * 系统配置文件路径
 */
const CONFIG_FILE = path.join(config.storage.dataDir, 'config.json')

/**
 * 视频转码配置
 */
export interface VideoConfig {
  parallelLimit: number
  maxFileSize: number
  allowedInputFormats: string[]
}

/**
 * 图片转码配置
 */
export interface ImgConfig {
  parallelLimit: number
  maxFileSize: number
  allowedInputFormats: string[]
}

/**
 * 上传配置
 */
export interface UploadConfig {
  chunkSize: number
  maxParallelUploads: number
}

/**
 * 存储配置
 */
export interface StorageConfig {
  type: 'local' | 's3'
  uploadDir: string
  outputDir: string
  autoClean: boolean
  cleanDays: number
}

/**
 * 系统配置结构
 */
export interface SystemConfig {
  video: VideoConfig
  img: ImgConfig
  upload: UploadConfig
  storage: StorageConfig
  updatedAt: string
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: SystemConfig = {
  video: {
    parallelLimit: 3,
    maxFileSize: 5368709120, // 5GB
    allowedInputFormats: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ts']
  },
  img: {
    parallelLimit: 5,
    maxFileSize: 52428800, // 50MB
    allowedInputFormats: ['jpg', 'png', 'webp', 'avif', 'bmp', 'tiff', 'gif', 'heic']
  },
  upload: {
    chunkSize: 5242880, // 5MB
    maxParallelUploads: 2
  },
  storage: {
    type: 'local',
    uploadDir: './uploads',
    outputDir: './outputs',
    autoClean: true,
    cleanDays: 7
  },
  updatedAt: new Date().toISOString()
}

/**
 * 确保数据目录存在
 */
function ensureDataDir(): void {
  const dataDir = config.storage.dataDir
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

/**
 * 读取系统配置
 *
 * @returns 系统配置对象
 */
export function read(): SystemConfig {
  ensureDataDir()

  if (!fs.existsSync(CONFIG_FILE)) {
    // 首次运行，创建默认配置
    write(DEFAULT_CONFIG)
    logger.info('创建默认系统配置', { path: CONFIG_FILE })
    return DEFAULT_CONFIG
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
    const savedConfig = JSON.parse(content)

    // 合并默认配置（确保新增字段有默认值）
    return {
      ...DEFAULT_CONFIG,
      ...savedConfig,
      video: { ...DEFAULT_CONFIG.video, ...savedConfig.video },
      img: { ...DEFAULT_CONFIG.img, ...savedConfig.img },
      upload: { ...DEFAULT_CONFIG.upload, ...savedConfig.upload },
      storage: { ...DEFAULT_CONFIG.storage, ...savedConfig.storage }
    }
  } catch (error) {
    logger.error('读取系统配置失败，使用默认配置', { error: (error as Error).message })
    return DEFAULT_CONFIG
  }
}

/**
 * 写入系统配置
 *
 * @param cfg - 系统配置对象
 */
export function write(cfg: SystemConfig): void {
  ensureDataDir()

  cfg.updatedAt = new Date().toISOString()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8')
  logger.info('系统配置已更新', { updatedAt: cfg.updatedAt })
}

/**
 * 更新部分配置
 *
 * @param updates - 要更新的配置项
 * @returns 更新后的完整配置
 */
export function update(updates: Partial<SystemConfig>): SystemConfig {
  const currentConfig = read()

  // 深度合并
  const newConfig: SystemConfig = {
    ...currentConfig,
    ...updates,
    video: { ...currentConfig.video, ...updates.video },
    img: { ...currentConfig.img, ...updates.img },
    upload: { ...currentConfig.upload, ...updates.upload },
    storage: { ...currentConfig.storage, ...updates.storage }
  }

  write(newConfig)
  return newConfig
}

/**
 * 重置为默认配置
 *
 * @returns 默认配置
 */
export function reset(): SystemConfig {
  write(DEFAULT_CONFIG)
  return DEFAULT_CONFIG
}

/**
 * 获取默认配置
 *
 * @returns 默认配置副本
 */
export function getDefaults(): SystemConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
}