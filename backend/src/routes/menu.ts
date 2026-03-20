/**
 * 菜单路由模块
 *
 * 提供菜单接口（兼容 Vben Admin）
 *
 * @module routes/menu
 */

import { Router, Request, Response, NextFunction } from "express";
import { success, error } from "../utils/response";
import { authMiddleware } from "../middlewares/auth";

/**
 * 创建路由实例
 */
const router: Router = Router();

/**
 * 默认菜单配置
 */
const DEFAULT_MENUS = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: "/dashboard/index",
    meta: {
      title: "中心看板",
      icon: "lucide:layout-dashboard",
    },
  },
  {
    path: "/video",
    name: "Video",
    component: "/video/index",
    meta: {
      title: "视频转码",
      icon: "lucide:video",
    },
  },
  {
    path: "/image",
    name: "Image",
    component: "/image/index",
    meta: {
      title: "图片转码",
      icon: "lucide:image",
    },
  },
  {
    path: "/document",
    name: "Document",
    component: "/document/index",
    meta: {
      title: "文档转换",
      icon: "lucide:file-text",
    },
  },
  {
    path: "/tasks",
    name: "Tasks",
    component: "/tasks/index",
    meta: {
      title: "任务管理",
      icon: "lucide:list-todo",
    },
  },
  {
    path: "/settings",
    name: "Settings",
    component: "/settings/index",
    meta: {
      title: "系统配置",
      icon: "lucide:settings",
    },
  },
  {
    path: "/upload",
    name: "Upload",
    component: "/upload/index",
    meta: {
      title: "文件上传",
      icon: "lucide:upload",
    },
  },
];

/**
 * 管理员菜单
 */
const ADMIN_MENUS = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: "/dashboard/index",
    meta: {
      title: "中心看板",
      icon: "lucide:layout-dashboard",
    },
  },
  {
    path: "/video",
    name: "Video",
    component: "/video/index",
    meta: {
      title: "视频转码",
      icon: "lucide:video",
    },
  },
  {
    path: "/image",
    name: "Image",
    component: "/image/index",
    meta: {
      title: "图片转码",
      icon: "lucide:image",
    },
  },
  {
    path: "/document",
    name: "Document",
    component: "/document/index",
    meta: {
      title: "文档转换",
      icon: "lucide:file-text",
    },
  },
  {
    path: "/tasks",
    name: "Tasks",
    component: "/tasks/index",
    meta: {
      title: "任务管理",
      icon: "lucide:list-todo",
    },
  },
  {
    path: "/settings",
    name: "Settings",
    component: "/settings/index",
    meta: {
      title: "系统配置",
      icon: "lucide:settings",
    },
  },
  {
    path: "/upload",
    name: "Upload",
    component: "/upload/index",
    meta: {
      title: "文件上传",
      icon: "lucide:upload",
    },
  },
];

/**
 * 获取用户菜单
 *
 * GET /api/menu/all
 */
router.get(
  "/all",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role;

      // 根据角色返回不同菜单
      const menus = role === "admin" ? ADMIN_MENUS : DEFAULT_MENUS;

      return success(res, menus);
    } catch (err) {
      return next(err) as void;
    }
  },
);

export default router;
