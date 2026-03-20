"use strict";
/**
 * 队列路由模块
 *
 * 提供队列状态查询、控制等管理接口
 *
 * @module routes/queue
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
const queue_1 = require("../queue");
const router = (0, express_1.Router)();
// 所有队列接口需要认证和管理员权限
router.use(auth_1.authMiddleware);
/**
 * GET /api/queue/stats
 *
 * 获取所有队列的统计信息
 *
 * @returns 队列统计信息
 */
router.get('/stats', async (_, res) => {
    try {
        const stats = await (0, queue_1.getQueueStats)();
        return (0, response_1.success)(res, stats);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '获取队列统计失败';
        return (0, response_1.error)(res, message, 500);
    }
});
/**
 * POST /api/queue/pause/:type
 *
 * 暂停指定队列
 *
 * @param type - 队列类型（video/img/anim）
 * @returns 操作结果
 */
router.post('/pause/:type', async (req, res) => {
    const type = req.params.type;
    if (!['video', 'img', 'anim'].includes(type)) {
        return (0, response_1.error)(res, 'type 必须是 video、img 或 anim', 400);
    }
    try {
        await (0, queue_1.pauseQueue)(type);
        return (0, response_1.success)(res, null, `队列 ${type} 已暂停`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '暂停队列失败';
        return (0, response_1.error)(res, message, 500);
    }
});
/**
 * POST /api/queue/resume/:type
 *
 * 恢复指定队列
 *
 * @param type - 队列类型（video/img/anim）
 * @returns 操作结果
 */
router.post('/resume/:type', async (req, res) => {
    const type = req.params.type;
    if (!['video', 'img', 'anim'].includes(type)) {
        return (0, response_1.error)(res, 'type 必须是 video、img 或 anim', 400);
    }
    try {
        await (0, queue_1.resumeQueue)(type);
        return (0, response_1.success)(res, null, `队列 ${type} 已恢复`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '恢复队列失败';
        return (0, response_1.error)(res, message, 500);
    }
});
/**
 * DELETE /api/queue/clear/:type
 *
 * 清空指定队列
 *
 * @param type - 队列类型（video/img/anim）
 * @returns 操作结果
 */
router.delete('/clear/:type', async (req, res) => {
    const type = req.params.type;
    if (!['video', 'img', 'anim'].includes(type)) {
        return (0, response_1.error)(res, 'type 必须是 video、img 或 anim', 400);
    }
    try {
        await (0, queue_1.clearQueue)(type);
        return (0, response_1.success)(res, null, `队列 ${type} 已清空`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '清空队列失败';
        return (0, response_1.error)(res, message, 500);
    }
});
exports.default = router;
//# sourceMappingURL=queue.js.map