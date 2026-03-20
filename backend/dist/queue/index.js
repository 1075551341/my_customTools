"use strict";
/**
 * 任务队列模块
 *
 * 使用 Bull + Redis 实现任务队列
 *
 * 功能说明：
 * - 创建和管理转码任务队列
 * - 提供任务添加、查询、控制等操作
 * - 支持任务优先级和并发控制
 *
 * @module queue
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentQueue = exports.animQueue = exports.imageQueue = exports.videoQueue = exports.QueueName = void 0;
exports.addTranscodeJob = addTranscodeJob;
exports.cancelTranscodeJob = cancelTranscodeJob;
exports.getQueueStats = getQueueStats;
exports.pauseQueue = pauseQueue;
exports.resumeQueue = resumeQueue;
exports.clearQueue = clearQueue;
exports.closeQueues = closeQueues;
exports.initQueueEvents = initQueueEvents;
const bull_1 = __importDefault(require("bull"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 队列名称枚举
 */
var QueueName;
(function (QueueName) {
    QueueName["VIDEO"] = "video-transcode";
    QueueName["IMAGE"] = "image-transcode";
    QueueName["ANIM"] = "anim-transcode";
    QueueName["DOCUMENT"] = "document-transcode";
})(QueueName || (exports.QueueName = QueueName = {}));
/**
 * Redis 连接配置
 */
const redisConfig = {
    host: config_1.default.redis.host,
    port: config_1.default.redis.port,
    password: config_1.default.redis.password || undefined
};
/**
 * 视频转码队列
 *
 * 处理视频转码任务
 */
exports.videoQueue = new bull_1.default(QueueName.VIDEO, {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 50,
        timeout: 3600000 // 1小时超时
    }
});
/**
 * 图片转码队列
 *
 * 处理图片转码任务
 */
exports.imageQueue = new bull_1.default(QueueName.IMAGE, {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 2000
        },
        removeOnComplete: 200,
        removeOnFail: 100,
        timeout: 300000 // 5分钟超时
    }
});
/**
 * 动图转码队列
 *
 * 处理 GIF/WebP 动图转码任务
 */
exports.animQueue = new bull_1.default(QueueName.ANIM, {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 2000
        },
        removeOnComplete: 200,
        removeOnFail: 100,
        timeout: 600000 // 10分钟超时
    }
});
/**
 * 文档转码队列
 *
 * 处理文档格式转换任务
 */
exports.documentQueue = new bull_1.default(QueueName.DOCUMENT, {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 2000
        },
        removeOnComplete: 200,
        removeOnFail: 100,
        timeout: 300000 // 5分钟超时
    }
});
/**
 * 队列映射表
 *
 * 根据任务类型获取对应队列
 */
const queueMap = {
    video: exports.videoQueue,
    img: exports.imageQueue,
    anim: exports.animQueue,
    document: exports.documentQueue
};
/**
 * 添加转码任务到队列
 *
 * @param task - 任务信息
 * @returns Bull Job 实例
 */
async function addTranscodeJob(task) {
    const queue = queueMap[task.type];
    if (!queue) {
        throw new Error(`不支持的任务类型: ${task.type}`);
    }
    const jobData = {
        taskId: task.id,
        type: task.type,
        userId: task.userId,
        inputPath: task.inputPath,
        outputPath: task.outputPath,
        config: task.config
    };
    const job = await queue.add(jobData, {
        jobId: task.id,
        priority: 0
    });
    logger_1.default.info('转码任务已加入队列', {
        taskId: task.id,
        jobId: job.id,
        type: task.type
    });
    return job;
}
/**
 * 取消转码任务
 *
 * @param taskId - 任务ID
 * @param type - 任务类型
 * @returns 是否取消成功
 */
