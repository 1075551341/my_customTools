/**
 * 预设路由模块
 *
 * 提供转码预设管理接口
 *
 * @module routes/presets
 */

import { Router, Request, Response, NextFunction } from "express";
import * as presetsService from "../services/presets";
import { success, error } from "../utils/response";
import { authMiddleware } from "../middlewares/auth";

/**
 * 创建路由实例
 */
const router: Router = Router();

/**
 * 获取预设列表
 *
 * GET /api/presets
 * Query: type - 按类型过滤 (video|image|document)
 */
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const presets = presetsService.getList(type as string);
    return success(res, presets);
  } catch (err) {
    return next(err) as void;
  }
});

/**
 * 获取单个预设详情
 *
 * GET /api/presets/:id
 */
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const id: string = req.params.id as string;
    const preset = presetsService.getById(id);

    if (!preset) {
      return error(res, "预设不存在", 404);
    }

    return success(res, preset);
  } catch (err) {
    return next(err) as void;
  }
});

/**
 * 创建新预设
 *
 * POST /api/presets
 * Body: { name, type, config }
 */
router.post(
  "/",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, type, config } = req.body;

      if (!name || !type || !config) {
        return error(res, "缺少必要参数：name, type, config", 400);
      }

      if (!["video", "image", "document"].includes(type)) {
        return error(res, "无效的预设类型", 400);
      }

      const userId = (req as any).user?.id;
      const preset = presetsService.create(name, type, config, userId);

      return success(res, preset, "预设创建成功", 201);
    } catch (err) {
      const message = (err as Error).message;

      if (message.includes("不能") || message.includes("无效")) {
        return error(res, message, 400);
      }

      return next(err) as void;
    }
  },
);

/**
 * 更新预设
 *
 * PUT /api/presets/:id
 * Body: { name?, config? }
 */
router.put(
  "/:id",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id: string = req.params.id as string;
      const { name, config } = req.body;
      const userId = (req as any).user?.id;

      const preset = presetsService.getById(id);
      if (!preset) {
        return error(res, "预设不存在", 404);
      }

      const updated = presetsService.update(id, { name, config }, userId);
      if (!updated) {
        return error(res, "更新失败或无权限", 403);
      }

      return success(res, updated, "预设更新成功");
    } catch (err) {
      const message = (err as Error).message;

      if (message.includes("不能") || message.includes("必须")) {
        return error(res, message, 400);
      }

      return next(err) as void;
    }
  },
);

/**
 * 删除预设
 *
 * DELETE /api/presets/:id
 */
router.delete(
  "/:id",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id: string = req.params.id as string;
      const userId = (req as any).user?.id;

      const successFlag = presetsService.remove(id, userId);
      if (!successFlag) {
        return error(res, "删除失败：可能是系统预设或无权限", 403);
      }

      return success(res, null, "预设删除成功");
    } catch (err) {
      return next(err) as void;
    }
  },
);

export default router;
