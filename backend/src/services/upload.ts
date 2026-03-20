/**
 * 上传服务模块
 *
 * 提供文件分片上传、合并、进度查询等功能
 *
 * @module services/upload
 */

import path from 'path'
import * as uploadSessionsDb from '../db/uploadSessions'
import * as storage from '../utils/storage'
import config from '../config'
import type { UploadSession, TaskType } from '../types'

/**
 * 创建上传会话请求
 */
export interface CreateSessionParams {
  fileName: string
  fileSize: number
  type: TaskType
  userId: string
}

/**
 * 上传分片请求
 */
export interface UploadChunkParams {
  uploadId: string
  chunkIndex: number
  chunkData: Buffer
  userId: string
}

/**
 * 上传进度信息
 */
export interface UploadProgress {
  uploadId: string
  fileName: string
  fileSize: number
  uploadedSize: number
  uploadedChunks: number
  totalChunks: number
  progress: number
  isComplete: boolean
}

/**
 * 创建上传会话
 *
 * @param params - 创建参数
 * @returns 上传会话
 * @throws 文件大小超出限制
 * @throws 文件格式不支持
 */
export function createSession(params: CreateSessionParams): UploadSession {
  const { fileName, fileSize, type, userId } = params

  // 验证文件大小
  const maxSize = type === 'video' ? config.video.maxFileSize : config.img.maxFileSize
  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2)
    throw new Error(`文件大小超出限制，最大允许 ${maxSizeMB} MB`)
  }

  // 验证文件格式
  const ext = storage.getFileExtension(fileName)
  const allowedFormats = type === 'video' ? config.video.allowedInputFormats : config.img.allowedInputFormats

  if (!allowedFormats.includes(ext.toLowerCase())) {
    throw new Error(`不支持的文件格式: .${ext}，支持的格式: ${allowedFormats.join(', ')}`)
  }

  // 计算分片数量
  const chunkSize = config.upload.chunkSize
  const totalChunks = Math.ceil(fileSize / chunkSize)

  // 创建会话
  const session = uploadSessionsDb.create({
    fileName,
    fileSize,
    totalChunks,
    type,
    userId
  })

  return session
}

/**
 * 上传分片
 *
 * @param params - 上传参数
 * @returns 上传进度
 * @throws 上传会话不存在
 * @throws 无权限
 * @throws 分片索引无效
 */
export function uploadChunk(params: UploadChunkParams): UploadProgress {
  const { uploadId, chunkIndex, chunkData, userId } = params

  // 验证会话
  const session = uploadSessionsDb.findById(uploadId)
  if (!session) {
    throw new Error('上传会话不存在')
  }

  // 验证权限
  if (session.userId !== userId) {
    throw new Error('无权限操作此上传会话')
  }

  // 验证分片索引
  if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
    throw new Error(`分片索引无效，有效范围: 0-${session.totalChunks - 1}`)
  }

  // 保存分片文件
  const chunkPath = storage.getChunkPath(uploadId, chunkIndex)
  require('fs').writeFileSync(chunkPath, chunkData)

  // 更新会话
  uploadSessionsDb.addUploadedChunk(uploadId, chunkIndex)

  // 返回进度
  return getProgress(uploadId)!
}

/**
 * 完成上传（合并分片）
 *
 * @param uploadId - 上传ID
 * @param userId - 用户ID
 * @returns 合并后的文件路径
 * @throws 上传会话不存在
 * @throws 无权限
 * @throws 分片未上传完成
 */
export async function completeUpload(uploadId: string, userId: string): Promise<string> {
  // 验证会话
  const session = uploadSessionsDb.findById(uploadId)
  if (!session) {
    throw new Error('上传会话不存在')
  }

  // 验证权限
  if (session.userId !== userId) {
    throw new Error('无权限操作此上传会话')
  }

  // 验证分片完整性
  if (session.uploadedChunks.length !== session.totalChunks) {
    throw new Error(`分片未上传完成，已上传 ${session.uploadedChunks.length}/${session.totalChunks}`)
  }

  // 生成输出文件路径
  const userUploadDir = storage.getUserUploadDir(userId)
  const uniqueFileName = storage.generateUniqueFileName(session.fileName)
  const outputPath = path.join(userUploadDir, uniqueFileName)

  // 合并分片
  const success = await storage.mergeChunks(uploadId, session.totalChunks, outputPath)
  if (!success) {
    throw new Error('分片合并失败')
  }

  // 删除上传会话
  uploadSessionsDb.remove(uploadId)

  return outputPath
}

/**
 * 获取上传进度
 *
 * @param uploadId - 上传ID
 * @returns 上传进度或null
 */
export function getProgress(uploadId: string): UploadProgress | null {
  const session = uploadSessionsDb.findById(uploadId)
  if (!session) {
    return null
  }

  const uploadedChunks = session.uploadedChunks.length
  const totalChunks = session.totalChunks
  const progress = Math.round((uploadedChunks / totalChunks) * 100)
  const chunkSize = config.upload.chunkSize
  const uploadedSize = uploadedChunks * chunkSize

  return {
    uploadId: session.uploadId,
    fileName: session.fileName,
    fileSize: session.fileSize,
    uploadedSize: Math.min(uploadedSize, session.fileSize),
    uploadedChunks,
    totalChunks,
    progress,
    isComplete: uploadedChunks === totalChunks
  }
}

/**
 * 取消上传
 *
 * @param uploadId - 上传ID
 * @param userId - 用户ID
 * @throws 上传会话不存在
 * @throws 无权限
 */
export function cancelUpload(uploadId: string, userId: string): void {
  // 验证会话
  const session = uploadSessionsDb.findById(uploadId)
  if (!session) {
    throw new Error('上传会话不存在')
  }

  // 验证权限
  if (session.userId !== userId) {
    throw new Error('无权限操作此上传会话')
  }

  // 删除已上传的分片文件
  for (let i = 0; i < session.totalChunks; i++) {
    const chunkPath = storage.getChunkPath(uploadId, i)
    storage.deleteFile(chunkPath)
  }

  // 删除会话
  uploadSessionsDb.remove(uploadId)
}

/**
 * 获取用户的所有上传会话进度
 *
 * @param userId - 用户ID
 * @returns 上传进度列表
 */
export function getUserUploads(userId: string): UploadProgress[] {
  const sessions = uploadSessionsDb.findByUserId(userId)
  return sessions.map(session => getProgress(session.uploadId)!).filter(Boolean)
}

/**
 * 清理过期的上传会话
 *
 * @returns 清理的会话数量
 */
export function cleanExpiredSessions(): number {
  // 清理过期的会话记录
  const cleanedSessions = uploadSessionsDb.cleanExpired(24)

  // 清理过期的分片文件
  const chunksDir = storage.getChunksDir()
  storage.cleanOldFiles(chunksDir, 24)

  return cleanedSessions
}

/**
 * 验证文件是否已上传完成
 *
 * @param uploadId - 上传ID
 * @returns 是否完成
 */
export function isUploadComplete(uploadId: string): boolean {
  return uploadSessionsDb.isComplete(uploadId)
}