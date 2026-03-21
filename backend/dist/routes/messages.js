"use strict";
/**
 * 消息推送路由模块
 *
 * 提供消息查询、标记已读、删除等接口
 *
 * @module routes/messages
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
const messagesDb = __importStar(require("../db/messages"));
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
const socket_1 = require("../socket");
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 获取消息列表（分页）
 *
 * GET /api/messages
 */
router.get("/", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const type = req.query.type;
        const isRead = req.query.isRead === "true"
            ? true
            : req.query.isRead === "false"
                ? false
                : undefined;
        const result = messagesDb.findPaginated({
            userId,
            type,
            isRead,
            page,
            pageSize,
        });
        return (0, response_1.success)(res, result);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取未读消息数量
 *
 * GET /api/messages/unread-count
 */
router.get("/unread-count", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        const count = messagesDb.getUnreadCount(userId);
        return (0, response_1.success)(res, { count });
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取最新 5 条消息（用于弹窗预览）
 *
 * GET /api/messages/latest
 */
router.get("/latest", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        const messages = messagesDb.getLatestMessages(userId, 5);
        return (0, response_1.success)(res, messages);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 标记单条消息为已读
 *
 * PUT /api/messages/:id/read
 */
router.put("/:id/read", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        const messageId = req.params.id;
        const success_flag = messagesDb.markAsRead(messageId, userId);
        if (!success_flag) {
            return response_1.errors.notFound(res, "消息不存在");
        }
        return (0, response_1.success)(res, { message: "已标记为已读" });
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 标记全部消息为已读
 *
 * PUT /api/messages/read-all
 */
router.put("/read-all", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        const count = messagesDb.markAllAsRead(userId);
        return (0, response_1.success)(res, { count });
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 删除单条消息
 *
 * DELETE /api/messages/:id
 */
router.delete("/:id", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        const messageId = req.params.id;
        const deleted = messagesDb.deleteMessage(messageId, userId);
        if (!deleted) {
            return response_1.errors.notFound(res, "消息不存在");
        }
        return (0, response_1.success)(res, { message: "删除成功" });
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 清空所有消息
 *
 * DELETE /api/messages/all
 */
router.delete("/all", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        const count = messagesDb.clearAll(userId);
        return (0, response_1.success)(res, { count });
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 创建消息（管理员或内部使用）
 *
 * POST /api/messages
 */
router.post("/", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return response_1.errors.unauthorized(res);
        }
        // 仅管理员可以创建消息
        if (req.user?.role !== "super" && req.user?.role !== "admin") {
            return response_1.errors.forbidden(res, "无权限创建消息");
        }
        const { userId: targetUserId, type, title, content, link } = req.body;
        if (!targetUserId || !type || !title || !content) {
            return response_1.errors.badRequest(res, "缺少必要参数");
        }
        const message = messagesDb.createMessage({
            userId: targetUserId,
            type,
            title,
            content,
            link,
            isRead: false,
        });
        // 通过 WebSocket 推送新消息通知
        socket_1.socketEmitter.emitMessagePush(targetUserId, message);
        return (0, response_1.success)(res, message);
    }
    catch (err) {
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map