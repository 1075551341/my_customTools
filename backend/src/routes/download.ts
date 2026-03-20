/**
 * 下载路由模块
 *
 * 提供文件下载接口
 *
 * @module routes/download
 */

import { Router, Request, Response, NextFunction } from 'express'
import * as downloadService from '../services/download'
import { success, error } from '../utils/response'
import logger from '../utils/logger'
import { authMiddleware } from '../middlewares/auth'

/**
 * 创建路由实例
 */
const router: Router = Router()

/**
 * 获取可下载任务列表
 *
 * GET /api/download/list
 */
router.get(
  '/list',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      const tasks = downloadService.getDownloadableTasks(userId)

      return success(res, {
        list: tasks.map(task => ({
          id: task.id,
          fileName: task.fileName,
          outputFormat: task.outputFormat,
          createdAt: task.createdAt,
          completedAt: task.completedAt
        })),
        total: tasks.length
      })
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取用户下载空间占用
 *
 * GET /api/download/size
 */
router.get(
  '/size',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      const size = downloadService.getUserDownloadSize(userId)

      return success(res, {
        size,
        sizeMB: Math.round(size / 1024 / 1024 * 100) / 100
      })
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 批量打包下载
 *
 * POST /api/download/batch
 * Body: { taskIds: string[] }
 */
router.post(
  '/batch',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskIds } = req.body
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return error(res, '请提供要下载的任务ID列表', 400)
      }

      // 限制批量下载数量
      if (taskIds.length > 50) {
        return error(res, '单次最多下载 50 个任务', 400)
      }

      const result = await downloadService.downloadBatch({ taskIds, userId })

      // 设置响应头
      res.setHeader('Content-Type', result.mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`)

      // 流式传输
      const stream = result.stream as NodeJS.ReadableStream
      stream.pipe(res)

      stream.on('error', (err) => {
        logger.error('批量下载流错误', { error: err.message })
        if (!res.headersSent) {
          res.status(500).json({ code: 500, msg: '批量下载失败', data: null })
        }
      })

      logger.info('批量下载开始', { userId, taskCount: taskIds.length, fileName: result.fileName })
      return
    } catch (err) {
      const message = (err as Error).message

      if (message.includes('无有效任务')) {
        return error(res, message, 400)
      } else {
        return next(err) as void
      }
    }
  }
)

/**
 * 单文件下载
 *
 * GET /api/download/:taskId
 */
router.get(
  '/:taskId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.taskId as string
      const userId = req.user?.id

      if (!userId) {
        return error(res, '未授权', 401)
      }

      const result = downloadService.downloadSingle(taskId, userId)

      // 设置响应头
      res.setHeader('Content-Type', result.mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`)

      if (result.fileSize > 0) {
        res.setHeader('Content-Length', result.fileSize)
      }

      // 流式传输
      const stream = result.stream as NodeJS.ReadableStream
      stream.pipe(res)

      stream.on('error', (err) => {
        logger.error('文件下载流错误', { taskId, error: err.message })
        if (!res.headersSent) {
          res.status(500).json({ code: 500, msg: '文件下载失败', data: null })
        }
      })

      logger.info('文件下载开始', { taskId, userId, fileName: result.fileName })
      return
    } catch (err) {
      const message = (err as Error).message

      if (message.includes('不存在') || message.includes('无权限')) {
        return error(res, message, 404)
      } else if (message.includes('未完成')) {
        return error(res, message, 400)
      } else {
        return next(err) as void
      }
    }
  }
)

export default router