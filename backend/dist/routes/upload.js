"use strict";
/**
 * 上传路由模块
 *
 * 提供文件分片上传、进度查询、取消上传等接口
 *
 * @module routes/upload
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
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
const uploadService = __importStar(require("../services/upload"));
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
// 所有上传接口需要认证
router.use(auth_1.authMiddleware);
/**
 * Multer 配置 - 内存存储，用于分片上传
 */
const chunkUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: config_1.default.upload.chunkSize * 2 // 分片大小上限
    }
});
/**
 * POST /api/upload/session
 *
 * 创建上传会话
 *
 * @body {fileName, fileSize, type}
 * @returns 上传会话信息
 */
router.post('/session', (req, res) => {
    const { fileName, fileSize, type } = req.body;
    // 参数验证
    if (!fileName || !fileSize || !type) {
        return (0, response_1.error)(res, 'fileName、fileSize 和 type 不能为空', 400);
    }
    if (!['video', 'img', 'anim'].includes(type)) {
        return (0, response_1.error)(res, 'type 必须是 video、img 或 anim', 400);
    }
    if (typeof fileSize !== 'number' || fileSize <= 0) {
        return (0, response_1.error)(res, 'fileSize 必须是正数', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const session = uploadService.createSession({
            fileName,
            fileSize,
            type: type,
            userId
        });
        return (0, response_1.success)(res, {
            uploadId: session.uploadId,
            totalChunks: session.totalChunks,
            chunkSize: config_1.default.upload.chunkSize
        }, '上传会话创建成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '创建上传会话失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/upload/chunk
 *
 * 上传分片
 *
 * @body uploadId, chunkIndex, file (multipart)
 * @returns 上传进度
 */
router.post('/chunk', chunkUpload.single('file'), (req, res) => {
    const { uploadId, chunkIndex } = req.body;
    // 参数验证
    if (!uploadId || chunkIndex === undefined) {
        return (0, response_1.error)(res, 'uploadId 和 chunkIndex 不能为空', 400);
    }
    if (!req.file) {
        return (0, response_1.error)(res, '未上传分片文件', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const progress = uploadService.uploadChunk({
            uploadId,
            chunkIndex: parseInt(chunkIndex, 10),
            chunkData: req.file.buffer,
            userId
        });
        return (0, response_1.success)(res, progress);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '上传分片失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/upload/complete
 *
 * 完成上传（合并分片）
 *
 * @body {uploadId}
 * @returns 合并后的文件路径
 */
router.post('/complete', async (req, res) => {
    const { uploadId } = req.body;
    if (!uploadId) {
        return (0, response_1.error)(res, 'uploadId 不能为空', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const filePath = await uploadService.completeUpload(uploadId, userId);
        return (0, response_1.success)(res, {
            filePath,
            fileName: path_1.default.basename(filePath)
        }, '上传完成');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '完成上传失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * GET /api/upload/progress/:uploadId
 *
 * 获取上传进度
 *
 * @param uploadId - 上传ID
 * @returns 上传进度
 */
router.get('/progress/:uploadId', (req, res) => {
    const uploadId = req.params.uploadId;
    try {
        const progress = uploadService.getProgress(uploadId);
        if (!progress) {
            return (0, response_1.error)(res, '上传会话不存在', 404);
        }
        return (0, response_1.success)(res, progress);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '获取进度失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * DELETE /api/upload/cancel/:uploadId
 *
 * 取消上传
 *
 * @param uploadId - 上传ID
 */
router.delete('/cancel/:uploadId', (req, res) => {
    const uploadId = req.params.uploadId;
    try {
        const userId = (0, auth_1.requireUserId)(req);
        uploadService.cancelUpload(uploadId, userId);
        return (0, response_1.success)(res, null, '上传已取消');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '取消上传失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * GET /api/upload/list
 *
 * 获取当前用户的所有上传任务
 *
 * @returns 上传进度列表
 */
router.get('/list', (req, res) => {
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const uploads = uploadService.getUserUploads(userId);
        return (0, response_1.success)(res, uploads);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '获取上传列表失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * GET /api/upload/config
 *
 * 获取上传配置
 *
 * @returns 上传配置信息
 */
router.get('/config', (req, res) => {
    return (0, response_1.success)(res, {
        chunkSize: config_1.default.upload.chunkSize,
        maxParallelUploads: config_1.default.upload.maxParallelUploads,
        video: {
            maxFileSize: config_1.default.video.maxFileSize,
            allowedFormats: config_1.default.video.allowedInputFormats
        },
        img: {
            maxFileSize: config_1.default.img.maxFileSize,
            allowedFormats: config_1.default.img.allowedInputFormats
        }
    });
});
exports.default = router;
//# sourceMappingURL=upload.js.map