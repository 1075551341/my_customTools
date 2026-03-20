/**
 * 下载服务模块
 *
 * 提供单文件下载和批量打包下载功能
 *
 * @module services/download
 */
import type { BaseTask } from '../types';
/**
 * 下载结果
 */
export interface DownloadResult {
    stream: NodeJS.ReadableStream;
    fileName: string;
    fileSize: number;
    mimeType: string;
}
/**
 * 批量下载选项
 */
export interface BatchDownloadOptions {
    taskIds: string[];
    userId: string;
}
/**
 * 单文件下载
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID（用于权限验证）
 * @returns 下载结果
 * @throws 任务不存在
 * @throws 无权限
 * @throws 任务未完成
 * @throws 输出文件不存在
 */
export declare function downloadSingle(taskId: string, userId: string): DownloadResult;
/**
 * 批量打包下载
 *
 * @param options - 批量下载选项
 * @returns 下载结果
 * @throws 无有效任务
 */
export declare function downloadBatch(options: BatchDownloadOptions): Promise<DownloadResult>;
/**
 * 获取用户下载目录大小
 *
 * @param userId - 用户ID
 * @returns 目录大小（字节）
 */
export declare function getUserDownloadSize(userId: string): number;
/**
 * 获取用户已完成任务列表（用于下载）
 *
 * @param userId - 用户ID
 * @returns 已完成任务列表
 */
export declare function getDownloadableTasks(userId: string): BaseTask[];
//# sourceMappingURL=download.d.ts.map