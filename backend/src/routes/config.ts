/**
 * 配置路由模块
 *
 * 提供系统配置管理接口
 *
 * @module routes/config
 */

import { Router, Request, Response, NextFunction } from 'express'
import * as configService from '../services/config'
import { success, error } from '../utils/response'
import { authMiddleware } from '../middlewares/auth'

/**
 * 创建路由实例
 */
const router: Router = Router()

/**
 * 获取系统配置
 *
 * GET /api/config
 */
router.get(
  '/',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = configService.getConfig()
      return success(res, config)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 更新系统配置
 *
 * PUT /api/config
 * Body: Partial<SystemConfig>
 */
router.put(
  '/',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates = req.body

      if (!updates || Object.keys(updates).length === 0) {
        return error(res, '请提供要更新的配置项', 400)
      }

      const newConfig = configService.updateConfig(updates)
      return success(res, newConfig, '配置更新成功')
    } catch (err) {
      const message = (err as Error).message

      if (message.includes('必须在') || message.includes('不能')) {
        return error(res, message, 400)
      }

      return next(err) as void
    }
  }
)

/**
 * 重置为默认配置
 *
 * POST /api/config/reset
 */
router.post(
  '/reset',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const defaultConfig = configService.resetConfig()
      return success(res, defaultConfig, '配置已重置为默认值')
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取配置对比
 *
 * GET /api/config/diff
 */
router.get(
  '/diff',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const diff = configService.getConfigDiff()
      return success(res, diff)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取视频配置
 *
 * GET /api/config/video
 */
router.get(
  '/video',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const videoConfig = configService.getVideoConfig()
      return success(res, videoConfig)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取图片配置
 *
 * GET /api/config/img
 */
router.get(
  '/img',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const imgConfig = configService.getImgConfig()
      return success(res, imgConfig)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取上传配置
 *
 * GET /api/config/upload
 */
router.get(
  '/upload',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadConfig = configService.getUploadConfig()
      return success(res, uploadConfig)
    } catch (err) {
      return next(err) as void
    }
  }
)

/**
 * 获取存储配置
 *
 * GET /api/config/storage
 */
router.get(
  '/storage',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const storageConfig = configService.getStorageConfig()
      return success(res, storageConfig)
    } catch (err) {
      return next(err) as void
    }
  }
)

export default router