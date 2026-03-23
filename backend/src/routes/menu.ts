/**
 * 菜单路由模块
 *
 * 提供动态菜单接口，支持角色权限控制
 *
 * @module routes/menu
 */

import { Router, Request, Response, NextFunction } from "express";
import { success, error } from "../utils/response";
import { authMiddleware } from "../middlewares/auth";
import * as menusDb from "../db/menus";
import * as permissionsDb from "../db/permissions";

/**
 * 创建路由实例
 */
const router: Router = Router();

/**
 * 获取当前用户菜单
 *
 * GET /api/menu/all
 */
router.get(
  "/all",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role || "user";
      const menus = menusDb.getMenusByRole(role);
      return success(res, menus);
    } catch (err) {
      return next(err) as void;
    }
  }
);

/**
 * 获取当前用户权限码
 *
 * GET /api/menu/permissions
 */
router.get(
  "/permissions",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role || "user";
      const codes = permissionsDb.getPermissionCodesByRole(role);
      return success(res, codes);
    } catch (err) {
      return next(err) as void;
    }
  }
);

/**
 * 获取所有菜单（管理员用）
 *
 * GET /api/menu/admin/all
 */
router.get(
  "/admin/all",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role;
      if (role !== "admin" && role !== "super") {
        return error(res, "权限不足", 403);
      }
      const menus = menusDb.getAllMenus();
      return success(res, menus);
    } catch (err) {
      return next(err) as void;
    }
  }
);

/**
 * 获取所有权限（管理员用）
 *
 * GET /api/menu/admin/permissions
 */
router.get(
  "/admin/permissions",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role;
      if (role !== "admin" && role !== "super") {
        return error(res, "权限不足", 403);
      }
      const permissions = permissionsDb.getAllPermissions();
      return success(res, permissions);
    } catch (err) {
      return next(err) as void;
    }
  }
);

export default router;
