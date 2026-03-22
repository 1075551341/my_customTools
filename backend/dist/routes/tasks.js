"use strict";
/**
 * 任务路由模块
 *
 * 提供任务创建、查询、状态管理等接口
 *
 * @module routes/tasks
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
const tasksService = __importStar(require("../services/tasks"));
const router = (0, express_1.Router)();
// 所有任务接口需要认证
router.use(auth_1.authMiddleware);
/**
 * POST /api/tasks
 *
 * 创建新任务
 *
 * @body {type, fileName, fileSize, inputPath, inputFormat, outputFormat, config}
 * @returns 任务信息
 */
router.post("/", (req, res) => {
    const { type, fileName, fileSize, inputPath, inputFormat, outputFormat, config, } = req.body;
    // 参数验证
    if (!type || !fileName || !inputPath || !outputFormat) {
        return (0, response_1.error)(res, "type、fileName、inputPath 和 outputFormat 不能为空", 400);
    }
    if (!["video", "img", "anim", "document"].includes(type)) {
        return (0, response_1.error)(res, "type 必须是 video、img、anim 或 document", 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.createTask({
            type: type,
            fileName,
            fileSize: fileSize || 0,
            inputPath,
            inputFormat: inputFormat || "",
            outputFormat,
            config: config || {},
            userId,
        });
        return (0, response_1.success)(res, task, "任务创建成功");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "创建任务失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * GET /api/tasks
 *
 * 查询任务列表
 *
 * @query status, type, page, pageSize
 * @returns 分页任务列表
 */
router.get("/", (req, res) => {
    const { status, type, page, pageSize } = req.query;
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const result = tasksService.queryTasks({
            userId,
            status: status,
            type: type,
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
        });
        return (0, response_1.paginated)(res, result.list, result.total, result.page, result.pageSize);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "查询任务失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * GET /api/tasks/stats
 *
 * 获取任务统计
 *
 * @returns 统计信息
 */
router.get("/stats", (req, res) => {
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const stats = tasksService.getTaskStats(userId);
        return (0, response_1.success)(res, stats);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "获取统计失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * GET /api/tasks/:taskId
 *
 * 获取任务详情
 *
 * @param taskId - 任务ID
 * @returns 任务信息
 */
router.get("/:taskId", (req, res) => {
    const taskId = req.params.taskId;
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.getTask(taskId, userId);
        return (0, response_1.success)(res, task);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "获取任务失败";
        return (0, response_1.error)(res, message, 404);
    }
});
/**
 * PUT /api/tasks/:taskId/status
 *
 * 更新任务状态
 *
 * @param taskId - 任务ID
 * @body {status}
 * @returns 更新后的任务
 */
router.put("/:taskId/status", (req, res) => {
    const taskId = req.params.taskId;
    const { status } = req.body;
    if (!status) {
        return (0, response_1.error)(res, "status 不能为空", 400);
    }
    const validStatuses = [
        "waiting",
        "uploading",
        "processing",
        "completed",
        "failed",
        "cancelled",
    ];
    if (!validStatuses.includes(status)) {
        return (0, response_1.error)(res, `status 必须是: ${validStatuses.join(", ")}`, 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.updateTaskStatus(taskId, status, userId);
        return (0, response_1.success)(res, task, "状态更新成功");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "更新状态失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/tasks/:taskId/cancel
 *
 * 取消任务
 *
 * @param taskId - 任务ID
 * @returns 更新后的任务
 */
router.post("/:taskId/cancel", (req, res) => {
    const taskId = req.params.taskId;
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.cancelTask(taskId, userId);
        return (0, response_1.success)(res, task, "任务已取消");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "取消任务失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/tasks/:taskId/retry
 *
 * 重试失败的任务
 *
 * @param taskId - 任务ID
 * @returns 更新后的任务
 */
router.post("/:taskId/retry", (req, res) => {
    const taskId = req.params.taskId;
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.retryTask(taskId, userId);
        return (0, response_1.success)(res, task, "任务已重新排队");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "重试任务失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/tasks/compose-gif
 *
 * 创建图片序列合成 GIF 任务
 *
 * @body {imagePaths, outputFormat, config}
 * @returns 任务信息
 */
router.post("/compose-gif", async (req, res) => {
    const { imagePaths, outputFormat, config } = req.body;
    // 参数验证
    if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
        return (0, response_1.error)(res, "imagePaths 必须是非空数组", 400);
    }
    if (!outputFormat || !["gif", "webp", "apng"].includes(outputFormat)) {
        return (0, response_1.error)(res, "outputFormat 必须是 gif、webp 或 apng", 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = await tasksService.createComposeGifTask({
            imagePaths,
            outputFormat,
            config: config || {},
            userId,
        });
        return (0, response_1.success)(res, task, "合成任务创建成功");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "创建合成任务失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/tasks/:taskId/submit
 *
 * 提交任务到转码队列
 *
 * @param taskId - 任务ID
 * @returns 操作结果
 */
router.post("/:taskId/submit", async (req, res) => {
    const taskId = req.params.taskId;
    try {
        await tasksService.submitTask(taskId);
        return (0, response_1.success)(res, null, "任务已提交到队列");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "提交任务失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * DELETE /api/tasks/:taskId
 *
 * 删除任务
 *
 * @param taskId - 任务ID
 */
router.delete("/:taskId", (req, res) => {
    const taskId = req.params.taskId;
    try {
        const userId = (0, auth_1.requireUserId)(req);
        tasksService.deleteTask(taskId, userId);
        return (0, response_1.success)(res, null, "任务已删除");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "删除任务失败";
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/tasks/batch
 *
 * 批量创建转码任务
 *
 * @body {fileIds, presetIds}
 * @returns { total, tasks, failed }
 */
router.post("/batch", (req, res) => {
    const { fileIds, presetIds } = req.body;
    // 参数验证
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return (0, response_1.error)(res, "fileIds 不能为空", 400);
    }
    if (!presetIds || !Array.isArray(presetIds) || presetIds.length === 0) {
        return (0, response_1.error)(res, "presetIds 不能为空", 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const result = tasksService.batchCreateTasks({
            fileIds,
            presetIds,
            userId,
        });
        return (0, response_1.success)(res, result, `批量创建 ${result.total} 个任务成功`, 201);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "批量创建失败";
        return (0, response_1.error)(res, message, 400);
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map