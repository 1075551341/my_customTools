/**
 * API 路由集成测试
 *
 * 测试完整的请求响应流程
 *
 * @module __tests__/routes.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import type { Application } from 'express'

// Mock 数据库
vi.mock('../db/users', () => ({
  existsByUsername: vi.fn(() => false),
  create: vi.fn((data) => ({ id: 'user-123', ...data, createdAt: new Date().toISOString() })),
  findByUsername: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(() => []),
  update: vi.fn()
}))

vi.mock('../db/tasks', () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findPaginated: vi.fn(() => ({ list: [], total: 0 })),
  updateStatus: vi.fn(),
  updateProgress: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getStats: vi.fn(() => ({ waiting: 0, uploading: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 })),
  findByStatus: vi.fn(() => []),
  cleanOldTasks: vi.fn()
}))

vi.mock('../db/config', () => ({
  read: vi.fn(() => ({
    video: { parallelLimit: 3, maxFileSize: 5368709120, allowedInputFormats: ['mp4'] },
    img: { parallelLimit: 5, maxFileSize: 52428800, allowedInputFormats: ['jpg'] },
    upload: { chunkSize: 5242880, maxParallelUploads: 2 },
    storage: { type: 'local', uploadDir: './uploads', outputDir: './outputs', autoClean: true, cleanDays: 7 }
  })),
  write: vi.fn(),
  update: vi.fn(),
  reset: vi.fn(),
  getDefaults: vi.fn()
}))

vi.mock('../utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyAccessToken: vi.fn(() => ({ id: 'user-123', username: 'testuser', role: 'user' })),
  verifyRefreshToken: vi.fn(() => ({ id: 'user-123' })),
  extractToken: vi.fn(() => null),
  extractTokensFromCookies: vi.fn(() => ({ accessToken: null, refreshToken: null }))
}))

// Mock 队列
vi.mock('../queue', () => ({
  addTranscodeJob: vi.fn(),
  cancelTranscodeJob: vi.fn(() => true),
  getQueueStats: vi.fn(() => ({
    video: { waiting: 0, active: 0, completed: 0, failed: 0 },
    image: { waiting: 0, active: 0, completed: 0, failed: 0 },
    anim: { waiting: 0, active: 0, completed: 0, failed: 0 },
    document: { waiting: 0, active: 0, completed: 0, failed: 0 }
  })),
  initQueueEvents: vi.fn()
}))

// 导入应用创建函数
import createApp from '../app'

describe('API 路由集成测试', () => {
  let app: Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/system/health', () => {
    it('应该返回健康状态', async () => {
      const response = await request(app).get('/api/system/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('code', 0)
    })
  })

  describe('POST /api/auth/register', () => {
    it('应该成功注册用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(0)
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('refreshToken')
    })

    it('应该拒绝无效的用户名', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // 太短
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.code).not.toBe(0)
    })

    it('应该拒绝无效的密码', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: '123' // 太短
        })

      expect(response.status).toBe(400)
      expect(response.body.code).not.toBe(0)
    })
  })

  describe('认证中间件', () => {
    it('未认证请求应返回 401', async () => {
      const response = await request(app).get('/api/tasks')

      expect(response.status).toBe(401)
    })
  })

  describe('错误处理', () => {
    it('应该返回 404 对于未知路由', async () => {
      const response = await request(app).get('/api/unknown')

      expect(response.status).toBe(404)
    })
  })
})