/**
 * 上传路由模块
 *
 * 提供文件分片上传、进度查询、取消上传等接口
 *
 * @module routes/upload
 */

import path from "path";
import { Router, Request, Response } from "express";
import multer from "multer";
import { success, error } from "../utils/response";
import { authMiddleware, requireUserId } from "../middlewares/auth";
import * as uploadService from "../services/upload";
import * as storage from "../utils/storage";
import config from "../config";

const router: Router = Router();

// 所有上传接口需要认证
router.use(authMiddleware);

/**
 * Multer 配置 - 内存存储，用于分片上传
 */
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.chunkSize * 2, // 分片大小上限
  },
});

/**
 * Multer 配置 - 用于单文件上传
 */
const singleUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const type = req.body.type || "video";
      const uploadDir = path.join(config.storage.uploadDir, type);
      storage.ensureDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: Math.max(config.video.maxFileSize, config.img.maxFileSize),
  },
});

/**
 * POST /api/upload/single
 *
 * 单文件上传
 *
 * @body file, type (multipart)
 * @returns taskId
 */
router.post("/single", singleUpload.single("file"), (req: Request, res: Response) => {
  const { type, outputFormat, transcodeConfig } = req.body;

  // 参数验证
  if (!type) {
    return error(res, "type 不能为空", 400);
  }

  if (!["video", "img", "document"].includes(type)) {
    return error(res, "type 必须是 video、img 或 document", 400);
  }

  if (!req.file) {
    return error(res, "未上传文件", 400);
  }

  try {
    const userId = requireUserId(req);

    // 获取文件信息
    const fs = require("fs");
    const stats = fs.statSync(req.file.path);

    // 获取输入格式（文件扩展名）
    const inputFormat = path.extname(req.file.filename).slice(1).toLowerCase();

    // 根据类型确定输出格式
    // 优先使用 transcodeConfig 中的 outputFormat，其次使用 outputFormat，最后使用输入格式
    let finalOutputFormat = inputFormat;

    // 解析转码配置（从前端传来的 JSON 字符串）
    let config: Record<string, unknown> = {};
    if (transcodeConfig) {
      try {
        config = typeof transcodeConfig === 'string'
          ? JSON.parse(transcodeConfig)
          : transcodeConfig;
        // 从 transcodeConfig 中获取 outputFormat
        if (config.outputFormat) {
          finalOutputFormat = config.outputFormat as string;
        }
      } catch (e) {
        console.warn("解析 transcodeConfig 失败:", e);
      }
    }

    // 如果 transcodeConfig 中没有 outputFormat，使用 outputFormat 参数
    if (!config.outputFormat && outputFormat) {
      finalOutputFormat = outputFormat;
    }

    if (type === "video" && !outputFormat && !config.outputFormat) {
      finalOutputFormat = "mp4"; // 视频默认输出 mp4
    }

    // 创建任务参数
    const taskParams: {
      type: string;
      fileName: string;
      fileSize: number;
      inputPath: string;
      inputFormat: string;
      outputFormat: string;
      config: Record<string, unknown>;
      userId: string;
    } = {
      type,
      fileName: req.file.filename,
      fileSize: stats.size,
      inputPath: req.file.path,
      inputFormat,
      outputFormat: finalOutputFormat,
      config,
      userId,
    };

    // 创建任务
    const taskService = require("../services/tasks");
    const task = taskService.createTask(taskParams);

    // 添加到处理队列
    const queue = require("../queue");
    queue.addTranscodeJob(task);

    return success(res, { taskId: task.id }, "文件上传成功，已加入处理队列");
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    console.error("单文件上传失败:", err);
    return error(res, message, 400);
  }
});

/**
 * POST /api/upload/session
 *
 * 创建上传会话
 *
 * @body {fileName, fileSize, type}
 * @returns 上传会话信息
 */
