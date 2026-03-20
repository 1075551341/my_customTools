/**
 * 上传路由模块
 *
 * 提供文件分片上传、进度查询、取消上传等接口
 *
 * @module routes/upload
 */

import path from 'path'
import { Router, Request, Response } from 'express'
import multer from 'multer'
import { success, error } from '../utils/response'
import { authMiddleware, requireUserId } from '../middlewares/auth'
import * as uploadService from '../services/upload'
import * as storage from '../utils/storage'
import config from '../config'

const router: Router = Router()

// 所有上传接口需要认证
router.use(authMiddleware)

/**
 * Multer 配置 - 内存存储，用于分片上传
 */
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.chunkSize * 2 // 分片大小上限
  }
})

/**
 * POST /api/upload/session
 *
 * 创建上传会话
 *
 * @body {fileName, fileSize, type}
 * @returns 上传会话信息
 */
router.post('/session', (req: Request, res: Response) => {
  const { fileName, fileSize, type } = req.body

  // 参数验证
  if (!fileName || !fileSize || !type) {
    return error(res, 'fileName、fileSize 和 type 不能为空', 400)
  }

  if (!['video', 'img', 'anim'].includes(type)) {
    return error(res, 'type 必须是 video、img 或 anim', 400)
  }

  if (typeof fileSize !== 'number' || fileSize <= 0) {
    return error(res, 'fileSize 必须是正数', 400)
  }

  try {
    const userId = requireUserId(req)
    const session = uploadService.createSession({
      fileName,
      fileSize,
      type: type as 'video' | 'img' | 'anim',
      userId
    })

    return success(res, {
      uploadId: session.uploadId,
      totalChunks: session.totalChunks,
      chunkSize: config.upload.chunkSize
    }, '上传会话创建成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建上传会话失败'
    return error(res, message, 400)
  }
})

/**
 * POST /api/upload/chunk
 *
 * 上传分片
 *
 * @body uploadId, chunkIndex, file (multipart)
 * @returns 上传进度
 */
router.post('/chunk', chunkUpload.single('file'), (req: Request, res: Response) => {
  const { uploadId, chunkIndex } = req.body

  // 参数验证
  if (!uploadId || chunkIndex === undefined) {
    return error(res, 'uploadId 和 chunkIndex 不能为空', 400)
  }

  if (!req.file) {
    return error(res, '未上传分片文件', 400)
  }

  try {
    const userId = requireUserId(req)
    const progress = uploadService.uploadChunk({
      uploadId,
      chunkIndex: parseInt(chunkIndex, 10),
      chunkData: req.file.buffer,
      userId
    })

    return success(res, progress)
  } catch (err) {
    const message = err instanceof Error ? err.message : '上传分片失败'
    return error(res, message, 400)
  }
})

/**
 * POST /api/upload/complete
 *
 * 完成上传（合并分片）
 *
 * @body {uploadId}
 * @returns 合并后的文件路径
 */
router.post('/complete', async (req: Request, res: Response) => {
  const { uploadId } = req.body

  if (!uploadId) {
    return error(res, 'uploadId 不能为空', 400)
  }

  try {
    const userId = requireUserId(req)
    const filePath = await uploadService.completeUpload(uploadId, userId)

    return success(res, {
      filePath,
      fileName: path.basename(filePath)
    }, '上传完成')
  } catch (err) {
    const message = err instanceof Error ? err.message : '完成上传失败'
    return error(res, message, 400)
  }
})

/**
 * GET /api/upload/progress/:uploadId
 *
 * 获取上传进度
 *
 * @param uploadId - 上传ID
 * @returns 上传进度
 */
router.get('/progress/:uploadId', (req: Request, res: Response) => {
  const uploadId = req.params.uploadId as string

  try {
    const progress = uploadService.getProgress(uploadId)
    if (!progress) {
      return error(res, '上传会话不存在', 404)
    }

    return success(res, progress)
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取进度失败'
    return error(res, message, 400)
  }
})

/**
 * DELETE /api/upload/cancel/:uploadId
 *
 * 取消上传
 *
 * @param uploadId - 上传ID
 */
router.delete('/cancel/:uploadId', (req: Request, res: Response) => {
  const uploadId = req.params.uploadId as string

  try {
    const userId = requireUserId(req)
    uploadService.cancelUpload(uploadId, userId)

    return success(res, null, '上传已取消')
  } catch (err) {
    const message = err instanceof Error ? err.message : '取消上传失败'
    return error(res, message, 400)
  }
})

/**
 * GET /api/upload/list
 *
 * 获取当前用户的所有上传任务
 *
 * @returns 上传进度列表
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req)
    const uploads = uploadService.getUserUploads(userId)

    return success(res, uploads)
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取上传列表失败'
    return error(res, message, 400)
  }
})

/**
 * GET /api/upload/config
 *
 * 获取上传配置
 *
 * @returns 上传配置信息
 */
router.get('/config', (req: Request, res: Response) => {
  return success(res, {
    chunkSize: config.upload.chunkSize,
    maxParallelUploads: config.upload.maxParallelUploads,
    video: {
      maxFileSize: config.video.maxFileSize,
      allowedFormats: config.video.allowedInputFormats
    },
    img: {
      maxFileSize: config.img.maxFileSize,
      allowedFormats: config.img.allowedInputFormats
    }
  })
})

export default router