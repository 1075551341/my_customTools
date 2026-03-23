/**
 * 任务服务模块
 *
 * 提供任务创建、查询、状态管理等功能
 *
 * @module services/tasks
 */

import path from "path";
import * as tasksDb from "../db/tasks";
import * as storage from "../utils/storage";
import { addTranscodeJob } from "../queue";
import type {
  BaseTask,
  TaskStatus,
  TaskType,
  VideoTranscodeConfig,
  ImgTranscodeConfig,
  AnimTranscodeConfig,
  DocumentTranscodeConfig,
} from "../types";
import * as presetDb from "../db/presets";
import type {
  BatchCreateTaskRequest,
  BatchCreateTaskResponse,
} from "../types/batch";
import logger from "../utils/logger";

/**
 * 创建任务参数
 */
export interface CreateTaskParams {
  type: TaskType;
  fileName: string;
  fileSize: number;
  inputPath: string;
  inputFormat: string;
  outputFormat: string;
  config:
    | VideoTranscodeConfig
    | ImgTranscodeConfig
    | AnimTranscodeConfig
    | DocumentTranscodeConfig;
  userId: string;
}

/**
 * 任务查询参数
 */
export interface QueryTasksParams {
  userId?: string;
  status?: TaskStatus;
  type?: TaskType;
  page?: number;
  pageSize?: number;
}

/**
 * 创建任务
 *
 * @param params - 创建参数
 * @returns 创建的任务
 */
export function createTask(params: CreateTaskParams): BaseTask {
  // 生成输出路径
  const userOutputDir = storage.getUserOutputDir(params.userId);
  const outputFileName = storage.generateUniqueFileName(
    `${path.parse(params.fileName).name}.${params.outputFormat}`,
  );
  const outputPath = path.join(userOutputDir, outputFileName);

  const task = tasksDb.create({
    type: params.type,
    userId: params.userId,
    fileName: params.fileName,
    fileSize: params.fileSize,
    inputPath: params.inputPath,
    outputPath,
    inputFormat: params.inputFormat,
    outputFormat: params.outputFormat,
    config: params.config as Record<string, unknown>,
  });

  return task;
}

/**
 * 根据ID获取任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID（用于权限验证）
 * @returns 任务信息
 * @throws 任务不存在
 * @throws 无权限
 */
export function getTask(taskId: string, userId?: string): BaseTask {
  const task = tasksDb.findById(taskId);

  if (!task) {
    throw new Error("任务不存在");
  }

  // 权限验证
  if (userId && task.userId !== userId) {
    throw new Error("无权限访问此任务");
  }

  return task;
}

/**
 * 查询任务列表
 *
 * @param params - 查询参数
 * @returns 分页任务列表
 */
export function queryTasks(params: QueryTasksParams): {
  list: BaseTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  const { list, total } = tasksDb.findPaginated({
    userId: params.userId,
    status: params.status,
    type: params.type,
    page,
    pageSize,
  });

  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 更新任务状态
 *
 * @param taskId - 任务ID
 * @param status - 新状态
 * @param userId - 用户ID（用于权限验证）
 * @returns 更新后的任务
 * @throws 任务不存在
 * @throws 无权限
 */
export function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  userId?: string,
): BaseTask {
  // 验证任务存在和权限
  const task = getTask(taskId, userId);

  // 状态流转验证
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    waiting: ["uploading", "processing", "cancelled"],
    uploading: ["processing", "cancelled"],
    processing: ["completed", "failed", "cancelled"],
    completed: [],
    failed: [],
    cancelled: [],
  };

  if (!validTransitions[task.status].includes(status)) {
    throw new Error(`不能从 ${task.status} 状态转换到 ${status}`);
  }

  return tasksDb.updateStatus(taskId, status)!;
}

/**
 * 取消任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID
 * @returns 更新后的任务
 * @throws 任务不存在
 * @throws 无权限
 * @throws 任务无法取消
 */
export function cancelTask(taskId: string, userId: string): BaseTask {
  return updateTaskStatus(taskId, "cancelled", userId);
}

/**
 * 重试失败的任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID
 * @returns 更新后的任务
 * @throws 任务不存在
 * @throws 无权限
 * @throws 只能重试失败的任务
 */
export function retryTask(taskId: string, userId: string): BaseTask {
  const task = getTask(taskId, userId);

  if (task.status !== "failed") {
    throw new Error("只能重试失败的任务");
  }

  return tasksDb.update(taskId, {
    status: "waiting",
    progress: 0,
    errorMsg: undefined,
    startedAt: undefined,
    completedAt: undefined,
  })!;
}

