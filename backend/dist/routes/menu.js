"use strict";
/**
 * 菜单路由模块
 *
 * 提供菜单接口（兼容 Vben Admin）
 *
 * @module routes/menu
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 默认菜单配置
 */
const DEFAULT_MENUS = [
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
        path: '/config',
        name: 'Config',
        component: 'views/config/index',
        meta: {
            title: '系统配置',
            icon: 'mdi:cog'
        }
    }
];
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
];
/**
 * 获取用户菜单
 *
 * GET /api/menu/all
 */
router.get('/all', auth_1.authMiddleware, (req, res, next) => {
    try {
        const role = req.user?.role;
        // 根据角色返回不同菜单
        const menus = role === 'admin' ? ADMIN_MENUS : DEFAULT_MENUS;
        return (0, response_1.success)(res, menus);
    }
    catch (err) {
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=menu.js.map