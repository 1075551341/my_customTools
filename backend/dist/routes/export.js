"use strict";
/**
 * 导出路由模块
 *
 * 提供任务报告导出接口
 *
 * @module routes/export
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
const exportService = __importStar(require("../services/export"));
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 导出任务报告
 *
 * GET /api/export/tasks
 * Query: format=json|csv, status, type, startDate, endDate
 */
router.get('/tasks', auth_1.authMiddleware, (req, res, next) => {
    try {
        const userId = req.user?.id;
        const format = req.query.format || 'json';
        const status = req.query.status;
        const type = req.query.type;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        if (!['json', 'csv'].includes(format)) {
            return (0, response_1.error)(res, '不支持的导出格式，请使用 json 或 csv', 400);
        }
        const result = exportService.exportTasks({
            userId,
            format,
            status,
            type,
            startDate,
            endDate
        });
        // 设置响应头进行下载
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
        res.send(result.content);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取导出统计
 *
 * GET /api/export/stats
 */
router.get('/stats', auth_1.authMiddleware, (req, res, next) => {
    try {
        const userId = req.user?.id;
        const stats = exportService.getExportStats(userId);
        return (0, response_1.success)(res, stats);
    }
    catch (err) {
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=export.js.map