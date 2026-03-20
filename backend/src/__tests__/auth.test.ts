/**
 * 认证服务测试
 *
 * @module __tests__/auth.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as authService from '../services/auth'
import * as usersDb from '../db/users'

// Mock 数据库操作
vi.mock('../db/users', () => ({
  existsByUsername: vi.fn(),
  create: vi.fn(),
  findByUsername: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(() => []),
  update: vi.fn()
}))

// Mock JWT 工具
vi.mock('../utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: vi.fn()
}))

// Mock 配置
vi.mock('../config', () => ({
  default: {
    features: {
      allowRegister: true
    }
  }
}))

describe('认证服务', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // 设置 mock 返回值
      vi.mocked(usersDb.existsByUsername).mockReturnValue(false)
      vi.mocked(usersDb.findAll).mockReturnValue([])
      vi.mocked(usersDb.create).mockReturnValue({
        id: 'test-user-id',
        username: 'testuser',
        passwordHash: 'hashed-password',
        role: 'admin',
        createdAt: new Date().toISOString()
      })

      const result = await authService.register({
        username: 'testuser',
        password: 'password123'
      })

      expect(result.user.username).toBe('testuser')
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
    })

    it('应该拒绝已存在的用户名', async () => {
      vi.mocked(usersDb.existsByUsername).mockReturnValue(true)

      await expect(
        authService.register({
          username: 'existinguser',
          password: 'password123'
        })
      ).rejects.toThrow('用户名已存在')
    })

    it('应该拒绝过短的用户名', async () => {
      await expect(
        authService.register({
          username: 'ab',
          password: 'password123'
        })
      ).rejects.toThrow('用户名长度必须在 3-20 个字符之间')
    })

    it('应该拒绝过短的密码', async () => {
      await expect(
        authService.register({
          username: 'testuser',
          password: '12345'
        })
      ).rejects.toThrow('密码长度至少 6 个字符')
    })
  })

  describe('getUserInfo', () => {
    it('应该返回用户信息', () => {
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        passwordHash: 'hashed-password',
        role: 'user' as const,
        createdAt: new Date().toISOString()
      }

      vi.mocked(usersDb.findById).mockReturnValue(mockUser)

      const result = authService.getUserInfo('test-user-id')

      expect(result.id).toBe('test-user-id')
      expect(result.username).toBe('testuser')
      // 确保不返回密码哈希
      expect(result).not.toHaveProperty('passwordHash')
    })

    it('应该抛出用户不存在错误', () => {
      vi.mocked(usersDb.findById).mockReturnValue(null)

      expect(() => authService.getUserInfo('non-existent-id')).toThrow(
        '用户不存在'
      )
    })
  })
})