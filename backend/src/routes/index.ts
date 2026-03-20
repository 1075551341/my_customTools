/**
 * 路由注册入口
 *
 * 汇总注册所有路由模块
 *
 * @module routes/index
 */

import { Router } from 'express'

// 导入各路由模块
import systemRoutes from './system'
import authRoutes from './auth'
import uploadRoutes from './upload'
import tasksRoutes from './tasks'
import queueRoutes from './queue'
import downloadRoutes from './download'
import configRoutes from './config'
import cleanRoutes from './clean'
import exportRoutes from './export'
import userRoutes from './user'
import menuRoutes from './menu'
import documentRoutes from './document'
import messageRoutes from './messages'

/**
 * 创建路由实例
 */
const router: Router = Router()

/**
 * 路由注册
 *
 * 所有路由统一前缀：/api
 */

// 系统路由（健康检查、系统状态）
router.use('/system', systemRoutes)

// 认证路由（注册、登录、刷新令牌）
router.use('/auth', authRoutes)

// 上传路由（分片上传、进度查询）
router.use('/upload', uploadRoutes)

// 任务路由（任务管理）
router.use('/tasks', tasksRoutes)

// 队列路由（队列管理）
router.use('/queue', queueRoutes)

// 下载路由（文件下载）
router.use('/download', downloadRoutes)

// 配置路由（系统配置管理）
router.use('/config', configRoutes)

// 清理路由（自动清理服务）
router.use('/clean', cleanRoutes)

// 导出路由（任务报告导出）
router.use('/export', exportRoutes)

// 用户路由（用户信息，兼容 Vben Admin）
router.use('/user', userRoutes)

// 菜单路由（菜单配置，兼容 Vben Admin）
router.use('/menu', menuRoutes)

// 文档路由（文档格式转换）
router.use('/document', documentRoutes)

export default router