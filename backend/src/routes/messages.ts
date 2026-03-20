/**
 * 消息推送路由模块
 *
 * 提供消息查询、标记已读、删除等接口
 *
 * @module routes/messages
 */

import { Router, Request, Response, NextFunction } from "express";
import * as messagesDb from "../db/messages";
import { success, error, errors } from "../utils/response";
import { authMiddleware } from "../middlewares/auth";
import { socketEmitter } from "../socket";
import type { Message, MessageType } from "../types";

/**
 * 创建路由实例
 */
const router = Router();

/**
 * 获取消息列表（分页）
 *
 * GET /api/messages
 */
router.get(
  "/messages",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const type = req.query.type as MessageType | undefined;
      const isRead =
        req.query.isRead === "true"
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

      return success(res, result);
    } catch (err) {
      return next(err) as void;
    }
  },
);

/**
 * 获取未读消息数量
 *
 * GET /api/messages/unread-count
 */
router.get(
  "/messages/unread-count",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      const count = messagesDb.getUnreadCount(userId);
      return success(res, { count });
    } catch (err) {
      return next(err) as void;
    }
  },
);

/**
 * 获取最新 5 条消息（用于弹窗预览）
 *
 * GET /api/messages/latest
 */
router.get(
  "/messages/latest",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      const messages = messagesDb.getLatestMessages(userId, 5);
      return success(res, messages);
    } catch (err) {
      return next(err) as void;
    }
  },
);

/**
 * 标记单条消息为已读
 *
 * PUT /api/messages/:id/read
 */
router.put(
  "/messages/:id/read",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      const messageId = req.params.id as string;
      const success_flag = messagesDb.markAsRead(messageId, userId);

      if (!success_flag) {
        return errors.notFound(res, "消息不存在");
      }

      return success(res, { message: "已标记为已读" });
    } catch (err) {
      return next(err) as void;
    }
  },
);

/**
 * 标记全部消息为已读
 *
 * PUT /api/messages/read-all
 */
router.put(
  "/messages/read-all",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      const count = messagesDb.markAllAsRead(userId);
      return success(res, { count });
    } catch (err) {
      return next(err) as void;
    }
  },
);

/**
 * 删除单条消息
 *
 * DELETE /api/messages/:id
 */
router.delete(
  "/messages/:id",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      const messageId = req.params.id as string;
      const deleted = messagesDb.deleteMessage(messageId, userId);

      if (!deleted) {
        return errors.notFound(res, "消息不存在");
      }

      return success(res, { message: "删除成功" });
    } catch (err) {
      return next(err) as void;
    }
  },
);

/**
 * 清空所有消息
 *
 * DELETE /api/messages/all
 */
router.delete(
  "/messages/all",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      const count = messagesDb.clearAll(userId);
      return success(res, { count });
    } catch (err) {
      return next(err) as void;
    }
  },
);

/**
 * 创建消息（管理员或内部使用）
 *
 * POST /api/messages
 */
router.post(
  "/messages",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errors.unauthorized(res);
      }

      // 仅管理员可以创建消息
      if (req.user?.role !== "super" && req.user?.role !== "admin") {
        return errors.forbidden(res, "无权限创建消息");
      }

      const { userId: targetUserId, type, title, content, link } = req.body;

      if (!targetUserId || !type || !title || !content) {
        return errors.badRequest(res, "缺少必要参数");
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
      socketEmitter.emitMessagePush(targetUserId, message);

      return success(res, message);
    } catch (err) {
      return next(err) as void;
    }
  },
);

export default router;