/**
 * 删除任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID
 * @returns 是否删除成功
 * @throws 任务不存在
 * @throws 无权限
 * @throws 只能删除已完成的任务
 */
export function deleteTask(taskId: string, userId: string): boolean {
  const task = getTask(taskId, userId);

  // 只能删除已完成、失败或取消的任务
  if (!["completed", "failed", "cancelled"].includes(task.status)) {
    throw new Error("只能删除已完成、失败或取消的任务");
  }

  // 删除相关文件
  if (task.inputPath) {
    storage.deleteFile(task.inputPath);
  }
  if (task.outputPath) {
    storage.deleteFile(task.outputPath);
  }

  return tasksDb.remove(taskId);
}

/**
 * 获取任务统计
 *
 * @param userId - 用户ID（可选）
 * @returns 统计信息
 */
export function getTaskStats(userId?: string): Record<TaskStatus, number> {
  return tasksDb.getStats(userId);
}

/**
 * 更新任务进度
 *
 * @param taskId - 任务ID
 * @param progress - 进度（0-100）
 */
export function updateTaskProgress(taskId: string, progress: number): void {
  tasksDb.updateProgress(taskId, progress);
}

/**
 * 标记任务失败
 *
 * @param taskId - 任务ID
 * @param errorMsg - 错误信息
 */
export function markTaskFailed(taskId: string, errorMsg: string): void {
  tasksDb.updateStatus(taskId, "failed", errorMsg);
}

/**
 * 标记任务完成
 *
 * @param taskId - 任务ID
 */
export function markTaskCompleted(taskId: string): void {
  tasksDb.updateStatus(taskId, "completed");
  tasksDb.updateProgress(taskId, 100);
}

/**
 * 获取待处理的任务
 *
 * @returns 待处理任务列表
 */
export function getPendingTasks(): BaseTask[] {
  return tasksDb.findByStatus("waiting");
}

/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
export function cleanOldTasks(maxAgeDays: number = 7): number {
  return tasksDb.cleanOldTasks(maxAgeDays);
}

/**
 * 提交任务到转码队列
 *
 * @param taskId - 任务ID
 * @throws 任务不存在
 * @throws 任务状态不允许提交
 */
export async function submitTask(taskId: string): Promise<void> {
  const task = tasksDb.findById(taskId);

  if (!task) {
    throw new Error("任务不存在");
  }

  // 只有 waiting 状态的任务可以提交
  if (task.status !== "waiting") {
    throw new Error(`任务状态为 ${task.status}，无法提交`);
  }

  // 验证输入文件存在
  if (!task.inputPath || !storage.fileExists(task.inputPath)) {
    throw new Error("输入文件不存在");
  }

  // 加入转码队列
  await addTranscodeJob(task);

  // 更新状态为上传中（等待处理）
  tasksDb.updateStatus(taskId, "uploading");
}

/**
 * 创建图片序列合成 GIF 任务参数
 */
export interface CreateComposeGifParams {
  imagePaths: string[];
  outputFormat: "gif" | "webp" | "apng";
  config: AnimTranscodeConfig;
  userId: string;
}

/**
 * 创建图片序列合成 GIF 任务
 *
 * @param params - 创建参数
 * @returns 创建的任务
 */
export async function createComposeGifTask(
  params: CreateComposeGifParams,
): Promise<BaseTask> {
  const { imagePaths, outputFormat, config, userId } = params;

  // 验证所有图片存在
  for (const imgPath of imagePaths) {
    if (!storage.fileExists(imgPath)) {
      throw new Error(`图片文件不存在: ${imgPath}`);
    }
  }

  // 生成输出路径
  const userOutputDir = storage.getUserOutputDir(userId);
  const outputFileName = storage.generateUniqueFileName(
    `composed_${Date.now()}.${outputFormat}`,
  );
  const outputPath = path.join(userOutputDir, outputFileName);

  // 创建任务记录
  const task = tasksDb.create({
    type: "anim",
    userId,
    fileName: `图片序列合成 (${imagePaths.length}张)`,
    fileSize: 0,
    inputPath: imagePaths[0], // 存储第一张图片作为参考
    outputPath,
    inputFormat: "images",
    outputFormat,
    config: {
      ...config,
      imagePaths,
      outputFormat,
    } as Record<string, unknown>,
  });

  // 直接提交到队列（使用特殊处理逻辑）
  await addTranscodeJob({
    ...task,
    config: {
      ...task.config,
      imagePaths,
    },
  });

  // 更新状态
  tasksDb.updateStatus(task.id, "processing");

  return task;
}

