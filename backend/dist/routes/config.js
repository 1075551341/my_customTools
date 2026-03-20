"use strict";
/**
 * 配置路由模块
 *
 * 提供系统配置管理接口
 *
 * @module routes/config
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
const configService = __importStar(require("../services/config"));
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 获取系统配置
 *
 * GET /api/config
 */
router.get('/', auth_1.authMiddleware, (req, res, next) => {
    try {
        const config = configService.getConfig();
        return (0, response_1.success)(res, config);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 更新系统配置
 *
 * PUT /api/config
 * Body: Partial<SystemConfig>
 */
router.put('/', auth_1.authMiddleware, (req, res, next) => {
    try {
        const updates = req.body;
        if (!updates || Object.keys(updates).length === 0) {
            return (0, response_1.error)(res, '请提供要更新的配置项', 400);
        }
        const newConfig = configService.updateConfig(updates);
        return (0, response_1.success)(res, newConfig, '配置更新成功');
    }
    catch (err) {
        const message = err.message;
        if (message.includes('必须在') || message.includes('不能')) {
            return (0, response_1.error)(res, message, 400);
        }
        return next(err);
    }
});
/**
 * 重置为默认配置
 *
 * POST /api/config/reset
 */
router.post('/reset', auth_1.authMiddleware, (req, res, next) => {
    try {
        const defaultConfig = configService.resetConfig();
        return (0, response_1.success)(res, defaultConfig, '配置已重置为默认值');
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取配置对比
 *
 * GET /api/config/diff
 */
router.get('/diff', auth_1.authMiddleware, (req, res, next) => {
    try {
        const diff = configService.getConfigDiff();
        return (0, response_1.success)(res, diff);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取视频配置
 *
 * GET /api/config/video
 */
router.get('/video', auth_1.authMiddleware, (req, res, next) => {
    try {
        const videoConfig = configService.getVideoConfig();
        return (0, response_1.success)(res, videoConfig);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取图片配置
 *
 * GET /api/config/img
 */
router.get('/img', auth_1.authMiddleware, (req, res, next) => {
    try {
        const imgConfig = configService.getImgConfig();
        return (0, response_1.success)(res, imgConfig);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取上传配置
 *
 * GET /api/config/upload
 */
router.get('/upload', auth_1.authMiddleware, (req, res, next) => {
    try {
        const uploadConfig = configService.getUploadConfig();
        return (0, response_1.success)(res, uploadConfig);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取存储配置
 *
 * GET /api/config/storage
 */
router.get('/storage', auth_1.authMiddleware, (req, res, next) => {
    try {
        const storageConfig = configService.getStorageConfig();
        return (0, response_1.success)(res, storageConfig);
    }
    catch (err) {
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map