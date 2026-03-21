"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWorkers = initWorkers;
exports.stopWorkers = stopWorkers;
const queue_1 = require("../queue");
const videoEncoders = __importStar(require("../encoders/video"));
const image_1 = __importDefault(require("../encoders/image"));
const anim_1 = __importStar(require("../encoders/anim"));
const documentEncoders = __importStar(require("../encoders/document"));
const tasksService = __importStar(require("../services/tasks"));
const socket_1 = require("../socket");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config"));
/**
 * Socket.io 服务器实例
 */
let io = null;
/**
 * 队列处理器映射表
 */
const queueProcessors = new Map();
/**
 * 初始化转码工作进程
 *
 * @param app - Express 应用实例
 */
function initWorkers(app) {
    // 获取 Socket.io 实例
    io = app.get('io');
    // 初始化 Socket 发射器
    (0, socket_1.initSocketEmitter)(io);
    // 初始化队列事件监听
    (0, queue_1.initQueueEvents)();
    // 启动队列处理器
    startVideoWorker();
    startImageWorker();
    startAnimWorker();
    startDocumentWorker();
    logger_1.default.info('转码工作进程已启动');
}
/**
 * 启动视频转码工作进程
 */
function startVideoWorker() {
    const concurrency = config_1.default.video.parallelLimit || 3;
    queue_1.videoQueue.process(concurrency, async (job) => {
        const { taskId, type, inputPath, outputPath, config: transcodeConfig } = job.data;
        logger_1.default.info('开始视频转码任务', { taskId, jobId: job.id });
        try {
            // 检查任务状态，避免重试时状态冲突
            const task = tasksService.getTask(taskId);
            if (['completed', 'failed', 'cancelled'].includes(task.status)) {
                logger_1.default.warn('任务已是终态，跳过处理', { taskId, status: task.status });
                return { skipped: true, reason: `任务状态为 ${task.status}` };
            }
            // 更新任务状态为处理中
            tasksService.updateTaskStatus(taskId, 'processing');
            // 获取编码器
            const encoderConfig = transcodeConfig;
            const encoderName = encoderConfig.videoCodec || 'h264';
            const encoder = videoEncoders.getEncoder(encoderName);
            if (!encoder) {
                throw new Error(`不支持的视频编码器: ${encoderName}`);
            }
            // 执行转码
            const result = await encoder.transcode(inputPath, outputPath, encoderConfig, (progress) => {
                // 更新进度
                tasksService.updateTaskProgress(taskId, progress.percent);
                // 推送进度到客户端
                pushProgress(job.data.userId, {
                    taskId,
                    percent: progress.percent,
                    stage: '转码中',
                    timestamp: Date.now()
                });
                // 更新 Bull 任务进度
                job.progress(progress.percent);
            });
            // 标记任务完成
            tasksService.markTaskCompleted(taskId);
            // 推送完成通知
            pushCompleted(job.data.userId, {
                taskId,
                outputSize: result.outputSize,
                format: 'mp4',
                duration: result.duration
            });
            logger_1.default.info('视频转码任务完成', {
                taskId,
                outputSize: result.outputSize,
                duration: result.duration
            });
            return result;
        }
        catch (error) {
            const errorMsg = error.message;
            // 标记任务失败
            tasksService.markTaskFailed(taskId, errorMsg);
            // 推送失败通知
            pushFailed(job.data.userId, { taskId, errorMsg });
            logger_1.default.error('视频转码任务失败', { taskId, error: errorMsg });
            throw error;
        }
    });
    logger_1.default.info(`视频转码工作进程已启动，并发数: ${concurrency}`);
}
/**
 * 启动图片转码工作进程
 */
