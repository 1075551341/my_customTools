/**
 * 用户路由模块
 *
 * 提供用户信息、用户偏好接口
 *
 * @module routes/user
 */

import { Router, Request, Response, NextFunction } from 'express'
import { success, error } from '../utils/response'
import { authMiddleware } from '../middlewares/auth'
import * as authService from '../services/auth'
import fs from 'fs'
import path from 'path'

/**
 * 创建路由实例
 */
const router: Router = Router()

/**
 * 用户偏好数据存储路径
 */
const PREFERENCES_DIR = path.join(process.cwd(), 'data')
const PREFERENCES_FILE = path.join(PREFERENCES_DIR, 'preferences.json')

/**
 * 默认用户偏好
 */
const defaultPreferences = {
  theme: 'light' as 'light' | 'dark' | 'auto',
  language: 'zh-CN' as 'zh-CN' | 'en-US',
  notifications: {
    taskCompleted: true,
    taskFailed: true,
    soundEnabled: false
  }
}

/**
 * 确保偏好数据目录存在
 */
function ensurePreferencesDir(): void {
  if (!fs.existsSync(PREFERENCES_DIR)) {
    fs.mkdirSync(PREFERENCES_DIR, { recursive: true })
  }
}

/**
 * 读取用户偏好
 */
function readPreferences(userId: string): typeof defaultPreferences {
  ensurePreferencesDir()

  if (!fs.existsSync(PREFERENCES_FILE)) {
    return { ...defaultPreferences }
  }

  try {
    const data = fs.readFileSync(PREFERENCES_FILE, 'utf-8')
    const allPreferences = JSON.parse(data)
    return allPreferences[userId] || { ...defaultPreferences }
  } catch {
    return { ...defaultPreferences }
  }
}

/**
 * 保存用户偏好
 */
function savePreferences(userId: string, preferences: Partial<typeof defaultPreferences>): typeof defaultPreferences {
  ensurePreferencesDir()

  let allPreferences: Record<string, typeof defaultPreferences> = {}

  if (fs.existsSync(PREFERENCES_FILE)) {
    try {
      const data = fs.readFileSync(PREFERENCES_FILE, 'utf-8')
      allPreferences = JSON.parse(data)
    } catch {
      // 忽略解析错误
    }
  }

  allPreferences[userId] = {
    ...defaultPreferences,
    ...(allPreferences[userId] || {}),
    ...preferences,
    notifications: {
      ...defaultPreferences.notifications,
      ...(allPreferences[userId]?.notifications || {}),
      ...(preferences.notifications || {})
    }
  }

  fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(allPreferences, null, 2))
  return allPreferences[userId]
}

/**
 * 获取用户信息
 *
 * GET /api/user/info
 * 兼容 Vben Admin 的用户信息接口
 */
router.get(
  '/info',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      const userInfo = authService.getUserInfo(userId)

      // 转换为 Vben Admin 格式
      const homePathMap: Record<string, string> = {
        super: '/dashboard',
        admin: '/dashboard',
        user: '/dashboard'
      }
      const vbenUserInfo = {
        userId: userInfo.id,
        username: userInfo.username,
        realName: userInfo.username,
        avatar: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
        desc: '媒体转码工具用户',
        homePath: homePathMap[userInfo.role] || '/dashboard',
        roles: [userInfo.role]
      }

      return success(res, vbenUserInfo)
    } catch (err) {
      const message = (err as Error).message

      if (message.includes('不存在')) {
        return error(res, message, 404)
      }

      return next(err) as void
    }
  }
)

/**
 * 获取用户偏好
 *
 * GET /api/user/preferences
 */
router.get(
  '/preferences',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      const preferences = readPreferences(userId)
      return success(res, preferences)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 更新用户偏好
 *
 * PUT /api/user/preferences
 */
router.put(
  '/preferences',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      const updates = req.body
      const updatedPreferences = savePreferences(userId, updates)
      return success(res, updatedPreferences, '偏好设置已保存')
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 重置用户偏好
 *
 * POST /api/user/preferences/reset
 */
router.post(
  '/preferences/reset',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      const resetPreferences = savePreferences(userId, defaultPreferences)
      return success(res, resetPreferences, '偏好设置已重置')
    } catch (err) {
      return next(err) as void
    }
  }
)

export default router