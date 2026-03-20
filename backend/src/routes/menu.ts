/**
 * 菜单路由模块
 *
 * 提供菜单接口（兼容 Vben Admin）
 *
 * @module routes/menu
 */

import { Router, Request, Response, NextFunction } from 'express'
import { success, error } from '../utils/response'
import { authMiddleware } from '../middlewares/auth'

/**
 * 创建路由实例
 */
const router: Router = Router()

/**
 * 默认菜单配置
 */
const DEFAULT_MENUS = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: '/dashboard/index',
    meta: {
      title: '项目看板',
      icon: 'lucide:layout-dashboard'
    }
  },
  {
    path: '/video',
    name: 'Video',
    component: '/video/index',
    meta: {
      title: '视频转码',
      icon: 'lucide:video'
    }
  },
  {
    path: '/image',
    name: 'Image',
    component: '/image/index',
    meta: {
      title: '图片转码',
      icon: 'lucide:image'
    }
  },
  {
    path: '/document',
    name: 'Document',
    component: '/document/index',
    meta: {
      title: '文档转换',
      icon: 'lucide:file-text'
    }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: '/tasks/index',
    meta: {
      title: '任务管理',
      icon: 'lucide:list-todo'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: '/settings/index',
    meta: {
      title: '系统配置',
      icon: 'lucide:settings'
    }
  }
]

/**
 * 管理员菜单
 */
const ADMIN_MENUS = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: 'views/dashboard/index',
    meta: {
      title: '仪表盘',
      icon: 'mdi:view-dashboard'
    }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: 'views/tasks/index',
    meta: {
      title: '任务管理',
      icon: 'mdi:format-list-bulleted'
    }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: 'views/upload/index',
    meta: {
      title: '文件上传',
      icon: 'mdi:cloud-upload'
    }
  },
  {
    path: '/users',
    name: 'Users',
    component: 'views/users/index',
    meta: {
      title: '用户管理',
      icon: 'mdi:account-group'
    }
  },
  {
    path: '/config',
    name: 'Config',
    component: 'views/config/index',
    meta: {
      title: '系统配置',
      icon: 'mdi:cog'
    }
  },
  {
    path: '/system',
    name: 'System',
    component: 'views/system/index',
    meta: {
      title: '系统状态',
      icon: 'mdi:monitor'
    }
  }
]

/**
 * 获取用户菜单
 *
 * GET /api/menu/all
 */
router.get(
  '/all',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role

      // 根据角色返回不同菜单
      const menus = role === 'admin' ? ADMIN_MENUS : DEFAULT_MENUS

      return success(res, menus)
    } catch (err) {
      return next(err) as void
    }
  }
)

export default router