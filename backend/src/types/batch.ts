/**
 * 批量任务类型定义
 *
 * @module types/batch
 */

import type { Task } from './index';

/**
 * 批量任务创建请求参数
 */
export interface BatchCreateTaskRequest {
  /** 文件 ID 列表（已上传的文件） */
  fileIds: string[];
  /** 预设 ID 列表 */
  presetIds: string[];
  /** 用户 ID */
  userId: string;
}

/**
 * 批量任务创建响应
 */
export interface BatchCreateTaskResponse {
  /** 创建的任务总数 */
  total: number;
  /** 任务列表 */
  tasks: Task[];
  /** 失败的任务 */
  failed: {
    /** 文件 ID */
    fileId: string;
    /** 预设 ID */
    presetId: string;
    /** 失败原因 */
    reason: string;
  }[];
}

/**
 * 批量操作请求参数
 */
export interface BatchOperationRequest {
  /** 任务 ID 列表 */
  taskIds: string[];
  /** 用户 ID */
  userId: string;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponse {
  /** 成功的任务 ID 列表 */
  success: string[];
  /** 失败的任务 */
  failed: {
    taskId: string;
    reason: string;
  }[];
}
