"use strict";
/**
 * 认证路由模块
 *
 * 提供用户注册、登录、刷新令牌等接口
 *
 * @module routes/auth
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
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: 用户注册
 *     description: 创建新用户账号（需系统开启注册功能）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 参数错误或用户已存在
 *       403:
 *         description: 注册功能已关闭
 */
router.post('/register', async (req, res) => {
    // 检查是否允许注册
    if (!config_1.default.features.allowRegister) {
        return (0, response_1.error)(res, '系统已关闭注册功能', 403);
    }
    const { username, password } = req.body;
    // 参数验证
    if (!username || !password) {
        return (0, response_1.error)(res, '用户名和密码不能为空', 400);
    }
    try {
        const result = await authService.register({ username, password });
        return (0, response_1.success)(res, result, '注册成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '注册失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 用户登录
 *     description: 使用用户名密码登录，返回访问令牌和刷新令牌
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: 登录成功
 *       401:
 *         description: 用户名或密码错误
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // 参数验证
    if (!username || !password) {
        return (0, response_1.error)(res, '用户名和密码不能为空', 400);
    }
    try {
        const result = await authService.login({ username, password });
        return (0, response_1.success)(res, result, '登录成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '登录失败';
        return (0, response_1.error)(res, message, 401);
    }
});
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: 刷新访问令牌
 *     description: 使用刷新令牌获取新的访问令牌
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 刷新成功
 *       401:
 *         description: 刷新令牌无效或已过期
 */
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return (0, response_1.error)(res, '刷新令牌不能为空', 400);
    }
    try {
        const result = authService.refreshToken(refreshToken);
        return (0, response_1.success)(res, result, '刷新成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '刷新失败';
        return (0, response_1.error)(res, message, 401);
    }
});
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 获取当前用户信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 msg:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权
 */
router.get('/me', auth_1.authMiddleware, (req, res) => {
    try {
        const userId = req.user.id;
        const userInfo = authService.getUserInfo(userId);
        return (0, response_1.success)(res, userInfo);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '获取用户信息失败';
        return (0, response_1.error)(res, message, 404);
    }
});
/**
 * PUT /api/auth/password
 *
 * 修改密码
 *
 * @header Authorization: Bearer <token>
 * @body {oldPassword, newPassword}
 */
router.put('/password', auth_1.authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    // 参数验证
    if (!oldPassword || !newPassword) {
        return (0, response_1.error)(res, '旧密码和新密码不能为空', 400);
    }
    try {
        const userId = req.user.id;
        await authService.changePassword(userId, oldPassword, newPassword);
        return (0, response_1.success)(res, null, '密码修改成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '密码修改失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/auth/logout
 *
 * 用户登出（客户端清除 Token 即可，服务端无状态）
 *
 * @header Authorization: Bearer <token>
 */
router.post('/logout', auth_1.authMiddleware, (req, res) => {
    // JWT 无状态，客户端清除 Token 即可
    // 如需实现 Token 黑名单，可在此添加逻辑
    return (0, response_1.success)(res, null, '登出成功');
});
/**
 * @openapi
 * /auth/status:
 *   get:
 *     tags: [Auth]
 *     summary: 获取认证系统状态
 *     description: 返回系统是否允许注册等信息
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/status', (req, res) => {
    return (0, response_1.success)(res, {
        allowRegister: config_1.default.features.allowRegister
    });
});
/**
 * GET /api/auth/codes
 *
 * 获取用户权限码
 *
 * @header Authorization: Bearer <token>
 * @returns 权限码数组
 */
router.get('/codes', auth_1.authMiddleware, (req, res) => {
    try {
        const role = req.user.role;
        // 根据角色返回权限码
        const roleCodes = {
            super: ['user', 'admin', 'super', 'config', 'system', 'upload', 'download', 'tasks'],
            admin: ['user', 'admin', 'config', 'system', 'upload', 'download', 'tasks'],
            user: ['user', 'upload', 'download', 'tasks']
        };
        const codes = roleCodes[role] || roleCodes.user;
        return (0, response_1.success)(res, codes);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '获取权限码失败';
        return (0, response_1.error)(res, message, 500);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map