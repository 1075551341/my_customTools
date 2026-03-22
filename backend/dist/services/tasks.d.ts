/**
 * 任务服务模块
 *
 * 提供任务创建、查询、状态管理等功能
 *
 * @module services/tasks
 */
import type { BaseTask, TaskStatus, TaskType, VideoTranscodeConfig, ImgTranscodeConfig, AnimTranscodeConfig, DocumentTranscodeConfig } from "../types";
import type { BatchCreateTaskRequest, BatchCreateTaskResponse } from "../types/batch";
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
    config: VideoTranscodeConfig | ImgTranscodeConfig | AnimTranscodeConfig | DocumentTranscodeConfig;
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
export declare function createTask(params: CreateTaskParams): BaseTask;
/**
 * 根据ID获取任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID（用于权限验证）
 * @returns 任务信息
 * @throws 任务不存在
 * @throws 无权限
 */
export declare function getTask(taskId: string, userId?: string): BaseTask;
/**
 * 查询任务列表
 *
 * @param params - 查询参数
 * @returns 分页任务列表
 */
export declare function queryTasks(params: QueryTasksParams): {
    list: BaseTask[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};
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
export declare function updateTaskStatus(taskId: string, status: TaskStatus, userId?: string): BaseTask;
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
export declare function cancelTask(taskId: string, userId: string): BaseTask;
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
export declare function retryTask(taskId: string, userId: string): BaseTask;
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
export declare function deleteTask(taskId: string, userId: string): boolean;
/**
 * 获取任务统计
 *
 * @param userId - 用户ID（可选）
 * @returns 统计信息
 */
export declare function getTaskStats(userId?: string): Record<TaskStatus, number>;
/**
 * 更新任务进度
 *
 * @param taskId - 任务ID
 * @param progress - 进度（0-100）
 */
export declare function updateTaskProgress(taskId: string, progress: number): void;
/**
 * 标记任务失败
 *
 * @param taskId - 任务ID
 * @param errorMsg - 错误信息
 */
export declare function markTaskFailed(taskId: string, errorMsg: string): void;
/**
 * 标记任务完成
 *
 * @param taskId - 任务ID
 */
export declare function markTaskCompleted(taskId: string): void;
/**
 * 获取待处理的任务
 *
 * @returns 待处理任务列表
 */
export declare function getPendingTasks(): BaseTask[];
/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
export declare function cleanOldTasks(maxAgeDays?: number): number;
/**
 * 提交任务到转码队列
 *
 * @param taskId - 任务ID
 * @throws 任务不存在
 * @throws 任务状态不允许提交
 */
export declare function submitTask(taskId: string): Promise<void>;
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
export declare function createComposeGifTask(params: CreateComposeGifParams): Promise<BaseTask>;
/**
 * 批量创建转码任务
 *
 * 对于每个文件和每个预设的组合，创建一个任务
 * 例如：3 个文件 × 2 个预设 = 6 个任务
 *
 * @param data - 批量创建请求参数
 * @returns 批量创建响应
 */
export declare function batchCreateTasks(data: BatchCreateTaskRequest): BatchCreateTaskResponse;
//# sourceMappingURL=tasks.d.ts.map