async function cancelTranscodeJob(taskId, type) {
    const queue = queueMap[type];
    if (!queue) {
        return false;
    }
    const job = await queue.getJob(taskId);
    if (!job) {
        return false;
    }
    // 如果任务正在处理，标记为需要停止
    if (await job.isActive()) {
        // Worker 会检查这个状态并停止处理
        await job.moveToFailed(new Error('用户取消'), true);
    }
    else {
        await job.remove();
    }
    logger_1.default.info('转码任务已取消', { taskId, type });
    return true;
}
/**
 * 获取队列统计信息
 *
 * @returns 各队列的任务统计
 */
async function getQueueStats() {
    const [videoCounts, imageCounts, animCounts, documentCounts] = await Promise.all([
        exports.videoQueue.getJobCounts(),
        exports.imageQueue.getJobCounts(),
        exports.animQueue.getJobCounts(),
        exports.documentQueue.getJobCounts()
    ]);
    return {
        video: {
            waiting: videoCounts.waiting || 0,
            active: videoCounts.active || 0,
            completed: videoCounts.completed || 0,
            failed: videoCounts.failed || 0
        },
        image: {
            waiting: imageCounts.waiting || 0,
            active: imageCounts.active || 0,
            completed: imageCounts.completed || 0,
            failed: imageCounts.failed || 0
        },
        anim: {
            waiting: animCounts.waiting || 0,
            active: animCounts.active || 0,
            completed: animCounts.completed || 0,
            failed: animCounts.failed || 0
        },
        document: {
            waiting: documentCounts.waiting || 0,
            active: documentCounts.active || 0,
            completed: documentCounts.completed || 0,
            failed: documentCounts.failed || 0
        }
    };
}
/**
 * 暂停队列
 *
 * @param type - 队列类型
 */
async function pauseQueue(type) {
    const queue = queueMap[type];
    if (queue) {
        await queue.pause();
        logger_1.default.info(`队列已暂停: ${type}`);
    }
}
/**
 * 恢复队列
 *
 * @param type - 队列类型
 */
async function resumeQueue(type) {
    const queue = queueMap[type];
    if (queue) {
        await queue.resume();
        logger_1.default.info(`队列已恢复: ${type}`);
    }
}
/**
 * 清空队列
 *
 * @param type - 队列类型
 */
async function clearQueue(type) {
    const queue = queueMap[type];
    if (queue) {
        await queue.empty();
        logger_1.default.info(`队列已清空: ${type}`);
    }
}
/**
 * 关闭所有队列
 *
 * 优雅关闭队列连接
 */
async function closeQueues() {
    await Promise.all([
        exports.videoQueue.close(),
        exports.imageQueue.close(),
        exports.animQueue.close(),
        exports.documentQueue.close()
    ]);
    logger_1.default.info('所有队列已关闭');
}
/**
 * 初始化队列事件监听
 */
function initQueueEvents() {
    const queues = [
        { name: 'video', queue: exports.videoQueue },
        { name: 'image', queue: exports.imageQueue },
        { name: 'anim', queue: exports.animQueue },
        { name: 'document', queue: exports.documentQueue }
    ];
    queues.forEach(({ name, queue }) => {
        queue.on('error', (error) => {
            logger_1.default.error(`队列错误 [${name}]`, { error: error.message });
        });
        queue.on('waiting', (jobId) => {
            logger_1.default.debug(`任务等待中 [${name}]`, { jobId });
        });
        queue.on('active', (job) => {
            logger_1.default.info(`任务开始处理 [${name}]`, { taskId: job.data.taskId });
        });
        queue.on('completed', (job) => {
            logger_1.default.info(`任务处理完成 [${name}]`, { taskId: job.data.taskId });
        });
        queue.on('failed', (job, error) => {
            if (job) {
                logger_1.default.error(`任务处理失败 [${name}]`, {
                    taskId: job.data.taskId,
                    error: error.message
                });
            }
        });
        queue.on('stalled', (job) => {
            logger_1.default.warn(`任务停滞 [${name}]`, { taskId: job.data.taskId });
        });
    });
    logger_1.default.info('队列事件监听已初始化');
}
//# sourceMappingURL=index.js.map