router.post("/session", (req: Request, res: Response) => {
  const { fileName, fileSize, type } = req.body;

  // 参数验证
  if (!fileName || !fileSize || !type) {
    return error(res, "fileName、fileSize 和 type 不能为空", 400);
  }

  if (!["video", "img", "anim"].includes(type)) {
    return error(res, "type 必须是 video、img 或 anim", 400);
  }

  if (typeof fileSize !== "number" || fileSize <= 0) {
    return error(res, "fileSize 必须是正数", 400);
  }

  try {
    const userId = requireUserId(req);
    const session = uploadService.createSession({
      fileName,
      fileSize,
      type: type as "video" | "img" | "anim",
      userId,
    });

    return success(
      res,
      {
        uploadId: session.uploadId,
        totalChunks: session.totalChunks,
        chunkSize: config.upload.chunkSize,
      },
      "上传会话创建成功",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建上传会话失败";
    return error(res, message, 400);
  }
});

/**
 * POST /api/upload/chunk
 *
 * 上传分片
 *
 * @body uploadId, chunkIndex, file (multipart)
 * @returns 上传进度
 */
router.post(
  "/chunk",
  chunkUpload.single("file"),
  (req: Request, res: Response) => {
    const { uploadId, chunkIndex } = req.body;

    // 参数验证
    if (!uploadId || chunkIndex === undefined) {
      return error(res, "uploadId 和 chunkIndex 不能为空", 400);
    }

    if (!req.file) {
      return error(res, "未上传分片文件", 400);
    }

    try {
      const userId = requireUserId(req);
      const progress = uploadService.uploadChunk({
        uploadId,
        chunkIndex: parseInt(chunkIndex, 10),
        chunkData: req.file.buffer,
        userId,
      });

      return success(res, progress);
    } catch (err) {
      const message = err instanceof Error ? err.message : "上传分片失败";
      return error(res, message, 400);
    }
  },
);

/**
 * POST /api/upload/complete
 *
 * 完成上传（合并分片）
 *
 * @body {uploadId}
 * @returns 合并后的文件路径
 */
router.post("/complete", async (req: Request, res: Response) => {
  const { uploadId } = req.body;

  if (!uploadId) {
    return error(res, "uploadId 不能为空", 400);
  }

  try {
    const userId = requireUserId(req);
    const filePath = await uploadService.completeUpload(uploadId, userId);

    return success(
      res,
      {
        filePath,
        fileName: path.basename(filePath),
      },
      "上传完成",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "完成上传失败";
    return error(res, message, 400);
  }
});

/**
 * GET /api/upload/progress/:uploadId
 *
 * 获取上传进度
 *
 * @param uploadId - 上传ID
 * @returns 上传进度
 */
router.get("/progress/:uploadId", (req: Request, res: Response) => {
  const uploadId = req.params.uploadId as string;

  try {
    const progress = uploadService.getProgress(uploadId);
    if (!progress) {
      return error(res, "上传会话不存在", 404);
    }

    return success(res, progress);
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取进度失败";
    return error(res, message, 400);
  }
});

/**
 * DELETE /api/upload/cancel/:uploadId
 *
 * 取消上传
 *
 * @param uploadId - 上传ID
 */
router.delete("/cancel/:uploadId", (req: Request, res: Response) => {
  const uploadId = req.params.uploadId as string;

  try {
    const userId = requireUserId(req);
    uploadService.cancelUpload(uploadId, userId);

    return success(res, null, "上传已取消");
  } catch (err) {
    const message = err instanceof Error ? err.message : "取消上传失败";
    return error(res, message, 400);
  }
});

/**
 * GET /api/upload/list
 *
 * 获取当前用户的所有上传任务
 *
 * @returns 上传进度列表
 */
router.get("/list", (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req);
    const uploads = uploadService.getUserUploads(userId);

    return success(res, uploads);
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取上传列表失败";
    return error(res, message, 400);
  }
});

/**
 * GET /api/upload/config
 *
 * 获取上传配置
 *
 * @returns 上传配置信息
 */
router.get("/config", (req: Request, res: Response) => {
  return success(res, {
    chunkSize: config.upload.chunkSize,
    maxParallelUploads: config.upload.maxParallelUploads,
    video: {
      maxFileSize: config.video.maxFileSize,
      allowedFormats: config.video.allowedInputFormats,
    },
    img: {
      maxFileSize: config.img.maxFileSize,
      allowedFormats: config.img.allowedInputFormats,
    },
  });
});

export default router;
