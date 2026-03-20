"use strict";
/**
 * 系统路由
 *
 * 提供系统状态和健康检查接口
 *
 * @module routes/system
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
const queue_1 = require("../queue");
const router = (0, express_1.Router)();
/**
 * GET /api/system/health
 *
 * 健康检查接口（无需认证）
 *
 * 用于负载均衡器、监控系统或容器编排系统（如 Kubernetes）检测服务是否存活
 *
 * @returns 健康状态
 * - status: 'ok' | 'error'
 * - timestamp: 当前时间戳
 * - uptime: 服务运行时间（秒）
 */
router.get('/health', (req, res) => {
    const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    };
    return (0, response_1.success)(res, healthData, '服务正常');
});
/**
 * GET /api/system/status
 *
 * 获取系统资源状态（需要认证）
 *
 * 返回 CPU、内存、磁盘、队列使用情况
 *
 * @returns 系统状态
 * - cpu: CPU 使用率
 * - memory: 内存使用情况
 * - disk: 磁盘使用情况
 * - queue: 队列状态
 */
router.get('/status', async (req, res) => {
    // 获取队列状态（带超时）
    const getQueueStatsWithTimeout = async () => {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Queue stats timeout')), 3000);
            });
            const statsPromise = (0, queue_1.getQueueStats)();
            return await Promise.race([statsPromise, timeoutPromise]);
        }
        catch {
            return null;
        }
    };
    // 并行获取系统信息和队列状态
    const [si, queueStats] = await Promise.all([
        Promise.resolve().then(() => __importStar(require('systeminformation'))).catch(() => null),
        getQueueStatsWithTimeout()
    ]);
    // 默认队列状态
    const defaultQueueStats = {
        video: { waiting: 0, active: 0, completed: 0, failed: 0 },
        image: { waiting: 0, active: 0, completed: 0, failed: 0 },
        anim: { waiting: 0, active: 0, completed: 0, failed: 0 }
    };
    // 基础状态（队列信息）
    const baseStatus = {
        queue: queueStats || defaultQueueStats,
        timestamp: new Date().toISOString()
    };
    if (!si) {
        // 如果无法加载 systeminformation，返回基本信息
        const basicInfo = {
            cpu: { usage: 'N/A' },
            memory: {
                total: 'N/A',
                used: 'N/A',
                free: 'N/A'
            },
            disk: 'N/A',
            ...baseStatus
        };
        return (0, response_1.success)(res, basicInfo);
    }
    try {
        // 获取 CPU 使用率
        const cpu = await si.currentLoad();
        // 获取内存信息
        const memory = await si.mem();
        // 获取磁盘信息（只取第一个磁盘）
        const disk = await si.fsSize();
        const statusData = {
            cpu: {
                usage: cpu.currentLoad.toFixed(2) + '%',
                cores: cpu.cpus.length
            },
            memory: {
                total: (memory.total / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                used: (memory.used / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                free: (memory.free / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                usage: ((memory.used / memory.total) * 100).toFixed(2) + '%'
            },
            disk: disk.length > 0 ? {
                fs: disk[0].fs,
                total: (disk[0].size / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                used: (disk[0].used / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                usage: disk[0].use + '%'
            } : 'N/A',
            ...baseStatus
        };
        return (0, response_1.success)(res, statusData);
    }
    catch {
        // 获取失败时返回基本信息
        const basicInfo = {
            cpu: { usage: 'N/A' },
            memory: {
                total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                free: 'N/A'
            },
            disk: 'N/A',
            ...baseStatus
        };
        return (0, response_1.success)(res, { ...basicInfo, error: '无法获取完整系统信息' });
    }
});
exports.default = router;
//# sourceMappingURL=system.js.map