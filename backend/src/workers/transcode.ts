/**
 * 转码工作进程模块
 *
 * 消费任务队列并执行转码操作
 *
 * 功能说明：
 * - 监听任务队列
 * - 执行视频/图片/动图转码
 * - 更新任务状态和进度
 * - 推送实时进度到客户端
 *
 * @module workers/transcode
 */

import Queue from "bull";
import type { Application } from "express";
import { Server } from "socket.io";
import {
  videoQueue,
  imageQueue,
  animQueue,
  documentQueue,
  initQueueEvents,
  type TranscodeJobData,
  type TranscodeJobProgress,
} from "../queue";
import * as videoEncoders from "../encoders/video";
import imageEncoder from "../encoders/image";
import animEncoder, { transcodeFromImages } from "../encoders/anim";
import * as documentEncoders from "../encoders/document";
import * as tasksService from "../services/tasks";
import * as messagesDb from "../db/messages";
import { socketEmitter, initSocketEmitter } from "../socket";
import logger from "../utils/logger";
import config from "../config";
import type {
  VideoTranscodeConfig,
  ImgTranscodeConfig,
  AnimTranscodeConfig,
  DocumentTranscodeConfig,
} from "../types";

/**
 * Socket.io 服务器实例
 */
let io: Server | null = null;

/**
 * 队列处理器映射表
 */
const queueProcessors: Map<
  string,
  (job: Queue.Job<TranscodeJobData>) => Promise<unknown>
> = new Map();

/**
 * 初始化转码工作进程
 *
 * @param app - Express 应用实例
 */
export function initWorkers(app: Application): void {
  // 获取 Socket.io 实例
  io = app.get("io");

  // 初始化 Socket 发射器
  initSocketEmitter(io!);

  // 初始化队列事件监听
  initQueueEvents();

  // 启动队列处理器
  startVideoWorker();
  startImageWorker();
  startAnimWorker();
  startDocumentWorker();

  logger.info("转码工作进程已启动");
}

/**
 * 启动视频转码工作进程
 */
