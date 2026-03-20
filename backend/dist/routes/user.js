"use strict";
/**
 * 用户路由模块
 *
 * 提供用户信息接口（兼容 Vben Admin）
 *
 * @module routes/user
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
const auth_1 = require("../middlewares/auth");
const authService = __importStar(require("../services/auth"));
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 获取用户信息
 *
 * GET /api/user/info
 * 兼容 Vben Admin 的用户信息接口
 */
router.get('/info', auth_1.authMiddleware, (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        const userInfo = authService.getUserInfo(userId);
        // 转换为 Vben Admin 格式
        const vbenUserInfo = {
            userId: userInfo.id,
            username: userInfo.username,
            realName: userInfo.username,
            avatar: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
            desc: '媒体转码工具用户',
            homePath: '/dashboard',
            roles: [userInfo.role]
        };
        return (0, response_1.success)(res, vbenUserInfo);
    }
    catch (err) {
        const message = err.message;
        if (message.includes('不存在')) {
            return (0, response_1.error)(res, message, 404);
        }
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map