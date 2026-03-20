"use strict";
/**
 * 下载服务模块
 *
 * 提供单文件下载和批量打包下载功能
 *
 * @module services/download
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
exports.downloadSingle = downloadSingle;
exports.downloadBatch = downloadBatch;
exports.getUserDownloadSize = getUserDownloadSize;
exports.getDownloadableTasks = getDownloadableTasks;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const tasksDb = __importStar(require("../db/tasks"));
/**
 * 单文件下载
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID（用于权限验证）
 * @returns 下载结果
 * @throws 任务不存在
 * @throws 无权限
 * @throws 任务未完成
 * @throws 输出文件不存在
 */
function downloadSingle(taskId, userId) {
    // 查找任务
    const task = tasksDb.findById(taskId);
    if (!task) {
        throw new Error('任务不存在');
    }
    // 权限验证
    if (task.userId !== userId) {
        throw new Error('无权限下载此任务');
    }
    // 状态验证
    if (task.status !== 'completed') {
        throw new Error('任务未完成，无法下载');
    }
    // 文件存在验证
    if (!task.outputPath || !fs_1.default.existsSync(task.outputPath)) {
        throw new Error('输出文件不存在');
    }
    const stat = fs_1.default.statSync(task.outputPath);
    return {
        stream: fs_1.default.createReadStream(task.outputPath),
        fileName: getOutputFileName(task),
        fileSize: stat.size,
        mimeType: getMimeType(task.outputFormat)
    };
}
/**
 * 批量打包下载
 *
 * @param options - 批量下载选项
 * @returns 下载结果
 * @throws 无有效任务
 */
async function downloadBatch(options) {
    const { taskIds, userId } = options;
    // 查找并验证所有任务
    const validTasks = [];
    const errors = [];
    for (const taskId of taskIds) {
        const task = tasksDb.findById(taskId);
        if (!task) {
            errors.push(`任务 ${taskId} 不存在`);
            continue;
        }
        if (task.userId !== userId) {
            errors.push(`无权限访问任务 ${taskId}`);
            continue;
        }
        if (task.status !== 'completed') {
            errors.push(`任务 ${taskId} 未完成`);
            continue;
        }
        if (!task.outputPath || !fs_1.default.existsSync(task.outputPath)) {
            errors.push(`任务 ${taskId} 输出文件不存在`);
            continue;
        }
        validTasks.push(task);
    }
    if (validTasks.length === 0) {
        throw new Error(`无有效任务可下载: ${errors.join('; ')}`);
    }
    // 记录错误日志
    if (errors.length > 0) {
        logger_1.default.warn('批量下载部分任务无效', { errors });
    }
    // 创建 ZIP 打包流
    const archive = (0, archiver_1.default)('zip', {
        zlib: { level: 6 } // 压缩级别
    });
    // 添加文件到 ZIP
    for (const task of validTasks) {
        const fileName = getOutputFileName(task);
        archive.file(task.outputPath, { name: fileName });
    }
    // 完成 ZIP 打包
    archive.finalize();
    // 生成 ZIP 文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `transcode_results_${timestamp}.zip`;
    return {
        stream: archive,
        fileName: zipFileName,
        fileSize: 0, // ZIP 流式生成，无法预知大小
        mimeType: 'application/zip'
    };
}
/**
 * 获取输出文件名
 *
 * @param task - 任务对象
 * @returns 文件名
 */
function getOutputFileName(task) {
    const originalName = task.fileName;
    const baseName = path_1.default.parse(originalName).name;
    return `${baseName}.${task.outputFormat}`;
}
/**
 * 获取 MIME 类型
 *
 * @param format - 文件格式
 * @returns MIME 类型
 */
function getMimeType(format) {
    const mimeTypes = {
        // 视频格式
        mp4: 'video/mp4',
        mkv: 'video/x-matroska',
        webm: 'video/webm',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        // 图片格式
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        bmp: 'image/bmp',
        tiff: 'image/tiff',
        // 默认
        default: 'application/octet-stream'
    };
    return mimeTypes[format.toLowerCase()] || mimeTypes.default;
}
/**
 * 获取用户下载目录大小
 *
 * @param userId - 用户ID
 * @returns 目录大小（字节）
 */
function getUserDownloadSize(userId) {
    const outputDir = path_1.default.join(config_1.default.storage.outputDir, userId);
    if (!fs_1.default.existsSync(outputDir)) {
        return 0;
    }
    return getDirSize(outputDir);
}
/**
 * 获取目录大小
 *
 * @param dirPath - 目录路径
 * @returns 目录大小（字节）
 */
function getDirSize(dirPath) {
    let totalSize = 0;
    const files = fs_1.default.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path_1.default.join(dirPath, file);
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            totalSize += getDirSize(filePath);
        }
        else {
            totalSize += stat.size;
        }
    }
    return totalSize;
}
/**
 * 获取用户已完成任务列表（用于下载）
 *
 * @param userId - 用户ID
 * @returns 已完成任务列表
 */
function getDownloadableTasks(userId) {
    const tasks = tasksDb.findByUserId(userId);
    return tasks.filter(task => task.status === 'completed' && task.outputPath);
}
//# sourceMappingURL=download.js.map