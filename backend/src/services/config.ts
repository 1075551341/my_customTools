/**
 * 配置服务模块
 *
 * 提供系统配置管理功能
 *
 * @module services/config
 */

import * as configDb from '../db/config'
import type { SystemConfig, VideoConfig, ImgConfig, UploadConfig, StorageConfig } from '../db/config'

/**
 * 获取系统配置
 *
 * @returns 系统配置
 */
export function getConfig(): SystemConfig {
  return configDb.read()
}

/**
 * 更新系统配置
 *
 * @param updates - 要更新的配置项
 * @returns 更新后的完整配置
 */
export function updateConfig(updates: Partial<SystemConfig>): SystemConfig {
  // 验证配置值
  validateConfig(updates)

  return configDb.update(updates)
}

/**
 * 重置为默认配置
 *
 * @returns 默认配置
 */
export function resetConfig(): SystemConfig {
  return configDb.reset()
}

/**
 * 获取视频转码配置
 *
 * @returns 视频配置
 */
export function getVideoConfig(): VideoConfig {
  const config = getConfig()
  return config.video
}

/**
 * 获取图片转码配置
 *
 * @returns 图片配置
 */
export function getImgConfig(): ImgConfig {
  const config = getConfig()
  return config.img
}

/**
 * 获取上传配置
 *
 * @returns 上传配置
 */
export function getUploadConfig(): UploadConfig {
  const config = getConfig()
  return config.upload
}

/**
 * 获取存储配置
 *
 * @returns 存储配置
 */
export function getStorageConfig(): StorageConfig {
  const config = getConfig()
  return config.storage
}

/**
 * 验证配置值
 *
 * @param config - 配置对象
 * @throws 配置验证失败
 */
function validateConfig(config: Partial<SystemConfig>): void {
  // 验证视频配置
  if (config.video) {
    if (config.video.parallelLimit && (config.video.parallelLimit < 1 || config.video.parallelLimit > 10)) {
      throw new Error('视频并行转码数必须在 1-10 之间')
    }
    if (config.video.maxFileSize && config.video.maxFileSize < 1048576) {
      throw new Error('视频最大文件大小不能小于 1MB')
    }
  }

  // 验证图片配置
  if (config.img) {
    if (config.img.parallelLimit && (config.img.parallelLimit < 1 || config.img.parallelLimit > 20)) {
      throw new Error('图片并行转码数必须在 1-20 之间')
    }
    if (config.img.maxFileSize && config.img.maxFileSize < 1048576) {
      throw new Error('图片最大文件大小不能小于 1MB')
    }
  }

  // 验证上传配置
  if (config.upload) {
    if (config.upload.chunkSize && (config.upload.chunkSize < 1048576 || config.upload.chunkSize > 104857600)) {
      throw new Error('分片大小必须在 1MB-100MB 之间')
    }
    if (config.upload.maxParallelUploads && (config.upload.maxParallelUploads < 1 || config.upload.maxParallelUploads > 5)) {
      throw new Error('并行上传数必须在 1-5 之间')
    }
  }

  // 验证存储配置
  if (config.storage) {
    if (config.storage.cleanDays && (config.storage.cleanDays < 1 || config.storage.cleanDays > 30)) {
      throw new Error('清理天数必须在 1-30 之间')
    }
  }
}

/**
 * 获取配置对比（当前 vs 默认）
 *
 * @returns 配置对比信息
 */
export function getConfigDiff(): {
  current: SystemConfig
  defaults: SystemConfig
  changed: string[]
} {
  const current = getConfig()
  const defaults = configDb.getDefaults()
  const changed: string[] = []

  // 比较配置变化
  if (JSON.stringify(current.video) !== JSON.stringify(defaults.video)) {
    changed.push('video')
  }
  if (JSON.stringify(current.img) !== JSON.stringify(defaults.img)) {
    changed.push('img')
  }
  if (JSON.stringify(current.upload) !== JSON.stringify(defaults.upload)) {
    changed.push('upload')
  }
  if (JSON.stringify(current.storage) !== JSON.stringify(defaults.storage)) {
    changed.push('storage')
  }

  return { current, defaults, changed }
}