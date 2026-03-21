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
import type { Application } from "express";
/**
 * 初始化转码工作进程
 *
 * @param app - Express 应用实例
 */
export declare function initWorkers(app: Application): void;
/**
 * 停止所有工作进程
 */
export declare function stopWorkers(): Promise<void>;
//# sourceMappingURL=transcode.d.ts.map