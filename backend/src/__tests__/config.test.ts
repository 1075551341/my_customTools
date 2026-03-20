/**
 * 配置服务测试
 *
 * @module __tests__/config.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as configService from '../services/config'
import * as configDb from '../db/config'

// Mock 数据库操作
vi.mock('../db/config', () => ({
  read: vi.fn(),
  write: vi.fn(),
  update: vi.fn(),
  reset: vi.fn(),
  getDefaults: vi.fn()
}))

describe('配置服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConfig', () => {
    it('应该返回系统配置', () => {
      const mockConfig = {
        video: {
          parallelLimit: 3,
          maxFileSize: 5368709120,
          allowedInputFormats: ['mp4', 'avi', 'mkv']
        },
        img: {
          parallelLimit: 5,
          maxFileSize: 52428800,
          allowedInputFormats: ['jpg', 'png', 'webp']
        },
        upload: {
          chunkSize: 5242880,
          maxParallelUploads: 2
        },
        storage: {
          type: 'local' as const,
          uploadDir: './uploads',
          outputDir: './outputs',
          autoClean: true,
          cleanDays: 7
        },
        updatedAt: new Date().toISOString()
      }

      vi.mocked(configDb.read).mockReturnValue(mockConfig)

      const result = configService.getConfig()

      expect(result.video.parallelLimit).toBe(3)
      expect(result.img.parallelLimit).toBe(5)
      expect(result.storage.type).toBe('local')
    })
  })

  describe('updateConfig', () => {
    it('应该成功更新配置', () => {
      const mockConfig = {
        video: {
          parallelLimit: 5,
          maxFileSize: 5368709120,
          allowedInputFormats: ['mp4', 'avi', 'mkv']
        },
        img: {
          parallelLimit: 5,
          maxFileSize: 52428800,
          allowedInputFormats: ['jpg', 'png', 'webp']
        },
        upload: {
          chunkSize: 5242880,
          maxParallelUploads: 2
        },
        storage: {
          type: 'local' as const,
          uploadDir: './uploads',
          outputDir: './outputs',
          autoClean: true,
          cleanDays: 7
        },
        updatedAt: new Date().toISOString()
      }

      vi.mocked(configDb.update).mockReturnValue(mockConfig)

      const result = configService.updateConfig({
        video: { parallelLimit: 5 } as any
      })

      expect(result.video.parallelLimit).toBe(5)
    })
  })

  describe('getVideoConfig', () => {
    it('应该返回视频配置', () => {
      const mockConfig = {
        video: {
          parallelLimit: 3,
          maxFileSize: 5368709120,
          allowedInputFormats: ['mp4', 'avi', 'mkv']
        },
        img: {
          parallelLimit: 5,
          maxFileSize: 52428800,
          allowedInputFormats: ['jpg', 'png', 'webp']
        },
        upload: {
          chunkSize: 5242880,
          maxParallelUploads: 2
        },
        storage: {
          type: 'local' as const,
          uploadDir: './uploads',
          outputDir: './outputs',
          autoClean: true,
          cleanDays: 7
        }
      }

      vi.mocked(configDb.read).mockReturnValue(mockConfig)

      const result = configService.getVideoConfig()

      expect(result.parallelLimit).toBe(3)
      expect(result.allowedInputFormats).toContain('mp4')
    })
  })

  describe('getImgConfig', () => {
    it('应该返回图片配置', () => {
      const mockConfig = {
        video: {
          parallelLimit: 3,
          maxFileSize: 5368709120,
          allowedInputFormats: ['mp4', 'avi', 'mkv']
        },
        img: {
          parallelLimit: 5,
          maxFileSize: 52428800,
          allowedInputFormats: ['jpg', 'png', 'webp', 'avif']
        },
        upload: {
          chunkSize: 5242880,
          maxParallelUploads: 2
        },
        storage: {
          type: 'local' as const,
          uploadDir: './uploads',
          outputDir: './outputs',
          autoClean: true,
          cleanDays: 7
        }
      }

      vi.mocked(configDb.read).mockReturnValue(mockConfig)

      const result = configService.getImgConfig()

      expect(result.parallelLimit).toBe(5)
      expect(result.allowedInputFormats).toContain('avif')
    })
  })
})