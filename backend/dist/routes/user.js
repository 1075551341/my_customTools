"use strict";
/**
 * 用户路由模块
 *
 * 提供用户信息、用户偏好接口
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
const authService = __importStar(require("../services/auth"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 用户偏好数据存储路径
 */
const PREFERENCES_DIR = path_1.default.join(process.cwd(), 'data');
const PREFERENCES_FILE = path_1.default.join(PREFERENCES_DIR, 'preferences.json');
/**
 * 默认用户偏好
 */
const defaultPreferences = {
    theme: 'light',
    language: 'zh-CN',
    notifications: {
        taskCompleted: true,
        taskFailed: true,
        soundEnabled: false
    }
};
/**
 * 确保偏好数据目录存在
 */
function ensurePreferencesDir() {
    if (!fs_1.default.existsSync(PREFERENCES_DIR)) {
        fs_1.default.mkdirSync(PREFERENCES_DIR, { recursive: true });
    }
}
/**
 * 读取用户偏好
 */
function readPreferences(userId) {
    ensurePreferencesDir();
    if (!fs_1.default.existsSync(PREFERENCES_FILE)) {
        return { ...defaultPreferences };
    }
    try {
        const data = fs_1.default.readFileSync(PREFERENCES_FILE, 'utf-8');
        const allPreferences = JSON.parse(data);
        return allPreferences[userId] || { ...defaultPreferences };
    }
    catch {
        return { ...defaultPreferences };
    }
}
/**
 * 保存用户偏好
 */
function savePreferences(userId, preferences) {
    ensurePreferencesDir();
    let allPreferences = {};
    if (fs_1.default.existsSync(PREFERENCES_FILE)) {
        try {
            const data = fs_1.default.readFileSync(PREFERENCES_FILE, 'utf-8');
            allPreferences = JSON.parse(data);
        }
        catch {
            // 忽略解析错误
        }
    }
    allPreferences[userId] = {
        ...defaultPreferences,
        ...(allPreferences[userId] || {}),
        ...preferences,
        notifications: {
            ...defaultPreferences.notifications,
            ...(allPreferences[userId]?.notifications || {}),
            ...(preferences.notifications || {})
        }
    };
    fs_1.default.writeFileSync(PREFERENCES_FILE, JSON.stringify(allPreferences, null, 2));
    return allPreferences[userId];
}
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
        const homePathMap = {
            super: '/dashboard',
            admin: '/dashboard',
            user: '/dashboard'
        };
        const vbenUserInfo = {
            userId: userInfo.id,
            username: userInfo.username,
            realName: userInfo.username,
            avatar: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
            desc: '媒体转码工具用户',
            homePath: homePathMap[userInfo.role] || '/dashboard',
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
/**
 * 获取用户偏好
 *
 * GET /api/user/preferences
 */
router.get('/preferences', auth_1.authMiddleware, (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        const preferences = readPreferences(userId);
        return (0, response_1.success)(res, preferences);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 更新用户偏好
 *
 * PUT /api/user/preferences
 */
router.put('/preferences', auth_1.authMiddleware, (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        const updates = req.body;
        const updatedPreferences = savePreferences(userId, updates);
        return (0, response_1.success)(res, updatedPreferences, '偏好设置已保存');
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 重置用户偏好
 *
 * POST /api/user/preferences/reset
 */
router.post('/preferences/reset', auth_1.authMiddleware, (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.error)(res, '未授权', 401);
        }
        const resetPreferences = savePreferences(userId, defaultPreferences);
        return (0, response_1.success)(res, resetPreferences, '偏好设置已重置');
    }
    catch (err) {
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map