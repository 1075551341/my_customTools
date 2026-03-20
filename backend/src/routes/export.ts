/**
 * 导出路由模块
 *
 * 提供任务报告导出接口
 *
 * @module routes/export
 */

import { Router, Request, Response, NextFunction } from 'express'
import * as exportService from '../services/export'
import { success, error } from '../utils/response'
import { authMiddleware } from '../middlewares/auth'
import type { TaskStatus, TaskType } from '../types'

/**
 * 创建路由实例
 */
const router: Router = Router()

/**
 * 导出任务报告
 *
 * GET /api/export/tasks
 * Query: format=json|csv, status, type, startDate, endDate
 */
router.get(
  '/tasks',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      const format = (req.query.format as 'json' | 'csv') || 'json'
      const status = req.query.status as TaskStatus | undefined
      const type = req.query.type as TaskType | undefined
      const startDate = req.query.startDate as string | undefined
      const endDate = req.query.endDate as string | undefined

      if (!['json', 'csv'].includes(format)) {
        return error(res, '不支持的导出格式，请使用 json 或 csv', 400)
      }

      const result = exportService.exportTasks({
        userId,
        format,
        status,
        type,
        startDate,
        endDate
      })

      // 设置响应头进行下载
      res.setHeader('Content-Type', result.mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`)
      res.send(result.content)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取导出统计
 *
 * GET /api/export/stats
 */
router.get(
  '/stats',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      const stats = exportService.getExportStats(userId)
      return success(res, stats)
    } catch (err) {
      return next(err) as void
    }
  }
)

export default router