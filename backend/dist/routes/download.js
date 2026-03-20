"use strict";
/**
 * 下载路由模块
 *
 * 提供文件下载接口
 *
 * @module routes/download
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const downloadService = __importStar(require("../services/download"));
const response_1 = require("../utils/response");
const logger_1 = __importDefault(require("../utils/logger"));
const auth_1 = require("../middlewares/auth");
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 获取可下载任务列表
 *
 * GET /api/download/list
 */
router.get('/list', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        const tasks = downloadService.getDownloadableTasks(userId);
        return (0, response_1.success)(res, {
            list: tasks.map(task => ({
                id: task.id,
                fileName: task.fileName,
                outputFormat: task.outputFormat,
                createdAt: task.createdAt,
                completedAt: task.completedAt
            })),
            total: tasks.length
        });
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取用户下载空间占用
 *
 * GET /api/download/size
 */
router.get('/size', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        const size = downloadService.getUserDownloadSize(userId);
        return (0, response_1.success)(res, {
            size,
            sizeMB: Math.round(size / 1024 / 1024 * 100) / 100
        });
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 批量打包下载
 *
 * POST /api/download/batch
 * Body: { taskIds: string[] }
 */
router.post('/batch', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { taskIds } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return (0, response_1.error)(res, '请提供要下载的任务ID列表', 400);
        }
        // 限制批量下载数量
        if (taskIds.length > 50) {
            return (0, response_1.error)(res, '单次最多下载 50 个任务', 400);
        }
        const result = await downloadService.downloadBatch({ taskIds, userId });
        // 设置响应头
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
        // 流式传输
        const stream = result.stream;
        stream.pipe(res);
        stream.on('error', (err) => {
            logger_1.default.error('批量下载流错误', { error: err.message });
            if (!res.headersSent) {
                res.status(500).json({ code: 500, msg: '批量下载失败', data: null });
            }
        });
        logger_1.default.info('批量下载开始', { userId, taskCount: taskIds.length, fileName: result.fileName });
        return;
    }
    catch (err) {
        const message = err.message;
        if (message.includes('无有效任务')) {
            return (0, response_1.error)(res, message, 400);
        }
        else {
            return next(err);
        }
    }
});
/**
 * 单文件下载
 *
 * GET /api/download/:taskId
 */
router.get('/:taskId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const taskId = req.params.taskId;
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        const result = downloadService.downloadSingle(taskId, userId);
        // 设置响应头
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
        if (result.fileSize > 0) {
            res.setHeader('Content-Length', result.fileSize);
        }
        // 流式传输
        const stream = result.stream;
        stream.pipe(res);
        stream.on('error', (err) => {
            logger_1.default.error('文件下载流错误', { taskId, error: err.message });
            if (!res.headersSent) {
                res.status(500).json({ code: 500, msg: '文件下载失败', data: null });
            }
        });
        logger_1.default.info('文件下载开始', { taskId, userId, fileName: result.fileName });
        return;
    }
    catch (err) {
        const message = err.message;
        if (message.includes('不存在') || message.includes('无权限')) {
            return (0, response_1.error)(res, message, 404);
        }
        else if (message.includes('未完成')) {
            return (0, response_1.error)(res, message, 400);
        }
        else {
            return next(err);
        }
    }
});
exports.default = router;
//# sourceMappingURL=download.js.map