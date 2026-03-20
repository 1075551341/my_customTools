/**
 * 任务服务测试
 *
 * @module __tests__/tasks.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as tasksService from '../services/tasks'
import * as tasksDb from '../db/tasks'
import * as storage from '../utils/storage'

// Mock 数据库操作
vi.mock('../db/tasks', () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findPaginated: vi.fn(),
  updateStatus: vi.fn(),
  updateProgress: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getStats: vi.fn(),
  findByStatus: vi.fn(),
  cleanOldTasks: vi.fn()
}))

// Mock 存储工具
vi.mock('../utils/storage', () => ({
  getUserOutputDir: vi.fn(() => '/outputs/user-123'),
  generateUniqueFileName: vi.fn((name) => `uuid-${name}`),
  deleteFile: vi.fn(),
  fileExists: vi.fn(() => true)
}))

// Mock 队列
vi.mock('../queue', () => ({
  addTranscodeJob: vi.fn()
}))

describe('任务服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTask', () => {
    it('应该成功创建任务', () => {
      const mockTask = {
        id: 'task-123',
        type: 'video' as const,
        userId: 'user-123',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        outputPath: '/outputs/user-123/uuid-test.webm',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        status: 'waiting' as const,
        progress: 0,
        config: { videoCodec: 'vp9' },
        createdAt: new Date().toISOString()
      }

      vi.mocked(tasksDb.create).mockReturnValue(mockTask)

      const result = tasksService.createTask({
        type: 'video',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        config: { videoCodec: 'vp9' },
        userId: 'user-123'
      })

      expect(result.id).toBe('task-123')
      expect(result.type).toBe('video')
      expect(result.status).toBe('waiting')
    })
  })

  describe('getTask', () => {
    it('应该返回任务详情', () => {
      const mockTask = {
        id: 'task-123',
        type: 'video' as const,
        userId: 'user-123',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        outputPath: '/outputs/test.webm',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        status: 'completed' as const,
        progress: 100,
        config: {},
        createdAt: new Date().toISOString()
      }

      vi.mocked(tasksDb.findById).mockReturnValue(mockTask)

      const result = tasksService.getTask('task-123', 'user-123')

      expect(result.id).toBe('task-123')
    })

    it('应该拒绝无权限访问', () => {
      const mockTask = {
        id: 'task-123',
        type: 'video' as const,
        userId: 'user-123',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        outputPath: '/outputs/test.webm',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        status: 'completed' as const,
        progress: 100,
        config: {},
        createdAt: new Date().toISOString()
      }

      vi.mocked(tasksDb.findById).mockReturnValue(mockTask)

      expect(() => tasksService.getTask('task-123', 'other-user')).toThrow(
        '无权限访问此任务'
      )
    })

    it('应该抛出任务不存在错误', () => {
      vi.mocked(tasksDb.findById).mockReturnValue(null)

      expect(() => tasksService.getTask('non-existent')).toThrow('任务不存在')
    })
  })

  describe('queryTasks', () => {
    it('应该返回分页任务列表', () => {
      const mockTasks = [
        {
          id: 'task-1',
          type: 'video' as const,
          userId: 'user-123',
          fileName: 'test1.mp4',
          fileSize: 1024000,
          inputPath: '/uploads/test1.mp4',
          outputPath: '/outputs/test1.webm',
          inputFormat: 'mp4',
          outputFormat: 'webm',
          status: 'completed' as const,
          progress: 100,
          config: {},
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-2',
          type: 'img' as const,
          userId: 'user-123',
          fileName: 'test2.png',
          fileSize: 102400,
          inputPath: '/uploads/test2.png',
          outputPath: '/outputs/test2.webp',
          inputFormat: 'png',
          outputFormat: 'webp',
          status: 'processing' as const,
          progress: 50,
          config: {},
          createdAt: new Date().toISOString()
        }
      ]

      vi.mocked(tasksDb.findPaginated).mockReturnValue({
        list: mockTasks,
        total: 2
      })

      const result = tasksService.queryTasks({
        userId: 'user-123',
        page: 1,
        pageSize: 20
      })

      expect(result.list).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('cancelTask', () => {
    it('应该成功取消任务', () => {
      const mockTask = {
        id: 'task-123',
        type: 'video' as const,
        userId: 'user-123',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        outputPath: '/outputs/test.webm',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        status: 'waiting' as const,
        progress: 0,
        config: {},
        createdAt: new Date().toISOString()
      }

      vi.mocked(tasksDb.findById).mockReturnValue(mockTask)
      vi.mocked(tasksDb.updateStatus).mockReturnValue({
        ...mockTask,
        status: 'cancelled'
      })

      const result = tasksService.cancelTask('task-123', 'user-123')

      expect(result.status).toBe('cancelled')
    })

    it('应该拒绝取消已完成的任务', () => {
      const mockTask = {
        id: 'task-123',
        type: 'video' as const,
        userId: 'user-123',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        outputPath: '/outputs/test.webm',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        status: 'completed' as const,
        progress: 100,
        config: {},
        createdAt: new Date().toISOString()
      }

      vi.mocked(tasksDb.findById).mockReturnValue(mockTask)

      expect(() => tasksService.cancelTask('task-123', 'user-123')).toThrow()
    })
  })

  describe('deleteTask', () => {
    it('应该成功删除已完成的任务', () => {
      const mockTask = {
        id: 'task-123',
        type: 'video' as const,
        userId: 'user-123',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        outputPath: '/outputs/test.webm',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        status: 'completed' as const,
        progress: 100,
        config: {},
        createdAt: new Date().toISOString()
      }

      vi.mocked(tasksDb.findById).mockReturnValue(mockTask)
      vi.mocked(tasksDb.remove).mockReturnValue(true)

      const result = tasksService.deleteTask('task-123', 'user-123')

      expect(result).toBe(true)
    })

    it('应该拒绝删除处理中的任务', () => {
      const mockTask = {
        id: 'task-123',
        type: 'video' as const,
        userId: 'user-123',
        fileName: 'test.mp4',
        fileSize: 1024000,
        inputPath: '/uploads/test.mp4',
        outputPath: '/outputs/test.webm',
        inputFormat: 'mp4',
        outputFormat: 'webm',
        status: 'processing' as const,
        progress: 50,
        config: {},
        createdAt: new Date().toISOString()
      }

      vi.mocked(tasksDb.findById).mockReturnValue(mockTask)

      expect(() => tasksService.deleteTask('task-123', 'user-123')).toThrow(
        '只能删除已完成、失败或取消的任务'
      )
    })
  })

  describe('getTaskStats', () => {
    it('应该返回任务统计', () => {
      const mockStats = {
        waiting: 2,
        uploading: 0,
        processing: 1,
        completed: 10,
        failed: 1,
        cancelled: 0
      }

      vi.mocked(tasksDb.getStats).mockReturnValue(mockStats)

      const result = tasksService.getTaskStats('user-123')

      expect(result.waiting).toBe(2)
      expect(result.completed).toBe(10)
    })
  })
})