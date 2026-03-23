/**
 * 任务路由模块
 *
 * 提供任务创建、查询、状态管理等接口
 *
 * @module routes/tasks
 */

import { Router, Request, Response } from "express";
import { success, error, paginated } from "../utils/response";
import { authMiddleware, requireUserId } from "../middlewares/auth";
import * as tasksService from "../services/tasks";
import type {
  TaskStatus,
  TaskType,
  VideoTranscodeConfig,
  ImgTranscodeConfig,
  AnimTranscodeConfig,
} from "../types";

const router: Router = Router();

// 所有任务接口需要认证
router.use(authMiddleware);

/**
 * POST /api/tasks
 *
 * 创建新任务
 *
 * @body {type, fileName, fileSize, inputPath, inputFormat, outputFormat, config}
 * @returns 任务信息
 */
router.post("/", async (req: Request, res: Response) => {
  const {
    type,
    fileName,
    fileSize,
    inputPath,
    inputFormat,
    outputFormat,
    config,
  } = req.body;

  // 参数验证
  if (!type || !fileName || !inputPath || !outputFormat) {
    return error(
      res,
      "type、fileName、inputPath 和 outputFormat 不能为空",
      400,
    );
  }

  if (!["video", "img", "anim", "document"].includes(type)) {
    return error(res, "type 必须是 video、img、anim 或 document", 400);
  }

  try {
    const userId = requireUserId(req);
    const task = tasksService.createTask({
      type: type as TaskType,
      fileName,
      fileSize: fileSize || 0,
      inputPath,
      inputFormat: inputFormat || "",
      outputFormat,
      config: config || {},
      userId,
    });

    // 自动提交任务到队列
    try {
      await tasksService.submitTask(task.id);
    } catch (submitError) {
      console.warn("任务提交到队列失败:", submitError);
    }

    return success(res, task, "任务创建成功");
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建任务失败";
    return error(res, message, 400);
  }
});

/**
 * GET /api/tasks
 *
 * 查询任务列表
 *
 * @query status, type, page, pageSize
 * @returns 分页任务列表
 */
router.get("/", (req: Request, res: Response) => {
  const { status, type, page, pageSize } = req.query;

  try {
    const userId = requireUserId(req);
    const result = tasksService.queryTasks({
      userId,
      status: status as TaskStatus | undefined,
      type: type as TaskType | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
    });

    return paginated(
      res,
      result.list,
      result.total,
      result.page,
      result.pageSize,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询任务失败";
    return error(res, message, 400);
  }
});

/**
 * GET /api/tasks/stats
 *
 * 获取任务统计
 *
 * @returns 统计信息
 */
router.get("/stats", (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req);
    const stats = tasksService.getTaskStats(userId);

    return success(res, stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取统计失败";
    return error(res, message, 400);
  }
});

/**
 * GET /api/tasks/:taskId
 *
 * 获取任务详情
 *
 * @param taskId - 任务ID
 * @returns 任务信息
 */
router.get("/:taskId", (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;

  try {
    const userId = requireUserId(req);
    const task = tasksService.getTask(taskId, userId);

    return success(res, task);
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取任务失败";
    return error(res, message, 404);
  }
});

/**
 * PUT /api/tasks/:taskId/status
 *
 * 更新任务状态
 *
 * @param taskId - 任务ID
 * @body {status}
 * @returns 更新后的任务
 */
router.put("/:taskId/status", (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const { status } = req.body;

  if (!status) {
    return error(res, "status 不能为空", 400);
  }

  const validStatuses: TaskStatus[] = [
    "waiting",
    "uploading",
    "processing",
    "completed",
    "failed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return error(res, `status 必须是: ${validStatuses.join(", ")}`, 400);
  }

  try {
    const userId = requireUserId(req);
    const task = tasksService.updateTaskStatus(
      taskId,
      status as TaskStatus,
      userId,
    );

    return success(res, task, "状态更新成功");
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新状态失败";
    return error(res, message, 400);
  }
});

/**
 * POST /api/tasks/:taskId/cancel
 *
 * 取消任务
 *
 * @param taskId - 任务ID
 * @returns 更新后的任务
 */
router.post("/:taskId/cancel", (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;

  try {
    const userId = requireUserId(req);
    const task = tasksService.cancelTask(taskId, userId);

    return success(res, task, "任务已取消");
  } catch (err) {
    const message = err instanceof Error ? err.message : "取消任务失败";
    return error(res, message, 400);
  }
});

/**
 * POST /api/tasks/:taskId/retry
 *
 * 重试失败的任务
 *
 * @param taskId - 任务ID
 * @returns 更新后的任务
 */
router.post("/:taskId/retry", (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;

  try {
    const userId = requireUserId(req);
    const task = tasksService.retryTask(taskId, userId);

    return success(res, task, "任务已重新排队");
  } catch (err) {
    const message = err instanceof Error ? err.message : "重试任务失败";
    return error(res, message, 400);
  }
});

/**
 * POST /api/tasks/compose-gif
 *
 * 创建图片序列合成 GIF 任务
 *
 * @body {imagePaths, outputFormat, config}
 * @returns 任务信息
 */
router.post("/compose-gif", async (req: Request, res: Response) => {
  const { imagePaths, outputFormat, config } = req.body;

  // 参数验证
  if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
    return error(res, "imagePaths 必须是非空数组", 400);
  }

  if (!outputFormat || !["gif", "webp", "apng"].includes(outputFormat)) {
    return error(res, "outputFormat 必须是 gif、webp 或 apng", 400);
  }

  try {
    const userId = requireUserId(req);
    const task = await tasksService.createComposeGifTask({
      imagePaths,
      outputFormat,
      config: (config as AnimTranscodeConfig) || {},
      userId,
    });

    return success(res, task, "合成任务创建成功");
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建合成任务失败";
    return error(res, message, 400);
  }
});

/**
 * POST /api/tasks/:taskId/submit
 *
 * 提交任务到转码队列
 *
 * @param taskId - 任务ID
 * @returns 操作结果
 */
router.post("/:taskId/submit", async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;

  try {
    await tasksService.submitTask(taskId);

    return success(res, null, "任务已提交到队列");
  } catch (err) {
    const message = err instanceof Error ? err.message : "提交任务失败";
    return error(res, message, 400);
  }
});

/**
 * DELETE /api/tasks/:taskId
 *
 * 删除任务
 *
 * @param taskId - 任务ID
 */
router.delete("/:taskId", (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;

  try {
    const userId = requireUserId(req);
    tasksService.deleteTask(taskId, userId);

    return success(res, null, "任务已删除");
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除任务失败";
    return error(res, message, 400);
  }
});

/**
 * POST /api/tasks/batch
 *
 * 批量创建转码任务
 *
 * @body {fileIds, presetIds}
 * @returns { total, tasks, failed }
 */
router.post("/batch", async (req: Request, res: Response) => {
  const { fileIds, presetIds } = req.body;

  // 参数验证
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return error(res, "fileIds 不能为空", 400);
  }

  if (!presetIds || !Array.isArray(presetIds) || presetIds.length === 0) {
    return error(res, "presetIds 不能为空", 400);
  }

  try {
    const userId = requireUserId(req);
    const result = await tasksService.batchCreateTasks({
      fileIds,
      presetIds,
      userId,
    });

    return success(res, result, `批量创建 ${result.total} 个任务成功`, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "批量创建失败";
    return error(res, message, 400);
  }
});

export default router;
