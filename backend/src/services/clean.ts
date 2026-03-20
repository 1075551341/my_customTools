/**
 * 自动清理服务模块
 *
 * 使用 node-cron 定期清理旧任务和临时文件
 *
 * @module services/clean
 */

import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
import config from '../config'
import logger from '../utils/logger'
import * as tasksDb from '../db/tasks'
import * as storage from '../utils/storage'
import * as configService from './config'

/**
 * 清理任务状态
 */
interface CleanStats {
  tasksRemoved: number
  filesRemoved: number
  spaceFreed: number
  lastRun: string | null
}

/**
 * 清理统计
 */
let cleanStats: CleanStats = {
  tasksRemoved: 0,
  filesRemoved: 0,
  spaceFreed: 0,
  lastRun: null
}

/**
 * 定时任务实例
 */
let scheduledJob: cron.ScheduledTask | null = null

/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
export function cleanOldTasks(maxAgeDays: number = 7): number {
  const count = tasksDb.cleanOldTasks(maxAgeDays)
  logger.info('清理旧任务完成', { count, maxAgeDays })
  return count
}

/**
 * 清理临时文件
 *
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的文件数量
 */
export function cleanTempFiles(maxAgeHours: number = 24): number {
  const tempDir = path.join(config.storage.uploadDir, 'temp')
  const chunksDir = path.join(config.storage.uploadDir, 'chunks')

  let count = 0

  // 清理临时目录
  if (fs.existsSync(tempDir)) {
    count += storage.cleanOldFiles(tempDir, maxAgeHours)
  }

  // 清理分片目录
  if (fs.existsSync(chunksDir)) {
    count += storage.cleanOldFiles(chunksDir, maxAgeHours)
  }

  logger.info('清理临时文件完成', { count, maxAgeHours })
  return count
}

/**
 * 清理用户输出目录中的旧文件
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的文件数量和释放的空间
 */
export function cleanOutputFiles(maxAgeDays: number = 7): { count: number; spaceFreed: number } {
  const outputDir = config.storage.outputDir

  if (!fs.existsSync(outputDir)) {
    return { count: 0, spaceFreed: 0 }
  }

  let count = 0
  let spaceFreed = 0

  const userDirs = fs.readdirSync(outputDir)
  const now = Date.now()
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000

  for (const userDir of userDirs) {
    const userPath = path.join(outputDir, userDir)

    if (!fs.statSync(userPath).isDirectory()) {
      continue
    }

    const files = fs.readdirSync(userPath)

    for (const file of files) {
      const filePath = path.join(userPath, file)

      try {
        const stats = fs.statSync(filePath)
        const age = now - stats.mtime.getTime()

        if (age > maxAgeMs) {
          spaceFreed += stats.size
          fs.unlinkSync(filePath)
          count++
        }
      } catch (error) {
        logger.warn('清理输出文件失败', { path: filePath, error: (error as Error).message })
      }
    }
  }

  logger.info('清理输出文件完成', { count, spaceFreed, maxAgeDays })
  return { count, spaceFreed }
}

/**
 * 执行完整清理
 *
 * @returns 清理统计
 */
export function runFullClean(): CleanStats {
  const storageConfig = configService.getStorageConfig()
  const cleanDays = storageConfig.cleanDays || 7

  logger.info('开始执行自动清理', { cleanDays })

  // 清理旧任务
  const tasksRemoved = cleanOldTasks(cleanDays)

  // 清理临时文件（24小时）
  const tempFiles = cleanTempFiles(24)

  // 清理输出文件
  const { count: outputFiles, spaceFreed } = cleanOutputFiles(cleanDays)

  // 更新统计
  cleanStats = {
    tasksRemoved,
    filesRemoved: tempFiles + outputFiles,
    spaceFreed,
    lastRun: new Date().toISOString()
  }

  logger.info('自动清理完成', cleanStats)
  return cleanStats
}

/**
 * 启动定时清理任务
 *
 * 默认每天凌晨 3 点执行
 *
 * @param cronExpression - cron 表达式
 */
export function startScheduledClean(cronExpression: string = '0 3 * * *'): void {
  if (scheduledJob) {
    logger.warn('定时清理任务已在运行')
    return
  }

  // 验证 cron 表达式
  if (!cron.validate(cronExpression)) {
    throw new Error(`无效的 cron 表达式: ${cronExpression}`)
  }

  scheduledJob = cron.schedule(cronExpression, () => {
    const storageConfig = configService.getStorageConfig()

    if (storageConfig.autoClean) {
      logger.info('定时清理任务触发')
      runFullClean()
    } else {
      logger.debug('自动清理已禁用，跳过定时任务')
    }
  })

  logger.info('定时清理任务已启动', { cron: cronExpression })
}

/**
 * 停止定时清理任务
 */
export function stopScheduledClean(): void {
  if (scheduledJob) {
    scheduledJob.stop()
    scheduledJob = null
    logger.info('定时清理任务已停止')
  }
}

/**
 * 获取清理统计
 *
 * @returns 清理统计
 */
export function getCleanStats(): CleanStats {
  return { ...cleanStats }
}

/**
 * 获取存储使用情况
 *
 * @returns 存储使用情况
 */
export function getStorageUsage(): {
  uploadDir: { size: number; sizeMB: number }
  outputDir: { size: number; sizeMB: number }
  dataDir: { size: number; sizeMB: number }
  total: { size: number; sizeMB: number; sizeGB: number }
} {
  const uploadSize = storage.getDirSize(config.storage.uploadDir)
  const outputSize = storage.getDirSize(config.storage.outputDir)
  const dataSize = storage.getDirSize(config.storage.dataDir)
  const totalSize = uploadSize + outputSize + dataSize

  return {
    uploadDir: {
      size: uploadSize,
      sizeMB: Math.round(uploadSize / 1024 / 1024 * 100) / 100
    },
    outputDir: {
      size: outputSize,
      sizeMB: Math.round(outputSize / 1024 / 1024 * 100) / 100
    },
    dataDir: {
      size: dataSize,
      sizeMB: Math.round(dataSize / 1024 / 1024 * 100) / 100
    },
    total: {
      size: totalSize,
      sizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      sizeGB: Math.round(totalSize / 1024 / 1024 / 1024 * 100) / 100
    }
  }
}