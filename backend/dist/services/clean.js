"use strict";
/**
 * 自动清理服务模块
 *
 * 使用 node-cron 定期清理旧任务和临时文件
 *
 * @module services/clean
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
exports.cleanOldTasks = cleanOldTasks;
exports.cleanTempFiles = cleanTempFiles;
exports.cleanOutputFiles = cleanOutputFiles;
exports.runFullClean = runFullClean;
exports.startScheduledClean = startScheduledClean;
exports.stopScheduledClean = stopScheduledClean;
exports.getCleanStats = getCleanStats;
exports.getStorageUsage = getStorageUsage;
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const tasksDb = __importStar(require("../db/tasks"));
const storage = __importStar(require("../utils/storage"));
const configService = __importStar(require("./config"));
/**
 * 清理统计
 */
let cleanStats = {
    tasksRemoved: 0,
    filesRemoved: 0,
    spaceFreed: 0,
    lastRun: null
};
/**
 * 定时任务实例
 */
let scheduledJob = null;
/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
function cleanOldTasks(maxAgeDays = 7) {
    const count = tasksDb.cleanOldTasks(maxAgeDays);
    logger_1.default.info('清理旧任务完成', { count, maxAgeDays });
    return count;
}
/**
 * 清理临时文件
 *
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的文件数量
 */
function cleanTempFiles(maxAgeHours = 24) {
    const tempDir = path_1.default.join(config_1.default.storage.uploadDir, 'temp');
    const chunksDir = path_1.default.join(config_1.default.storage.uploadDir, 'chunks');
    let count = 0;
    // 清理临时目录
    if (fs_1.default.existsSync(tempDir)) {
        count += storage.cleanOldFiles(tempDir, maxAgeHours);
    }
    // 清理分片目录
    if (fs_1.default.existsSync(chunksDir)) {
        count += storage.cleanOldFiles(chunksDir, maxAgeHours);
    }
    logger_1.default.info('清理临时文件完成', { count, maxAgeHours });
    return count;
}
/**
 * 清理用户输出目录中的旧文件
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的文件数量和释放的空间
 */
function cleanOutputFiles(maxAgeDays = 7) {
    const outputDir = config_1.default.storage.outputDir;
    if (!fs_1.default.existsSync(outputDir)) {
        return { count: 0, spaceFreed: 0 };
    }
    let count = 0;
    let spaceFreed = 0;
    const userDirs = fs_1.default.readdirSync(outputDir);
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    for (const userDir of userDirs) {
        const userPath = path_1.default.join(outputDir, userDir);
        if (!fs_1.default.statSync(userPath).isDirectory()) {
            continue;
        }
        const files = fs_1.default.readdirSync(userPath);
        for (const file of files) {
            const filePath = path_1.default.join(userPath, file);
            try {
                const stats = fs_1.default.statSync(filePath);
                const age = now - stats.mtime.getTime();
                if (age > maxAgeMs) {
                    spaceFreed += stats.size;
                    fs_1.default.unlinkSync(filePath);
                    count++;
                }
            }
            catch (error) {
                logger_1.default.warn('清理输出文件失败', { path: filePath, error: error.message });
            }
        }
    }
    logger_1.default.info('清理输出文件完成', { count, spaceFreed, maxAgeDays });
    return { count, spaceFreed };
}
/**
 * 执行完整清理
 *
 * @returns 清理统计
 */
function runFullClean() {
    const storageConfig = configService.getStorageConfig();
    const cleanDays = storageConfig.cleanDays || 7;
    logger_1.default.info('开始执行自动清理', { cleanDays });
    // 清理旧任务
    const tasksRemoved = cleanOldTasks(cleanDays);
    // 清理临时文件（24小时）
    const tempFiles = cleanTempFiles(24);
    // 清理输出文件
    const { count: outputFiles, spaceFreed } = cleanOutputFiles(cleanDays);
    // 更新统计
    cleanStats = {
        tasksRemoved,
        filesRemoved: tempFiles + outputFiles,
        spaceFreed,
        lastRun: new Date().toISOString()
    };
    logger_1.default.info('自动清理完成', cleanStats);
    return cleanStats;
}
/**
 * 启动定时清理任务
 *
 * 默认每天凌晨 3 点执行
 *
 * @param cronExpression - cron 表达式
 */
function startScheduledClean(cronExpression = '0 3 * * *') {
    if (scheduledJob) {
        logger_1.default.warn('定时清理任务已在运行');
        return;
    }
    // 验证 cron 表达式
    if (!node_cron_1.default.validate(cronExpression)) {
        throw new Error(`无效的 cron 表达式: ${cronExpression}`);
    }
    scheduledJob = node_cron_1.default.schedule(cronExpression, () => {
        const storageConfig = configService.getStorageConfig();
        if (storageConfig.autoClean) {
            logger_1.default.info('定时清理任务触发');
            runFullClean();
        }
        else {
            logger_1.default.debug('自动清理已禁用，跳过定时任务');
        }
    });
    logger_1.default.info('定时清理任务已启动', { cron: cronExpression });
}
/**
 * 停止定时清理任务
 */
function stopScheduledClean() {
    if (scheduledJob) {
        scheduledJob.stop();
        scheduledJob = null;
        logger_1.default.info('定时清理任务已停止');
    }
}
/**
 * 获取清理统计
 *
 * @returns 清理统计
 */
function getCleanStats() {
    return { ...cleanStats };
}
/**
 * 获取存储使用情况
 *
 * @returns 存储使用情况
 */
function getStorageUsage() {
    const uploadSize = storage.getDirSize(config_1.default.storage.uploadDir);
    const outputSize = storage.getDirSize(config_1.default.storage.outputDir);
    const dataSize = storage.getDirSize(config_1.default.storage.dataDir);
    const totalSize = uploadSize + outputSize + dataSize;
    return {
        uploadDir: {
            size: uploadSize,
            sizeMB: Math.round(uploadSize / 1024 / 1024 * 100) / 100
        },
        outputDir: {
            size: outputSize,
            sizeMB: Math.round(outputSize / 1024 / 1024 * 100) / 100
        },
        dataDir: {
            size: dataSize,
            sizeMB: Math.round(dataSize / 1024 / 1024 * 100) / 100
        },
        total: {
            size: totalSize,
            sizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
            sizeGB: Math.round(totalSize / 1024 / 1024 / 1024 * 100) / 100
        }
    };
}
//# sourceMappingURL=clean.js.map