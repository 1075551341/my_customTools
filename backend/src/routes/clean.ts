/**
 * 清理路由模块
 *
 * 提供手动清理和统计接口
 *
 * @module routes/clean
 */

import { Router, Request, Response, NextFunction } from 'express'
import * as cleanService from '../services/clean'
import { success, error } from '../utils/response'
import { authMiddleware } from '../middlewares/auth'

/**
 * 创建路由实例
 */
const router: Router = Router()

/**
 * 执行手动清理
 *
 * POST /api/clean/run
 */
router.post(
  '/run',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // 简单权限检查（只有管理员可以手动触发清理）
      if (req.user?.role !== 'admin') {
        return error(res, '只有管理员可以执行清理操作', 403)
      }

      const stats = cleanService.runFullClean()
      return success(res, stats, '清理完成')
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取清理统计
 *
 * GET /api/clean/stats
 */
router.get(
  '/stats',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = cleanService.getCleanStats()
      return success(res, stats)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取存储使用情况
 *
 * GET /api/clean/storage
 */
router.get(
  '/storage',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const usage = cleanService.getStorageUsage()
      return success(res, usage)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 清理旧任务
 *
 * POST /api/clean/tasks
 * Body: { maxAgeDays?: number }
 */
router.post(
  '/tasks',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== 'admin') {
        return error(res, '只有管理员可以执行清理操作', 403)
      }

      const { maxAgeDays = 7 } = req.body
      const count = cleanService.cleanOldTasks(maxAgeDays)
      return success(res, { tasksRemoved: count }, `已清理 ${count} 个旧任务`)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 清理临时文件
 *
 * POST /api/clean/temp
 * Body: { maxAgeHours?: number }
 */
router.post(
  '/temp',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== 'admin') {
        return error(res, '只有管理员可以执行清理操作', 403)
      }

      const { maxAgeHours = 24 } = req.body
      const count = cleanService.cleanTempFiles(maxAgeHours)
      return success(res, { filesRemoved: count }, `已清理 ${count} 个临时文件`)
    } catch (err) {
      return next(err) as void
    }
  }
)

export default router