function startVideoWorker(): void {
  const concurrency = config.video.parallelLimit || 3;

  videoQueue.process(concurrency, async (job: Queue.Job<TranscodeJobData>) => {
    const {
      taskId,
      type,
      inputPath,
      outputPath,
      config: transcodeConfig,
    } = job.data;

    logger.info("开始视频转码任务", { taskId, jobId: job.id });

    try {
      // 检查任务状态，避免重试时状态冲突
      const task = tasksService.getTask(taskId);
      if (["completed", "failed", "cancelled"].includes(task.status)) {
        logger.warn("任务已是终态，跳过处理", { taskId, status: task.status });
        return { skipped: true, reason: `任务状态为 ${task.status}` };
      }

      // 更新任务状态为处理中
      tasksService.updateTaskStatus(taskId, "processing");

      // 获取编码器
      const encoderConfig = transcodeConfig as VideoTranscodeConfig;
      const encoderName = encoderConfig.videoCodec || "h264";
      const encoder = videoEncoders.getEncoder(encoderName);

      if (!encoder) {
        throw new Error(`不支持的视频编码器: ${encoderName}`);
      }

      // 执行转码
      const result = await encoder.transcode(
        inputPath,
        outputPath,
        encoderConfig,
        (progress) => {
          // 更新进度
          tasksService.updateTaskProgress(taskId, progress.percent);

          // 推送进度到客户端
          pushProgress(job.data.userId, {
            taskId,
            percent: progress.percent,
            stage: "转码中",
            timestamp: Date.now(),
          });

          // 更新 Bull 任务进度
          job.progress(progress.percent);
        },
      );

      // 标记任务完成
      tasksService.markTaskCompleted(taskId);

      // 推送完成通知
      pushCompleted(job.data.userId, {
        taskId,
        outputSize: result.outputSize,
        format: "mp4",
        duration: result.duration,
      });

      logger.info("视频转码任务完成", {
        taskId,
        outputSize: result.outputSize,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;

      // 标记任务失败
      tasksService.markTaskFailed(taskId, errorMsg);

      // 推送失败通知
      pushFailed(job.data.userId, { taskId, errorMsg });

      logger.error("视频转码任务失败", { taskId, error: errorMsg });

      throw error;
    }
  });

  logger.info(`视频转码工作进程已启动，并发数: ${concurrency}`);
}

/**
 * 启动图片转码工作进程
 */
function startImageWorker(): void {
  const concurrency = config.img.parallelLimit || 5;

  imageQueue.process(concurrency, async (job: Queue.Job<TranscodeJobData>) => {
    const {
      taskId,
      type,
      inputPath,
      outputPath,
      config: transcodeConfig,
    } = job.data;

    logger.info("开始图片转码任务", { taskId, jobId: job.id });

    try {
      // 检查任务状态，避免重试时状态冲突
      const task = tasksService.getTask(taskId);
      if (["completed", "failed", "cancelled"].includes(task.status)) {
        logger.warn("任务已是终态，跳过处理", { taskId, status: task.status });
        return { skipped: true, reason: `任务状态为 ${task.status}` };
      }

      // 更新任务状态为处理中
      tasksService.updateTaskStatus(taskId, "processing");

      // 获取转码配置，确保 outputFormat 存在
      const encoderConfig: ImgTranscodeConfig = {
        outputFormat: (task.outputFormat ||
          "jpg") as ImgTranscodeConfig["outputFormat"],
        ...(transcodeConfig as Record<string, unknown>),
      };

      // 执行转码
      const result = await imageEncoder.transcode(
        inputPath,
        outputPath,
        encoderConfig,
        (progress) => {
          // 更新进度
          tasksService.updateTaskProgress(taskId, progress.percent);

          // 推送进度到客户端
          pushProgress(job.data.userId, {
            taskId,
            percent: progress.percent,
            stage: progress.stage,
            timestamp: Date.now(),
          });

          // 更新 Bull 任务进度
          job.progress(progress.percent);
        },
      );

      // 标记任务完成
      tasksService.markTaskCompleted(taskId);

      // 推送完成通知
      pushCompleted(job.data.userId, {
        taskId,
        outputSize: result.outputSize,
        format: result.format,
      });

      logger.info("图片转码任务完成", {
        taskId,
        outputSize: result.outputSize,
        format: result.format,
      });

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;

      // 标记任务失败
      tasksService.markTaskFailed(taskId, errorMsg);

      // 推送失败通知
      pushFailed(job.data.userId, { taskId, errorMsg });

      logger.error("图片转码任务失败", { taskId, error: errorMsg });

      throw error;
    }
  });

  logger.info(`图片转码工作进程已启动，并发数: ${concurrency}`);
}

/**
 * 启动动图转码工作进程
 */
function startAnimWorker(): void {
  const concurrency = 2; // 动图转码较慢，限制并发

  animQueue.process(concurrency, async (job: Queue.Job<TranscodeJobData>) => {
    const {
      taskId,
      type,
      inputPath,
      outputPath,
      config: transcodeConfig,
    } = job.data;

    logger.info("开始动图转码任务", { taskId, jobId: job.id });

    try {
      // 检查任务状态，避免重试时状态冲突
      const task = tasksService.getTask(taskId);
      if (["completed", "failed", "cancelled"].includes(task.status)) {
        logger.warn("任务已是终态，跳过处理", { taskId, status: task.status });
        return { skipped: true, reason: `任务状态为 ${task.status}` };
      }

      // 更新任务状态为处理中
      tasksService.updateTaskStatus(taskId, "processing");

      // 获取转码配置
      const encoderConfig = transcodeConfig as unknown as AnimTranscodeConfig;

      // 检查是否是图片序列合成任务
      const imagePaths = encoderConfig.imagePaths as string[] | undefined;

      let result;
      if (imagePaths && imagePaths.length > 0) {
        // 图片序列合成动图
        result = await transcodeFromImages(
          imagePaths,
          outputPath,
          encoderConfig,
          (progress) => {
            // 更新进度
            tasksService.updateTaskProgress(taskId, progress.percent);

            // 推送进度到客户端
            pushProgress(job.data.userId, {
              taskId,
              percent: progress.percent,
              stage: progress.stage,
              timestamp: Date.now(),
            });

            // 更新 Bull 任务进度
            job.progress(progress.percent);
          },
        );
      } else {
        // 视频转动图
        result = await animEncoder.transcode(
          inputPath,
          outputPath,
          encoderConfig,
          (progress) => {
            // 更新进度
            tasksService.updateTaskProgress(taskId, progress.percent);

            // 推送进度到客户端
            pushProgress(job.data.userId, {
              taskId,
              percent: progress.percent,
              stage: progress.stage,
              timestamp: Date.now(),
            });

            // 更新 Bull 任务进度
            job.progress(progress.percent);
          },
        );
      }

      // 标记任务完成
      tasksService.markTaskCompleted(taskId);

      // 推送完成通知
      pushCompleted(job.data.userId, {
        taskId,
        outputSize: result.outputSize,
        format: result.format,
      });

      logger.info("动图转码任务完成", {
        taskId,
        outputSize: result.outputSize,
        format: result.format,
      });

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;

      // 标记任务失败
      tasksService.markTaskFailed(taskId, errorMsg);

      // 推送失败通知
      pushFailed(job.data.userId, { taskId, errorMsg });

      logger.error("动图转码任务失败", { taskId, error: errorMsg });

      throw error;
    }
  });

  logger.info(`动图转码工作进程已启动，并发数: ${concurrency}`);
}

/**
 * 启动文档转码工作进程
 */
function startDocumentWorker(): void {
  const concurrency = 3;

  documentQueue.process(
    concurrency,
    async (job: Queue.Job<TranscodeJobData>) => {
      const {
        taskId,
        type,
        inputPath,
        outputPath,
        config: transcodeConfig,
      } = job.data;

      logger.info("开始文档转换任务", { taskId, jobId: job.id });

      try {
        // 检查任务状态，避免重试时状态冲突
        const task = tasksService.getTask(taskId);
        if (["completed", "failed", "cancelled"].includes(task.status)) {
          logger.warn("任务已是终态，跳过处理", {
            taskId,
            status: task.status,
          });
          return { skipped: true, reason: `任务状态为 ${task.status}` };
        }

        // 更新任务状态为处理中
        tasksService.updateTaskStatus(taskId, "processing");

        // 获取转码配置
        const encoderConfig =
          transcodeConfig as unknown as DocumentTranscodeConfig;
        let subtype = encoderConfig.subtype;

        // 如果没有指定 subtype，尝试根据输入输出格式推断
        if (!subtype) {
          const inputExt = inputPath.split('.').pop()?.toLowerCase() || '';
          const outputExt = outputPath.split('.').pop()?.toLowerCase() || '';

          if ((inputExt === 'doc' || inputExt === 'docx') && outputExt === 'pdf') {
            subtype = 'word-to-pdf';
          } else if ((inputExt === 'xls' || inputExt === 'xlsx') && outputExt === 'csv') {
            subtype = 'excel-to-csv';
          } else if ((inputExt === 'xls' || inputExt === 'xlsx') && (outputExt === 'word' || outputExt === 'doc' || outputExt === 'docx')) {
            subtype = 'excel-to-word';
          } else if (inputExt === 'pdf' && outputExt === 'pdf') {
            subtype = 'pdf-merge';
          } else {
            // 默认尝试 word-to-pdf
            subtype = 'word-to-pdf';
          }
          logger.info("未指定 subtype，自动推断", { inputExt, outputExt, subtype });
        }

        // 获取编码器
        const encoder = documentEncoders.getEncoder(subtype);

        if (!encoder) {
          throw new Error(`不支持的文档转换类型: ${subtype}`);
        }

        // 处理多文件输入（如 PDF 合并）
        const inputPaths = inputPath.includes(",")
          ? inputPath.split(",")
          : inputPath;

        // 执行转换
        const result = await encoder.transcode(
          inputPaths,
          outputPath,
          encoderConfig,
          (progress) => {
            // 更新进度
            tasksService.updateTaskProgress(taskId, progress.percent);

            // 推送进度到客户端
            pushProgress(job.data.userId, {
              taskId,
              percent: progress.percent,
              stage: progress.stage,
              timestamp: Date.now(),
            });

            // 更新 Bull 任务进度
            job.progress(progress.percent);
          },
        );

        // 标记任务完成
        tasksService.markTaskCompleted(taskId);

        // 推送完成通知
        pushCompleted(job.data.userId, {
          taskId,
          outputSize: result.outputSize,
          format: result.format,
        });

        logger.info("文档转换任务完成", {
          taskId,
          outputSize: result.outputSize,
          format: result.format,
        });

        return result;
      } catch (error) {
        const errorMsg = (error as Error).message;

        // 标记任务失败
        tasksService.markTaskFailed(taskId, errorMsg);

        // 推送失败通知
        pushFailed(job.data.userId, { taskId, errorMsg });

        logger.error("文档转换任务失败", { taskId, error: errorMsg });

        throw error;
      }
    },
  );

  logger.info(`文档转码工作进程已启动，并发数: ${concurrency}`);
}

/**
 * 推送进度到客户端
 *
 * @param userId - 用户ID
 * @param progress - 进度信息
 */
function pushProgress(userId: string, progress: TranscodeJobProgress): void {
  socketEmitter.emitTaskProgress(userId, progress);
}

/**
 * 推送任务完成通知
 *
 * @param userId - 用户ID
 * @param data - 完成数据
 */
function pushCompleted(
  userId: string,
  data: {
    taskId: string;
    outputSize: number;
    format: string;
    duration?: number;
  },
): void {
  socketEmitter.emitTaskCompleted(userId, {
    taskId: data.taskId,
    outputSize: data.outputSize,
    format: data.format,
    duration: data.duration || 0,
  });

  // 同时推送状态变更
  socketEmitter.emitTaskStatus(userId, {
    taskId: data.taskId,
    status: "completed",
    outputSize: data.outputSize,
  });

  // 创建消息通知
  try {
    const task = tasksService.getTask(data.taskId);
    messagesDb.createMessage({
      userId,
      type: "normal",
      title: "任务完成",
      content: `您的${task.type}转码任务 "${task.fileName}" 已完成，输出格式：${data.format}`,
      link: `/tasks`,
      isRead: false,
    });
  } catch (error) {
    logger.error("创建完成消息失败", { error });
  }
}

/**
 * 推送任务失败通知
 *
 * @param userId - 用户ID
 * @param data - 失败数据
 */
function pushFailed(
  userId: string,
  data: { taskId: string; errorMsg: string },
): void {
  socketEmitter.emitTaskFailed(userId, {
    taskId: data.taskId,
    errorMsg: data.errorMsg,
  });

  // 同时推送状态变更
  socketEmitter.emitTaskStatus(userId, {
    taskId: data.taskId,
    status: "failed",
    errorMsg: data.errorMsg,
  });

  // 创建消息通知
  try {
    const task = tasksService.getTask(data.taskId);
    messagesDb.createMessage({
      userId,
      type: "todo",
      title: "任务失败",
      content: `您的${task.type}转码任务 "${task.fileName}" 失败：${data.errorMsg}`,
      link: `/tasks`,
      isRead: false,
    });
  } catch (error) {
    logger.error("创建失败消息失败", { error });
  }
}

/**
 * 停止所有工作进程
 */
export async function stopWorkers(): Promise<void> {
  await Promise.all([
    videoQueue.close(),
    imageQueue.close(),
    animQueue.close(),
    documentQueue.close(),
  ]);

  logger.info("转码工作进程已停止");
}