function startImageWorker() {
    const concurrency = config_1.default.img.parallelLimit || 5;
    queue_1.imageQueue.process(concurrency, async (job) => {
        const { taskId, type, inputPath, outputPath, config: transcodeConfig } = job.data;
        logger_1.default.info('开始图片转码任务', { taskId, jobId: job.id });
        try {
            // 检查任务状态，避免重试时状态冲突
            const task = tasksService.getTask(taskId);
            if (['completed', 'failed', 'cancelled'].includes(task.status)) {
                logger_1.default.warn('任务已是终态，跳过处理', { taskId, status: task.status });
                return { skipped: true, reason: `任务状态为 ${task.status}` };
            }
            // 更新任务状态为处理中
            tasksService.updateTaskStatus(taskId, 'processing');
            // 获取转码配置，确保 outputFormat 存在
            const encoderConfig = {
                outputFormat: (task.outputFormat || 'jpg'),
                ...transcodeConfig
            };
            // 执行转码
            const result = await image_1.default.transcode(inputPath, outputPath, encoderConfig, (progress) => {
                // 更新进度
                tasksService.updateTaskProgress(taskId, progress.percent);
                // 推送进度到客户端
                pushProgress(job.data.userId, {
                    taskId,
                    percent: progress.percent,
                    stage: progress.stage,
                    timestamp: Date.now()
                });
                // 更新 Bull 任务进度
                job.progress(progress.percent);
            });
            // 标记任务完成
            tasksService.markTaskCompleted(taskId);
            // 推送完成通知
            pushCompleted(job.data.userId, {
                taskId,
                outputSize: result.outputSize,
                format: result.format
            });
            logger_1.default.info('图片转码任务完成', {
                taskId,
                outputSize: result.outputSize,
                format: result.format
            });
            return result;
        }
        catch (error) {
            const errorMsg = error.message;
            // 标记任务失败
            tasksService.markTaskFailed(taskId, errorMsg);
            // 推送失败通知
            pushFailed(job.data.userId, { taskId, errorMsg });
            logger_1.default.error('图片转码任务失败', { taskId, error: errorMsg });
            throw error;
        }
    });
    logger_1.default.info(`图片转码工作进程已启动，并发数: ${concurrency}`);
}
/**
 * 启动动图转码工作进程
 */
function startAnimWorker() {
    const concurrency = 2; // 动图转码较慢，限制并发
    queue_1.animQueue.process(concurrency, async (job) => {
        const { taskId, type, inputPath, outputPath, config: transcodeConfig } = job.data;
        logger_1.default.info('开始动图转码任务', { taskId, jobId: job.id });
        try {
            // 检查任务状态，避免重试时状态冲突
            const task = tasksService.getTask(taskId);
            if (['completed', 'failed', 'cancelled'].includes(task.status)) {
                logger_1.default.warn('任务已是终态，跳过处理', { taskId, status: task.status });
                return { skipped: true, reason: `任务状态为 ${task.status}` };
            }
            // 更新任务状态为处理中
            tasksService.updateTaskStatus(taskId, 'processing');
            // 获取转码配置
            const encoderConfig = transcodeConfig;
            // 检查是否是图片序列合成任务
            const imagePaths = encoderConfig.imagePaths;
            let result;
            if (imagePaths && imagePaths.length > 0) {
                // 图片序列合成动图
                result = await (0, anim_1.transcodeFromImages)(imagePaths, outputPath, encoderConfig, (progress) => {
                    // 更新进度
                    tasksService.updateTaskProgress(taskId, progress.percent);
                    // 推送进度到客户端
                    pushProgress(job.data.userId, {
                        taskId,
                        percent: progress.percent,
                        stage: progress.stage,
                        timestamp: Date.now()
                    });
                    // 更新 Bull 任务进度
                    job.progress(progress.percent);
                });
            }
            else {
                // 视频转动图
                result = await anim_1.default.transcode(inputPath, outputPath, encoderConfig, (progress) => {
                    // 更新进度
                    tasksService.updateTaskProgress(taskId, progress.percent);
                    // 推送进度到客户端
                    pushProgress(job.data.userId, {
                        taskId,
                        percent: progress.percent,
                        stage: progress.stage,
                        timestamp: Date.now()
                    });
                    // 更新 Bull 任务进度
                    job.progress(progress.percent);
                });
            }
            // 标记任务完成
            tasksService.markTaskCompleted(taskId);
            // 推送完成通知
            pushCompleted(job.data.userId, {
                taskId,
                outputSize: result.outputSize,
                format: result.format
            });
            logger_1.default.info('动图转码任务完成', {
                taskId,
                outputSize: result.outputSize,
                format: result.format
            });
            return result;
        }
        catch (error) {
            const errorMsg = error.message;
            // 标记任务失败
            tasksService.markTaskFailed(taskId, errorMsg);
            // 推送失败通知
            pushFailed(job.data.userId, { taskId, errorMsg });
            logger_1.default.error('动图转码任务失败', { taskId, error: errorMsg });
            throw error;
        }
    });
    logger_1.default.info(`动图转码工作进程已启动，并发数: ${concurrency}`);
}
/**
 * 启动文档转码工作进程
 */
