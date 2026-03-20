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
import Queue from 'bull';
import type { BaseTask } from '../types';
/**
 * 队列名称枚举
 */
export declare enum QueueName {
    VIDEO = "video-transcode",
    IMAGE = "image-transcode",
    ANIM = "anim-transcode",
    DOCUMENT = "document-transcode"
}
/**
 * 任务数据接口
 */
export interface TranscodeJobData {
    taskId: string;
    type: 'video' | 'img' | 'anim' | 'document';
    userId: string;
    inputPath: string;
    outputPath: string;
    config: Record<string, unknown>;
}
/**
 * 任务进度接口
 */
export interface TranscodeJobProgress {
    taskId: string;
    percent: number;
    stage: string;
    timestamp: number;
}
/**
 * 视频转码队列
 *
 * 处理视频转码任务
 */
export declare const videoQueue: Queue.Queue<TranscodeJobData>;
/**
 * 图片转码队列
 *
 * 处理图片转码任务
 */
export declare const imageQueue: Queue.Queue<TranscodeJobData>;
/**
 * 动图转码队列
 *
 * 处理 GIF/WebP 动图转码任务
 */
export declare const animQueue: Queue.Queue<TranscodeJobData>;
/**
 * 文档转码队列
 *
 * 处理文档格式转换任务
 */
export declare const documentQueue: Queue.Queue<TranscodeJobData>;
/**
 * 添加转码任务到队列
 *
 * @param task - 任务信息
 * @returns Bull Job 实例
 */
export declare function addTranscodeJob(task: BaseTask): Promise<Queue.Job<TranscodeJobData>>;
/**
 * 取消转码任务
 *
 * @param taskId - 任务ID
 * @param type - 任务类型
 * @returns 是否取消成功
 */
export declare function cancelTranscodeJob(taskId: string, type: 'video' | 'img' | 'anim' | 'document'): Promise<boolean>;
/**
 * 获取队列统计信息
 *
 * @returns 各队列的任务统计
 */
export declare function getQueueStats(): Promise<{
    video: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    };
    image: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    };
    anim: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    };
    document: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    };
}>;
/**
 * 暂停队列
 *
 * @param type - 队列类型
 */
export declare function pauseQueue(type: 'video' | 'img' | 'anim' | 'document'): Promise<void>;
/**
 * 恢复队列
 *
 * @param type - 队列类型
 */
export declare function resumeQueue(type: 'video' | 'img' | 'anim' | 'document'): Promise<void>;
/**
 * 清空队列
 *
 * @param type - 队列类型
 */
export declare function clearQueue(type: 'video' | 'img' | 'anim' | 'document'): Promise<void>;
/**
 * 关闭所有队列
 *
 * 优雅关闭队列连接
 */
export declare function closeQueues(): Promise<void>;
/**
 * 初始化队列事件监听
 */
export declare function initQueueEvents(): void;
//# sourceMappingURL=index.d.ts.map