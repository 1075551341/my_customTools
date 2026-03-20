"use strict";
/**
 * 清理路由模块
 *
 * 提供手动清理和统计接口
 *
 * @module routes/clean
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
const cleanService = __importStar(require("../services/clean"));
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 执行手动清理
 *
 * POST /api/clean/run
 */
router.post('/run', auth_1.authMiddleware, (req, res, next) => {
    try {
        // 简单权限检查（只有管理员可以手动触发清理）
        if (req.user?.role !== 'admin') {
            return (0, response_1.error)(res, '只有管理员可以执行清理操作', 403);
        }
        const stats = cleanService.runFullClean();
        return (0, response_1.success)(res, stats, '清理完成');
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取清理统计
 *
 * GET /api/clean/stats
 */
router.get('/stats', auth_1.authMiddleware, (req, res, next) => {
    try {
        const stats = cleanService.getCleanStats();
        return (0, response_1.success)(res, stats);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取存储使用情况
 *
 * GET /api/clean/storage
 */
router.get('/storage', auth_1.authMiddleware, (req, res, next) => {
    try {
        const usage = cleanService.getStorageUsage();
        return (0, response_1.success)(res, usage);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 清理旧任务
 *
 * POST /api/clean/tasks
 * Body: { maxAgeDays?: number }
 */
router.post('/tasks', auth_1.authMiddleware, (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return (0, response_1.error)(res, '只有管理员可以执行清理操作', 403);
        }
        const { maxAgeDays = 7 } = req.body;
        const count = cleanService.cleanOldTasks(maxAgeDays);
        return (0, response_1.success)(res, { tasksRemoved: count }, `已清理 ${count} 个旧任务`);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 清理临时文件
 *
 * POST /api/clean/temp
 * Body: { maxAgeHours?: number }
 */
router.post('/temp', auth_1.authMiddleware, (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return (0, response_1.error)(res, '只有管理员可以执行清理操作', 403);
        }
        const { maxAgeHours = 24 } = req.body;
        const count = cleanService.cleanTempFiles(maxAgeHours);
        return (0, response_1.success)(res, { filesRemoved: count }, `已清理 ${count} 个临时文件`);
    }
    catch (err) {
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=clean.js.map