function startDocumentWorker() {
    const concurrency = 3;
    queue_1.documentQueue.process(concurrency, async (job) => {
        const { taskId, type, inputPath, outputPath, config: transcodeConfig } = job.data;
        logger_1.default.info('开始文档转换任务', { taskId, jobId: job.id });
        try {
            // 检查任务状态，避免重试时状态冲突
            const task = tasksService.getTask(taskId);
            if (['completed', 'failed', 'cancelled'].includes(task.status)) {
                logger_1.default.warn('任务已是终态，跳过处理', { taskId, status: task.status });
                return { skipped: true, reason: `任务状态为 ${task.status}` };
            }
            // 更新任务状态为处理中
            tasksService.updateTaskStatus(taskId, 'processing');
            // 获取转码配置
            const encoderConfig = transcodeConfig;
            const subtype = encoderConfig.subtype;
            // 获取编码器
            const encoder = documentEncoders.getEncoder(subtype);
            if (!encoder) {
                throw new Error(`不支持的文档转换类型: ${subtype}`);
            }
            // 处理多文件输入（如 PDF 合并）
            const inputPaths = inputPath.includes(',')
                ? inputPath.split(',')
                : inputPath;
            // 执行转换
            const result = await encoder.transcode(inputPaths, outputPath, encoderConfig, (progress) => {
                // 更新进度
                tasksService.updateTaskProgress(taskId, progress.percent);
                // 推送进度到客户端
                pushProgress(job.data.userId, {
                    taskId,
                    percent: progress.percent,
                    stage: progress.stage,
                    timestamp: Date.now()
                });
                // 更新 Bull 任务进度
                job.progress(progress.percent);
            });
            // 标记任务完成
            tasksService.markTaskCompleted(taskId);
            // 推送完成通知
            pushCompleted(job.data.userId, {
                taskId,
                outputSize: result.outputSize,
                format: result.format
            });
            logger_1.default.info('文档转换任务完成', {
                taskId,
                outputSize: result.outputSize,
                format: result.format
            });
            return result;
        }
        catch (error) {
            const errorMsg = error.message;
            // 标记任务失败
            tasksService.markTaskFailed(taskId, errorMsg);
            // 推送失败通知
            pushFailed(job.data.userId, { taskId, errorMsg });
            logger_1.default.error('文档转换任务失败', { taskId, error: errorMsg });
            throw error;
        }
    });
    logger_1.default.info(`文档转码工作进程已启动，并发数: ${concurrency}`);
}
/**
 * 推送进度到客户端
 *
 * @param userId - 用户ID
 * @param progress - 进度信息
 */
function pushProgress(userId, progress) {
    socket_1.socketEmitter.emitTaskProgress(userId, progress);
}
/**
 * 推送任务完成通知
 *
 * @param userId - 用户ID
 * @param data - 完成数据
 */
function pushCompleted(userId, data) {
    socket_1.socketEmitter.emitTaskCompleted(userId, {
        taskId: data.taskId,
        outputSize: data.outputSize,
        format: data.format,
        duration: data.duration || 0
    });
    // 同时推送状态变更
    socket_1.socketEmitter.emitTaskStatus(userId, {
        taskId: data.taskId,
        status: 'completed',
        outputSize: data.outputSize
    });
}
/**
 * 推送任务失败通知
 *
 * @param userId - 用户ID
 * @param data - 失败数据
 */
function pushFailed(userId, data) {
    socket_1.socketEmitter.emitTaskFailed(userId, {
        taskId: data.taskId,
        errorMsg: data.errorMsg
    });
    // 同时推送状态变更
    socket_1.socketEmitter.emitTaskStatus(userId, {
        taskId: data.taskId,
        status: 'failed',
        errorMsg: data.errorMsg
    });
}
/**
 * 停止所有工作进程
 */
async function stopWorkers() {
    await Promise.all([
        queue_1.videoQueue.close(),
        queue_1.imageQueue.close(),
        queue_1.animQueue.close(),
        queue_1.documentQueue.close()
    ]);
    logger_1.default.info('转码工作进程已停止');
}
//# sourceMappingURL=transcode.js.map