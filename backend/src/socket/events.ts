/**
 * Socket 事件常量定义
 *
 * 统一管理所有 Socket.io 事件名称，防止拼写错误
 *
 * @module socket/events
 */

/**
 * 服务端 -> 客户端 事件
 */
export const ServerEvents = {
  /**
   * 任务进度更新
   * 数据格式: { taskId: string, percent: number, stage: string, timestamp: number }
   */
  TASK_PROGRESS: "task:progress",

  /**
   * 任务状态变更
   * 数据格式: { taskId: string, status: TaskStatus, errorMsg?: string, outputSize?: number }
   */
  TASK_STATUS: "task:status",

  /**
   * 任务完成
   * 数据格式: { taskId: string, outputSize: number, duration: number, format: string }
   */
  TASK_COMPLETED: "task:completed",

  /**
   * 任务失败
   * 数据格式: { taskId: string, errorMsg: string }
   */
  TASK_FAILED: "task:failed",

  /**
   * 队列状态更新
   * 数据格式: { video: QueueStats, image: QueueStats, anim: QueueStats, document: QueueStats }
   */
  QUEUE_UPDATE: "queue:update",

  /**
   * 系统通知
   * 数据格式: { type: 'info' | 'warning' | 'error', message: string }
   */
  SYSTEM_NOTICE: "system:notice",
} as const;

/**
 * 客户端 -> 服务端 事件
 */
export const ClientEvents = {
  /**
   * 订阅任务进度
   * 数据格式: { taskIds: string[] }
   */
  SUBSCRIBE_TASK: "subscribe:task",

  /**
   * 取消订阅任务进度
   * 数据格式: { taskIds: string[] }
   */
  UNSUBSCRIBE_TASK: "unsubscribe:task",

  /**
   * 订阅队列状态
   */
  SUBSCRIBE_QUEUE: "subscribe:queue",

  /**
   * 取消订阅队列状态
   */
  UNSUBSCRIBE_QUEUE: "unsubscribe:queue",
} as const;

/**
 * 任务进度数据接口
 */
export interface TaskProgressData {
  taskId: string;
  percent: number;
  stage: string;
  timestamp: number;
}

/**
 * 任务状态数据接口
 */
export interface TaskStatusData {
  taskId: string;
  status:
    | "waiting"
    | "uploading"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled";
  errorMsg?: string;
  outputSize?: number;
}

/**
 * 任务完成数据接口
 */
export interface TaskCompletedData {
  taskId: string;
  outputSize: number;
  duration: number;
  format: string;
}

/**
 * 任务失败数据接口
 */
export interface TaskFailedData {
  taskId: string;
  errorMsg: string;
}

/**
 * 队列统计数据接口
 */
export interface QueueStatsData {
  video: { waiting: number; active: number; completed: number; failed: number };
  image: { waiting: number; active: number; completed: number; failed: number };
  anim: { waiting: number; active: number; completed: number; failed: number };
  document: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

/**
 * 系统通知数据接口
 */
export interface SystemNoticeData {
  type: "info" | "warning" | "error";
  message: string;
}

/**
 * 消息推送数据接口
 */
export interface MessagePushData {
  id: string;
  userId: string;
  type: "normal" | "todo";
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  readAt?: string;
}
