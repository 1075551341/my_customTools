"use strict";
/**
 * 任务服务模块
 *
 * 提供任务创建、查询、状态管理等功能
 *
 * @module services/tasks
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
exports.createTask = createTask;
exports.getTask = getTask;
exports.queryTasks = queryTasks;
exports.updateTaskStatus = updateTaskStatus;
exports.cancelTask = cancelTask;
exports.retryTask = retryTask;
exports.deleteTask = deleteTask;
exports.getTaskStats = getTaskStats;
exports.updateTaskProgress = updateTaskProgress;
exports.markTaskFailed = markTaskFailed;
exports.markTaskCompleted = markTaskCompleted;
exports.getPendingTasks = getPendingTasks;
exports.cleanOldTasks = cleanOldTasks;
exports.submitTask = submitTask;
exports.createComposeGifTask = createComposeGifTask;
exports.batchCreateTasks = batchCreateTasks;
const path_1 = __importDefault(require("path"));
const tasksDb = __importStar(require("../db/tasks"));
const storage = __importStar(require("../utils/storage"));
const queue_1 = require("../queue");
const presetDb = __importStar(require("../db/presets"));
/**
 * 创建任务
 *
 * @param params - 创建参数
 * @returns 创建的任务
 */
function createTask(params) {
    // 生成输出路径
    const userOutputDir = storage.getUserOutputDir(params.userId);
    const outputFileName = storage.generateUniqueFileName(`${path_1.default.parse(params.fileName).name}.${params.outputFormat}`);
    const outputPath = path_1.default.join(userOutputDir, outputFileName);
    const task = tasksDb.create({
        type: params.type,
        userId: params.userId,
        fileName: params.fileName,
        fileSize: params.fileSize,
        inputPath: params.inputPath,
        outputPath,
        inputFormat: params.inputFormat,
        outputFormat: params.outputFormat,
        config: params.config,
    });
    return task;
}
/**
 * 根据ID获取任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID（用于权限验证）
 * @returns 任务信息
 * @throws 任务不存在
 * @throws 无权限
 */
function getTask(taskId, userId) {
    const task = tasksDb.findById(taskId);
    if (!task) {
        throw new Error("任务不存在");
    }
    // 权限验证
    if (userId && task.userId !== userId) {
        throw new Error("无权限访问此任务");
    }
    return task;
}
/**
 * 查询任务列表
 *
 * @param params - 查询参数
 * @returns 分页任务列表
 */