/**
 * 根据预设创建任务
 *
 * @param fileId - 文件 ID
 * @param preset - 预设配置
 * @param userId - 用户 ID
 * @returns 创建的任务
 */
function createTaskFromPreset(
  fileId: string,
  preset: presetDb.Preset,
  userId: string,
): BaseTask {
  // 获取文件信息
  const fileInfo = tasksDb.findById(fileId);
  if (!fileInfo) {
    throw new Error(`文件不存在：${fileId}`);
  }

  // 根据预设类型确定任务类型和输出格式
  let taskType: TaskType;
  let outputFormat: string;
  let config: Record<string, unknown>;

  if (preset.type === "video") {
    taskType = "video";
    outputFormat = preset.config.codec || "h264";
    config = {
      ...preset.config,
      codec: preset.config.codec,
      resolution: preset.config.resolution,
      bitrate: preset.config.bitrate,
      fps: preset.config.fps,
      crf: preset.config.crf,
      audioCodec: preset.config.audioCodec,
    };
  } else if (preset.type === "image") {
    taskType = "img";
    outputFormat = preset.config.format || "webp";
    config = {
      format: preset.config.format,
      quality: preset.config.quality,
    };
  } else {
    // document
    taskType = "document";
    outputFormat = preset.config.targetFormat || "pdf";
    // 根据输入格式和目标格式推断 subtype
    const inputExt = fileInfo.inputFormat.toLowerCase();
    const targetFmt = outputFormat.toLowerCase();
    let subtype: string;

    if ((inputExt === "doc" || inputExt === "docx") && targetFmt === "pdf") {
      subtype = "word-to-pdf";
    } else if ((inputExt === "xls" || inputExt === "xlsx") && targetFmt === "csv") {
      subtype = "excel-to-csv";
    } else if ((inputExt === "xls" || inputExt === "xlsx") && (targetFmt === "word" || targetFmt === "doc" || targetFmt === "docx")) {
      subtype = "excel-to-word";
    } else if (inputExt === "pdf" && targetFmt === "pdf") {
      // PDF 合并（多文件）
      subtype = "pdf-merge";
    } else {
      // 默认使用 word-to-pdf
      subtype = "word-to-pdf";
    }

    config = {
      targetFormat: outputFormat,
      subtype,
    };
  }

  // 生成输出路径
  const userOutputDir = storage.getUserOutputDir(userId);
  const outputFileName = storage.generateUniqueFileName(
    `${path.parse(fileInfo.fileName).name}.${outputFormat}`,
  );
  const outputPath = path.join(userOutputDir, outputFileName);

  const task = tasksDb.create({
    type: taskType,
    userId,
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    inputPath: fileInfo.inputPath,
    outputPath,
    inputFormat: fileInfo.inputFormat,
    outputFormat,
    config,
  });

  return task;
}

/**
 * 批量创建转码任务
 *
 * 对于每个文件和每个预设的组合，创建一个任务
 * 例如：3 个文件 × 2 个预设 = 6 个任务
 *
 * @param data - 批量创建请求参数
 * @returns 批量创建响应
 */
export async function batchCreateTasks(
  data: BatchCreateTaskRequest,
): Promise<BatchCreateTaskResponse> {
  const { fileIds, presetIds, userId } = data;
  const tasks: BaseTask[] = [];
  const failed: Array<{ fileId: string; presetId: string; reason: string }> =
    [];

  // 获取所有预设
  const presets = presetDb.getAllPresets();
  const selectedPresets = presets.filter((p) => presetIds.includes(p.id));

  for (const fileId of fileIds) {
    for (const preset of selectedPresets) {
      try {
        // 为每个文件 - 预设组合创建任务
        const task = createTaskFromPreset(fileId, preset, userId);
        tasks.push(task);

        // 自动提交任务到队列
        try {
          await addTranscodeJob(task);
          // 更新状态为 uploading（等待处理）
          tasksDb.updateStatus(task.id, "uploading");
        } catch (submitError) {
          logger.warn("任务提交到队列失败", {
            taskId: task.id,
            error: (submitError as Error).message,
          });
        }
      } catch (error) {
        failed.push({
          fileId,
          presetId: preset.id,
          reason: (error as Error).message,
        });
      }
    }
  }

  return {
    total: tasks.length,
    tasks,
    failed,
  };
}
