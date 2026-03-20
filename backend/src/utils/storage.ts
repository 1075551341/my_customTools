/**
 * 文件存储工具模块
 *
 * 提供文件和目录管理功能
 *
 * @module utils/storage
 */

import fs from 'fs'
import path from 'path'
import config from '../config'
import logger from './logger'

/**
 * 确保目录存在
 *
 * @param dirPath - 目录路径
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    logger.debug('创建目录', { path: dirPath })
  }
}

/**
 * 确保所有必要的存储目录存在
 */
export function ensureStorageDirs(): void {
  ensureDir(config.storage.uploadDir)
  ensureDir(config.storage.outputDir)
  ensureDir(config.storage.dataDir)
  ensureDir(config.storage.logDir)
  ensureDir(getChunksDir())
  logger.info('存储目录初始化完成', {
    upload: config.storage.uploadDir,
    output: config.storage.outputDir,
    chunks: getChunksDir()
  })
}

/**
 * 获取分片存储目录
 *
 * @returns 分片目录路径
 */
export function getChunksDir(): string {
  return path.join(config.storage.uploadDir, 'chunks')
}

/**
 * 获取用户上传目录
 *
 * @param userId - 用户ID
 * @returns 用户上传目录路径
 */
export function getUserUploadDir(userId: string): string {
  const userDir = path.join(config.storage.uploadDir, userId)
  ensureDir(userDir)
  return userDir
}

/**
 * 获取用户输出目录
 *
 * @param userId - 用户ID
 * @returns 用户输出目录路径
 */
export function getUserOutputDir(userId: string): string {
  const userDir = path.join(config.storage.outputDir, userId)
  ensureDir(userDir)
  return userDir
}

/**
 * 获取分片文件路径
 *
 * @param uploadId - 上传ID
 * @param chunkIndex - 分片索引
 * @returns 分片文件路径
 */
export function getChunkPath(uploadId: string, chunkIndex: number): string {
  const chunksDir = getChunksDir()
  ensureDir(chunksDir)
  return path.join(chunksDir, `${uploadId}_${chunkIndex}`)
}

/**
 * 获取上传临时文件路径
 *
 * @param uploadId - 上传ID
 * @param fileName - 文件名
 * @returns 临时文件路径
 */
export function getTempFilePath(uploadId: string, fileName: string): string {
  const tempDir = path.join(config.storage.uploadDir, 'temp')
  ensureDir(tempDir)
  return path.join(tempDir, `${uploadId}_${fileName}`)
}

/**
 * 合并分片文件
 *
 * @param uploadId - 上传ID
 * @param totalChunks - 总分片数
 * @param outputPath - 输出文件路径
 * @returns 合并是否成功
 */
export async function mergeChunks(
  uploadId: string,
  totalChunks: number,
  outputPath: string
): Promise<boolean> {
  try {
    const chunksDir = getChunksDir()

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    ensureDir(outputDir)

    // 创建写入流
    const writeStream = fs.createWriteStream(outputPath)

    // 按顺序合并分片
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunksDir, `${uploadId}_${i}`)

      if (!fs.existsSync(chunkPath)) {
        logger.error('分片文件不存在', { uploadId, chunkIndex: i })
        writeStream.close()
        return false
      }

      const chunkData = fs.readFileSync(chunkPath)
      writeStream.write(chunkData)
    }

    writeStream.close()

    // 清理分片文件
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunksDir, `${uploadId}_${i}`)
      fs.unlinkSync(chunkPath)
    }

    logger.info('分片合并完成', { uploadId, outputPath })
    return true
  } catch (error) {
    logger.error('分片合并失败', { uploadId, error: (error as Error).message })
    return false
  }
}

/**
 * 删除文件
 *
 * @param filePath - 文件路径
 * @returns 是否删除成功
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    logger.error('删除文件失败', { path: filePath, error: (error as Error).message })
    return false
  }
}

/**
 * 获取文件大小
 *
 * @param filePath - 文件路径
 * @returns 文件大小（字节），不存在返回 -1
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath)
    return stats.size
  } catch {
    return -1
  }
}

/**
 * 检查文件是否存在
 *
 * @param filePath - 文件路径
 * @returns 是否存在
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

/**
 * 获取文件扩展名
 *
 * @param fileName - 文件名
 * @returns 扩展名（小写，不带点）
 */
export function getFileExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  return ext.startsWith('.') ? ext.substring(1) : ext
}

/**
 * 生成唯一文件名
 *
 * @param originalName - 原始文件名
 * @returns 唯一文件名
 */
export function generateUniqueFileName(originalName: string): string {
  const ext = getFileExtension(originalName)
  const baseName = path.basename(originalName, path.extname(originalName))
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6)
  return `${baseName}_${timestamp}_${random}.${ext}`
}

/**
 * 清理目录中的旧文件
 *
 * @param dirPath - 目录路径
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的文件数量
 */
export function cleanOldFiles(dirPath: string, maxAgeHours: number = 24): number {
  if (!fs.existsSync(dirPath)) {
    return 0
  }

  const now = Date.now()
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000
  let cleanedCount = 0

  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    try {
      const stats = fs.statSync(filePath)
      const age = now - stats.mtime.getTime()

      if (age > maxAgeMs) {
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true })
        } else {
          fs.unlinkSync(filePath)
        }
        cleanedCount++
      }
    } catch (error) {
      logger.warn('清理文件失败', { path: filePath, error: (error as Error).message })
    }
  }

  return cleanedCount
}

/**
 * 获取目录大小
 *
 * @param dirPath - 目录路径
 * @returns 目录大小（字节）
 */
export function getDirSize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) {
    return 0
  }

  let totalSize = 0
  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      totalSize += getDirSize(filePath)
    } else {
      totalSize += stats.size
    }
  }

  return totalSize
}