function queryTasks(params) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const { list, total } = tasksDb.findPaginated({
        userId: params.userId,
        status: params.status,
        type: params.type,
        page,
        pageSize,
    });
    return {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 更新任务状态
 *
 * @param taskId - 任务ID
 * @param status - 新状态
 * @param userId - 用户ID（用于权限验证）
 * @returns 更新后的任务
 * @throws 任务不存在
 * @throws 无权限
 */
function updateTaskStatus(taskId, status, userId) {
    // 验证任务存在和权限
    const task = getTask(taskId, userId);
    // 状态流转验证
    const validTransitions = {
        waiting: ["uploading", "processing", "cancelled"],
        uploading: ["processing", "cancelled"],
        processing: ["completed", "failed", "cancelled"],
        completed: [],
        failed: [],
        cancelled: [],
    };
    if (!validTransitions[task.status].includes(status)) {
        throw new Error(`不能从 ${task.status} 状态转换到 ${status}`);
    }
    return tasksDb.updateStatus(taskId, status);
}
/**
 * 取消任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID
 * @returns 更新后的任务
 * @throws 任务不存在
 * @throws 无权限
 * @throws 任务无法取消
 */
function cancelTask(taskId, userId) {
    return updateTaskStatus(taskId, "cancelled", userId);
}
/**
 * 重试失败的任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID
 * @returns 更新后的任务
 * @throws 任务不存在
 * @throws 无权限
 * @throws 只能重试失败的任务
 */
function retryTask(taskId, userId) {
    const task = getTask(taskId, userId);
    if (task.status !== "failed") {
        throw new Error("只能重试失败的任务");
    }
    return tasksDb.update(taskId, {
        status: "waiting",
        progress: 0,
        errorMsg: undefined,
        startedAt: undefined,
        completedAt: undefined,
    });
}
/**
 * 删除任务
 *
 * @param taskId - 任务ID
 * @param userId - 用户ID
 * @returns 是否删除成功
 * @throws 任务不存在
 * @throws 无权限
 * @throws 只能删除已完成的任务
 */
function deleteTask(taskId, userId) {
    const task = getTask(taskId, userId);
    // 只能删除已完成、失败或取消的任务
    if (!["completed", "failed", "cancelled"].includes(task.status)) {
        throw new Error("只能删除已完成、失败或取消的任务");
    }
    // 删除相关文件
    if (task.inputPath) {
        storage.deleteFile(task.inputPath);
    }
    if (task.outputPath) {
        storage.deleteFile(task.outputPath);
    }
    return tasksDb.remove(taskId);
}
/**
 * 获取任务统计
 *
 * @param userId - 用户ID（可选）
 * @returns 统计信息
 */
function getTaskStats(userId) {
    return tasksDb.getStats(userId);
}
/**
 * 更新任务进度
 *
 * @param taskId - 任务ID
 * @param progress - 进度（0-100）
 */
function updateTaskProgress(taskId, progress) {
    tasksDb.updateProgress(taskId, progress);
}
/**
 * 标记任务失败
 *
 * @param taskId - 任务ID
 * @param errorMsg - 错误信息
 */
function markTaskFailed(taskId, errorMsg) {
    tasksDb.updateStatus(taskId, "failed", errorMsg);
}
/**
 * 标记任务完成
 *
 * @param taskId - 任务ID
 */
function markTaskCompleted(taskId) {
    tasksDb.updateStatus(taskId, "completed");
    tasksDb.updateProgress(taskId, 100);
}
/**
 * 获取待处理的任务
 *
 * @returns 待处理任务列表
 */
function getPendingTasks() {
    return tasksDb.findByStatus("waiting");
}
/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
function cleanOldTasks(maxAgeDays = 7) {
    return tasksDb.cleanOldTasks(maxAgeDays);
}
/**
 * 提交任务到转码队列
 *
 * @param taskId - 任务ID
 * @throws 任务不存在
 * @throws 任务状态不允许提交
 */
async function submitTask(taskId) {
    const task = tasksDb.findById(taskId);
    if (!task) {
        throw new Error("任务不存在");
    }
    // 只有 waiting 状态的任务可以提交
    if (task.status !== "waiting") {
        throw new Error(`任务状态为 ${task.status}，无法提交`);
    }
    // 验证输入文件存在
    if (!task.inputPath || !storage.fileExists(task.inputPath)) {
        throw new Error("输入文件不存在");
    }
    // 加入转码队列
    await (0, queue_1.addTranscodeJob)(task);
    // 更新状态为上传中（等待处理）
    tasksDb.updateStatus(taskId, "uploading");
}
/**
 * 创建图片序列合成 GIF 任务
 *
 * @param params - 创建参数
 * @returns 创建的任务
 */
async function createComposeGifTask(params) {
    const { imagePaths, outputFormat, config, userId } = params;
    // 验证所有图片存在
    for (const imgPath of imagePaths) {
        if (!storage.fileExists(imgPath)) {
            throw new Error(`图片文件不存在: ${imgPath}`);
        }
    }
    // 生成输出路径
    const userOutputDir = storage.getUserOutputDir(userId);
    const outputFileName = storage.generateUniqueFileName(`composed_${Date.now()}.${outputFormat}`);
    const outputPath = path_1.default.join(userOutputDir, outputFileName);
    // 创建任务记录
    const task = tasksDb.create({
        type: "anim",
        userId,
        fileName: `图片序列合成 (${imagePaths.length}张)`,
        fileSize: 0,
        inputPath: imagePaths[0], // 存储第一张图片作为参考
        outputPath,
        inputFormat: "images",
        outputFormat,
        config: {
            ...config,
            imagePaths,
            outputFormat,
        },
    });
    // 直接提交到队列（使用特殊处理逻辑）
    await (0, queue_1.addTranscodeJob)({
        ...task,
        config: {
            ...task.config,
            imagePaths,
        },
    });
    // 更新状态
    tasksDb.updateStatus(task.id, "processing");
    return task;
}
/**
 * 根据预设创建任务
 *
 * @param fileId - 文件 ID
 * @param preset - 预设配置
 * @param userId - 用户 ID
 * @returns 创建的任务
 */
function createTaskFromPreset(fileId, preset, userId) {
    // 获取文件信息
    const fileInfo = tasksDb.findById(fileId);
    if (!fileInfo) {
        throw new Error(`文件不存在：${fileId}`);
    }
    // 根据预设类型创建任务
    const task = tasksDb.create({
        type: preset.type === "video" ? "video" : preset.type === "image" ? "img" : "document",
        userId,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        inputPath: fileInfo.inputPath,
        outputPath: "", // 由 createTask 生成
        inputFormat: fileInfo.inputFormat,
        outputFormat: "", // 由预设配置决定
        config: preset.config,
    });
    return task;
}
/**
 * 批量创建转码任务
 *
 * 对于每个文件和每个预设的组合，创建一个任务
 * 例如：3 个文件 × 2 个预设 = 6 个任务
 *
 * @param data - 批量创建请求参数
 * @returns 批量创建响应
 */
function batchCreateTasks(data) {
    const { fileIds, presetIds, userId } = data;
    const tasks = [];
    const failed = [];
    // 获取所有预设
    const presets = presetDb.getAllPresets();
    const selectedPresets = presets.filter((p) => presetIds.includes(p.id));
    for (const fileId of fileIds) {
        for (const preset of selectedPresets) {
            try {
                // 为每个文件 - 预设组合创建任务
                const task = createTaskFromPreset(fileId, preset, userId);
                tasks.push(task);
            }
            catch (error) {
                failed.push({
                    fileId,
                    presetId: preset.id,
                    reason: error.message,
                });
            }
        }
    }
    return {
        total: tasks.length,
        tasks,
        failed,
    };
}
//# sourceMappingURL=tasks.js.map