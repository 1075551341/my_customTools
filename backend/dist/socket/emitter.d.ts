/**
 * Socket 事件发射器
 *
 * 封装 Socket.io 事件发射方法，提供类型安全的事件推送
 *
 * @module socket/emitter
 */
import { Server } from "socket.io";
import type { TaskProgressData, TaskStatusData, TaskCompletedData, TaskFailedData, QueueStatsData, SystemNoticeData } from "./events";
import type { Message } from "../types";
/**
 * 初始化 Socket 发射器
 *
 * @param server - Socket.io 服务器实例
 */
export declare function initSocketEmitter(server: Server): void;
/**
 * Socket 事件发射器
 */
export declare const socketEmitter: {
    /**
     * 推送任务进度到用户
     *
     * @param userId - 用户 ID
     * @param data - 进度数据
     */
    emitTaskProgress(userId: string, data: TaskProgressData): void;
    /**
     * 推送任务状态变更到用户
     *
     * @param userId - 用户 ID
     * @param data - 状态数据
     */
    emitTaskStatus(userId: string, data: TaskStatusData): void;
    /**
     * 推送任务完成通知
     *
     * @param userId - 用户 ID
     * @param data - 完成数据
     */
    emitTaskCompleted(userId: string, data: TaskCompletedData): void;
    /**
     * 推送任务失败通知
     *
     * @param userId - 用户 ID
     * @param data - 失败数据
     */
    emitTaskFailed(userId: string, data: TaskFailedData): void;
    /**
     * 推送队列状态更新（广播给所有用户）
     *
     * @param data - 队列统计
     */
    emitQueueUpdate(data: QueueStatsData): void;
    /**
     * 推送系统通知
     *
     * @param data - 通知内容
     */
    emitSystemNotice(data: SystemNoticeData): void;
    /**
     * 向特定任务房间推送进度
     *
     * @param taskId - 任务 ID
     * @param data - 进度数据
     */
    emitToTask(taskId: string, data: TaskProgressData): void;
    /**
     * 推送新消息通知到用户
     *
     * @param userId - 用户 ID
     * @param message - 消息对象
     */
    emitMessagePush(userId: string, message: Message): void;
    /**
     * 获取 Socket.io 实例
     */
    getIO(): Server | null;
};
//# sourceMappingURL=emitter.d.ts.map