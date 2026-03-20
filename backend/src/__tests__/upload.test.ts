/**
 * 上传服务测试
 *
 * @module __tests__/upload.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as uploadService from '../services/upload'
import * as uploadSessionsDb from '../db/uploadSessions'

// Mock 数据库操作
vi.mock('../db/uploadSessions', () => ({
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findByStatus: vi.fn(),
  findByUserId: vi.fn(() => []),
  addUploadedChunk: vi.fn(),
  isComplete: vi.fn(() => false),
  cleanExpired: vi.fn(() => 0)
}))

// Mock 存储工具
vi.mock('../utils/storage', () => ({
  ensureDir: vi.fn(),
  getChunksDir: vi.fn(() => '/uploads/chunks'),
  getChunkPath: vi.fn((uploadId, index) => `/uploads/chunks/${uploadId}/${index}`),
  getCompleteDir: vi.fn(() => '/uploads/complete'),
  getCompletePath: vi.fn((filename) => `/uploads/complete/${filename}`),
  deleteDir: vi.fn(),
  deleteFile: vi.fn(),
  fileExists: vi.fn(() => true),
  getFileSize: vi.fn(() => 1024),
  getFileExtension: vi.fn((name) => name.split('.').pop() || ''),
  getUserUploadDir: vi.fn(() => '/uploads/user-123'),
  generateUniqueFileName: vi.fn((name) => `uuid-${name}`),
  mergeChunks: vi.fn(() => true),
  cleanOldFiles: vi.fn()
}))

// Mock 配置
vi.mock('../config', () => ({
  default: {
    video: { maxFileSize: 5368709120, allowedInputFormats: ['mp4', 'avi', 'mkv'] },
    img: { maxFileSize: 52428800, allowedInputFormats: ['jpg', 'png', 'webp'] },
    upload: { chunkSize: 5242880 }
  }
}))

describe('上传服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSession', () => {
    it('应该成功创建上传会话', () => {
      const mockSession = {
        uploadId: 'upload-123',
        fileName: 'test.mp4',
        fileSize: 102400000,
        totalChunks: 20,
        uploadedChunks: [],
        type: 'video' as const,
        userId: 'user-123',
        createdAt: new Date().toISOString()
      }

      vi.mocked(uploadSessionsDb.create).mockReturnValue(mockSession)

      const result = uploadService.createSession({
        fileName: 'test.mp4',
        fileSize: 102400000,
        type: 'video',
        userId: 'user-123'
      })

      expect(result.uploadId).toBe('upload-123')
      expect(result.totalChunks).toBe(20)
    })

    it('应该拒绝过大的文件', () => {
      expect(() =>
        uploadService.createSession({
          fileName: 'huge.mp4',
          fileSize: 10 * 1024 * 1024 * 1024, // 10GB
          type: 'video',
          userId: 'user-123'
        })
      ).toThrow('文件大小超出限制')
    })

    it('应该拒绝不支持的格式', () => {
      expect(() =>
        uploadService.createSession({
          fileName: 'test.xyz',
          fileSize: 1024000,
          type: 'video',
          userId: 'user-123'
        })
      ).toThrow('不支持的文件格式')
    })
  })

  describe('getProgress', () => {
    it('应该返回上传进度', () => {
      const mockSession = {
        uploadId: 'upload-123',
        fileName: 'test.mp4',
        fileSize: 102400000,
        totalChunks: 10,
        uploadedChunks: [0, 1, 2, 3, 4],
        type: 'video' as const,
        userId: 'user-123',
        createdAt: new Date().toISOString()
      }

      vi.mocked(uploadSessionsDb.findById).mockReturnValue(mockSession)

      const result = uploadService.getProgress('upload-123')

      expect(result).not.toBeNull()
      expect(result!.progress).toBe(50)
      expect(result!.uploadedChunks).toBe(5)
    })

    it('应该返回 null 对于无效ID', () => {
      vi.mocked(uploadSessionsDb.findById).mockReturnValue(null)

      const result = uploadService.getProgress('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('getUserUploads', () => {
    it('应该返回用户所有上传进度', () => {
      const mockSessions = [
        {
          uploadId: 'upload-1',
          fileName: 'test1.mp4',
          fileSize: 102400000,
          totalChunks: 10,
          uploadedChunks: [0, 1, 2, 3, 4],
          type: 'video' as const,
          userId: 'user-123',
          createdAt: new Date().toISOString()
        },
        {
          uploadId: 'upload-2',
          fileName: 'test2.jpg',
          fileSize: 1024000,
          totalChunks: 1,
          uploadedChunks: [0],
          type: 'img' as const,
          userId: 'user-123',
          createdAt: new Date().toISOString()
        }
      ]

      vi.mocked(uploadSessionsDb.findByUserId).mockReturnValue(mockSessions)
      vi.mocked(uploadSessionsDb.findById)
        .mockReturnValueOnce(mockSessions[0])
        .mockReturnValueOnce(mockSessions[1])

      const result = uploadService.getUserUploads('user-123')

      expect(result).toHaveLength(2)
    })
  })
})