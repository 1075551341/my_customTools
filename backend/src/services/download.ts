/**
 * 下载服务模块
 *
 * 提供单文件下载和批量打包下载功能
 *
 * @module services/download
 */

import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import config from '../config'
import logger from '../utils/logger'
import * as tasksDb from '../db/tasks'
import type { BaseTask } from '../types'

/**
 * 下载结果
 */
export interface DownloadResult {
  stream: NodeJS.ReadableStream
  fileName: string
  fileSize: number
  mimeType: string
}

/**
 * 批量下载选项
 */
export interface BatchDownloadOptions {
  taskIds: string[]
  userId: string
}

/**
 * 单文件下载
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID（用于权限验证）
 * @returns 下载结果
 * @throws 任务不存在
 * @throws 无权限
 * @throws 任务未完成
 * @throws 输出文件不存在
 */
export function downloadSingle(taskId: string, userId: string): DownloadResult {
  // 查找任务
  const task = tasksDb.findById(taskId)

  if (!task) {
    throw new Error('任务不存在')
  }

  // 权限验证
  if (task.userId !== userId) {
    throw new Error('无权限下载此任务')
  }

  // 状态验证
  if (task.status !== 'completed') {
    throw new Error('任务未完成，无法下载')
  }

  // 文件存在验证
  if (!task.outputPath || !fs.existsSync(task.outputPath)) {
    throw new Error('输出文件不存在')
  }

  const stat = fs.statSync(task.outputPath)

  return {
    stream: fs.createReadStream(task.outputPath),
    fileName: getOutputFileName(task),
    fileSize: stat.size,
    mimeType: getMimeType(task.outputFormat)
  }
}

/**
 * 批量打包下载
 *
 * @param options - 批量下载选项
 * @returns 下载结果
 * @throws 无有效任务
 */
export async function downloadBatch(options: BatchDownloadOptions): Promise<DownloadResult> {
  const { taskIds, userId } = options

  // 查找并验证所有任务
  const validTasks: BaseTask[] = []
  const errors: string[] = []

  for (const taskId of taskIds) {
    const task = tasksDb.findById(taskId)

    if (!task) {
      errors.push(`任务 ${taskId} 不存在`)
      continue
    }

    if (task.userId !== userId) {
      errors.push(`无权限访问任务 ${taskId}`)
      continue
    }

    if (task.status !== 'completed') {
      errors.push(`任务 ${taskId} 未完成`)
      continue
    }

    if (!task.outputPath || !fs.existsSync(task.outputPath)) {
      errors.push(`任务 ${taskId} 输出文件不存在`)
      continue
    }

    validTasks.push(task)
  }

  if (validTasks.length === 0) {
    throw new Error(`无有效任务可下载: ${errors.join('; ')}`)
  }

  // 记录错误日志
  if (errors.length > 0) {
    logger.warn('批量下载部分任务无效', { errors })
  }

  // 创建 ZIP 打包流
  const archive = archiver('zip', {
    zlib: { level: 6 } // 压缩级别
  })

  // 添加文件到 ZIP
  for (const task of validTasks) {
    const fileName = getOutputFileName(task)
    archive.file(task.outputPath!, { name: fileName })
  }

  // 完成 ZIP 打包
  archive.finalize()

  // 生成 ZIP 文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const zipFileName = `transcode_results_${timestamp}.zip`

  return {
    stream: archive,
    fileName: zipFileName,
    fileSize: 0, // ZIP 流式生成，无法预知大小
    mimeType: 'application/zip'
  }
}

/**
 * 获取输出文件名
 *
 * @param task - 任务对象
 * @returns 文件名
 */
function getOutputFileName(task: BaseTask): string {
  const originalName = task.fileName
  const baseName = path.parse(originalName).name
  return `${baseName}.${task.outputFormat}`
}

/**
 * 获取 MIME 类型
 *
 * @param format - 文件格式
 * @returns MIME 类型
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    // 视频格式
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    // 图片格式
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    // 默认
    default: 'application/octet-stream'
  }

  return mimeTypes[format.toLowerCase()] || mimeTypes.default
}

/**
 * 获取用户下载目录大小
 *
 * @param userId - 用户ID
 * @returns 目录大小（字节）
 */
export function getUserDownloadSize(userId: string): number {
  const outputDir = path.join(config.storage.outputDir, userId)

  if (!fs.existsSync(outputDir)) {
    return 0
  }

  return getDirSize(outputDir)
}

/**
 * 获取目录大小
 *
 * @param dirPath - 目录路径
 * @returns 目录大小（字节）
 */
function getDirSize(dirPath: string): number {
  let totalSize = 0

  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      totalSize += getDirSize(filePath)
    } else {
      totalSize += stat.size
    }
  }

  return totalSize
}

/**
 * 获取用户已完成任务列表（用于下载）
 *
 * @param userId - 用户ID
 * @returns 已完成任务列表
 */
export function getDownloadableTasks(userId: string): BaseTask[] {
  const tasks = tasksDb.findByUserId(userId)
  return tasks.filter(task => task.status === 'completed' && task.outputPath)
}