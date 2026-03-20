"use strict";
/**
 * Socket 事件发射器
 *
 * 封装 Socket.io 事件发射方法，提供类型安全的事件推送
 *
 * @module socket/emitter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketEmitter = void 0;
exports.initSocketEmitter = initSocketEmitter;
/**
 * Socket.io 服务器实例
 */
let io = null;
/**
 * 初始化 Socket 发射器
 *
 * @param server - Socket.io 服务器实例
 */
function initSocketEmitter(server) {
    io = server;
}
/**
 * Socket 事件发射器
 */
exports.socketEmitter = {
    /**
     * 推送任务进度到用户
     *
     * @param userId - 用户ID
     * @param data - 进度数据
     */
    emitTaskProgress(userId, data) {
        if (!io)
            return;
        io.to(`user:${userId}`).emit('task:progress', data);
    },
    /**
     * 推送任务状态变更到用户
     *
     * @param userId - 用户ID
     * @param data - 状态数据
     */
    emitTaskStatus(userId, data) {
        if (!io)
            return;
        io.to(`user:${userId}`).emit('task:status', data);
    },
    /**
     * 推送任务完成通知
     *
     * @param userId - 用户ID
     * @param data - 完成数据
     */
    emitTaskCompleted(userId, data) {
        if (!io)
            return;
        io.to(`user:${userId}`).emit('task:completed', data);
    },
    /**
     * 推送任务失败通知
     *
     * @param userId - 用户ID
     * @param data - 失败数据
     */
    emitTaskFailed(userId, data) {
        if (!io)
            return;
        io.to(`user:${userId}`).emit('task:failed', data);
    },
    /**
     * 推送队列状态更新（广播给所有用户）
     *
     * @param data - 队列统计
     */
    emitQueueUpdate(data) {
        if (!io)
            return;
        io.emit('queue:update', data);
    },
    /**
     * 推送系统通知
     *
     * @param data - 通知内容
     */
    emitSystemNotice(data) {
        if (!io)
            return;
        io.emit('system:notice', data);
    },
    /**
     * 向特定任务房间推送进度
     *
     * @param taskId - 任务ID
     * @param data - 进度数据
     */
    emitToTask(taskId, data) {
        if (!io)
            return;
        io.to(`task:${taskId}`).emit('task:progress', data);
    },
    /**
     * 获取 Socket.io 实例
     */
    getIO() {
        return io;
    }
};
//# sourceMappingURL=emitter.js.map