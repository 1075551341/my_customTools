"use strict";
/**
 * 上传服务模块
 *
 * 提供文件分片上传、合并、进度查询等功能
 *
 * @module services/upload
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
exports.createSession = createSession;
exports.uploadChunk = uploadChunk;
exports.completeUpload = completeUpload;
exports.getProgress = getProgress;
exports.cancelUpload = cancelUpload;
exports.getUserUploads = getUserUploads;
exports.cleanExpiredSessions = cleanExpiredSessions;
exports.isUploadComplete = isUploadComplete;
const path_1 = __importDefault(require("path"));
const uploadSessionsDb = __importStar(require("../db/uploadSessions"));
const storage = __importStar(require("../utils/storage"));
const config_1 = __importDefault(require("../config"));
/**
 * 创建上传会话
 *
 * @param params - 创建参数
 * @returns 上传会话
 * @throws 文件大小超出限制
 * @throws 文件格式不支持
 */
function createSession(params) {
    const { fileName, fileSize, type, userId } = params;
    // 验证文件大小
    const maxSize = type === 'video' ? config_1.default.video.maxFileSize : config_1.default.img.maxFileSize;
    if (fileSize > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
        throw new Error(`文件大小超出限制，最大允许 ${maxSizeMB} MB`);
    }
    // 验证文件格式
    const ext = storage.getFileExtension(fileName);
    const allowedFormats = type === 'video' ? config_1.default.video.allowedInputFormats : config_1.default.img.allowedInputFormats;
    if (!allowedFormats.includes(ext.toLowerCase())) {
        throw new Error(`不支持的文件格式: .${ext}，支持的格式: ${allowedFormats.join(', ')}`);
    }
    // 计算分片数量
    const chunkSize = config_1.default.upload.chunkSize;
    const totalChunks = Math.ceil(fileSize / chunkSize);
    // 创建会话
    const session = uploadSessionsDb.create({
        fileName,
        fileSize,
        totalChunks,
        type,
        userId
    });
    return session;
}
/**
 * 上传分片
 *
 * @param params - 上传参数
 * @returns 上传进度
 * @throws 上传会话不存在
 * @throws 无权限
 * @throws 分片索引无效
 */
function uploadChunk(params) {
    const { uploadId, chunkIndex, chunkData, userId } = params;
    // 验证会话
    const session = uploadSessionsDb.findById(uploadId);
    if (!session) {
        throw new Error('上传会话不存在');
    }
    // 验证权限
    if (session.userId !== userId) {
        throw new Error('无权限操作此上传会话');
    }
    // 验证分片索引
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
        throw new Error(`分片索引无效，有效范围: 0-${session.totalChunks - 1}`);
    }
    // 保存分片文件
    const chunkPath = storage.getChunkPath(uploadId, chunkIndex);
    require('fs').writeFileSync(chunkPath, chunkData);
    // 更新会话
    uploadSessionsDb.addUploadedChunk(uploadId, chunkIndex);
    // 返回进度
    return getProgress(uploadId);
}
/**
 * 完成上传（合并分片）
 *
 * @param uploadId - 上传ID
 * @param userId - 用户ID
 * @returns 合并后的文件路径
 * @throws 上传会话不存在
 * @throws 无权限
 * @throws 分片未上传完成
 */
async function completeUpload(uploadId, userId) {
    // 验证会话
    const session = uploadSessionsDb.findById(uploadId);
    if (!session) {
        throw new Error('上传会话不存在');
    }
    // 验证权限
    if (session.userId !== userId) {
        throw new Error('无权限操作此上传会话');
    }
    // 验证分片完整性
    if (session.uploadedChunks.length !== session.totalChunks) {
        throw new Error(`分片未上传完成，已上传 ${session.uploadedChunks.length}/${session.totalChunks}`);
    }
    // 生成输出文件路径
    const userUploadDir = storage.getUserUploadDir(userId);
    const uniqueFileName = storage.generateUniqueFileName(session.fileName);
    const outputPath = path_1.default.join(userUploadDir, uniqueFileName);
    // 合并分片
    const success = await storage.mergeChunks(uploadId, session.totalChunks, outputPath);
    if (!success) {
        throw new Error('分片合并失败');
    }
    // 删除上传会话
    uploadSessionsDb.remove(uploadId);
    return outputPath;
}
/**
 * 获取上传进度
 *
 * @param uploadId - 上传ID
 * @returns 上传进度或null
 */
function getProgress(uploadId) {
    const session = uploadSessionsDb.findById(uploadId);
    if (!session) {
        return null;
    }
    const uploadedChunks = session.uploadedChunks.length;
    const totalChunks = session.totalChunks;
    const progress = Math.round((uploadedChunks / totalChunks) * 100);
    const chunkSize = config_1.default.upload.chunkSize;
    const uploadedSize = uploadedChunks * chunkSize;
    return {
        uploadId: session.uploadId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        uploadedSize: Math.min(uploadedSize, session.fileSize),
        uploadedChunks,
        totalChunks,
        progress,
        isComplete: uploadedChunks === totalChunks
    };
}
/**
 * 取消上传
 *
 * @param uploadId - 上传ID
 * @param userId - 用户ID
 * @throws 上传会话不存在
 * @throws 无权限
 */
function cancelUpload(uploadId, userId) {
    // 验证会话
    const session = uploadSessionsDb.findById(uploadId);
    if (!session) {
        throw new Error('上传会话不存在');
    }
    // 验证权限
    if (session.userId !== userId) {
        throw new Error('无权限操作此上传会话');
    }
    // 删除已上传的分片文件
    for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = storage.getChunkPath(uploadId, i);
        storage.deleteFile(chunkPath);
    }
    // 删除会话
    uploadSessionsDb.remove(uploadId);
}
/**
 * 获取用户的所有上传会话进度
 *
 * @param userId - 用户ID
 * @returns 上传进度列表
 */
function getUserUploads(userId) {
    const sessions = uploadSessionsDb.findByUserId(userId);
    return sessions.map(session => getProgress(session.uploadId)).filter(Boolean);
}
/**
 * 清理过期的上传会话
 *
 * @returns 清理的会话数量
 */
function cleanExpiredSessions() {
    // 清理过期的会话记录
    const cleanedSessions = uploadSessionsDb.cleanExpired(24);
    // 清理过期的分片文件
    const chunksDir = storage.getChunksDir();
    storage.cleanOldFiles(chunksDir, 24);
    return cleanedSessions;
}
/**
 * 验证文件是否已上传完成
 *
 * @param uploadId - 上传ID
 * @returns 是否完成
 */
function isUploadComplete(uploadId) {
    return uploadSessionsDb.isComplete(uploadId);
}
//# sourceMappingURL=upload.js.map