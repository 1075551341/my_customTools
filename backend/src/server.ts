/**
 * HTTP 服务器启动入口
 *
 * 负责启动 HTTP 服务器和初始化 Socket.io
 *
 * 功能说明：
 * - 创建 HTTP 服务器
 * - 初始化 Socket.io（实时通信）
 * - 创建必要的目录结构
 * - 启动服务监听
 *
 * @module server
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import createApp from './app'
import config from './config'
import logger from './utils/logger'
import { initWorkers, stopWorkers } from './workers'
import { closeQueues } from './queue'
import { startScheduledClean, stopScheduledClean } from './services/clean'
import type { JwtPayload } from './types'

// 初始化数据库（必须在其他模块之前）
import './db/sqlite'
import './db/redis'
import { runMigrations } from './db/migrate'

/**
 * 创建必要的目录结构
 *
 * 确保数据、上传、输出、日志目录存在
 */
function ensureDirectories(): void {
  const directories = [
    config.storage.uploadDir,
    path.join(config.storage.uploadDir, 'chunks'),
    path.join(config.storage.uploadDir, 'complete'),
    config.storage.outputDir,
    path.join(config.storage.outputDir, 'video'),
    path.join(config.storage.outputDir, 'img'),
    config.storage.dataDir,
    config.storage.logDir
  ]

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      logger.info(`创建目录: ${dir}`)
    }
  })
}

/**
 * 扩展 Socket 类型以包含用户信息
 */
interface AuthenticatedSocket extends Socket {
  userId?: string
}

/**
 * 初始化 Socket.io
 *
 * 配置 WebSocket 实时通信
 *
 * @param server - HTTP 服务器实例
 * @returns Socket.io 服务器实例
 */
function initSocketIO(server: http.Server): Server {
  const io = new Server(server, {
    cors: {
      origin: config.cors.origins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // 连接配置
    pingTimeout: 60000, // 60秒无响应断开
    pingInterval: 25000 // 25秒发送一次心跳
  })

  /**
   * Socket.io 认证中间件
   *
   * 验证客户端连接时携带的 JWT Token
   */
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      // 开发环境允许无 token 连接（方便调试）
      if (config.server.nodeEnv === 'development') {
        logger.warn('Socket 连接未携带 token（开发模式允许）')
        socket.userId = 'dev-user'
        return next()
      }
      return next(new Error('未授权的连接'))
    }

    // 验证 JWT Token
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
      socket.userId = decoded.id
      next()
    } catch (err) {
      logger.warn('Socket 连接 token 验证失败', { error: (err as Error).message })
      next(new Error('无效的认证令牌'))
    }
  })

  /**
   * 连接事件处理
   */
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Socket 客户端连接', {
      socketId: socket.id,
      userId: socket.userId
    })

    // 加入用户专属房间（用于进度推送）
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
      logger.debug('用户加入房间', { room: `user:${socket.userId}` })
    }

    // 断开连接
    socket.on('disconnect', (reason: string) => {
      logger.info('Socket 客户端断开', {
        socketId: socket.id,
        userId: socket.userId,
        reason
      })
    })

    // 错误处理
    socket.on('error', (error: Error) => {
      logger.error('Socket 错误', {
        socketId: socket.id,
        error: error.message
      })
    })

    // 订阅任务进度
    socket.on('subscribe:task', (taskId: string) => {
      socket.join(`task:${taskId}`)
      logger.debug('订阅任务进度', { taskId, socketId: socket.id })
    })

    // 取消订阅任务进度
    socket.on('unsubscribe:task', (taskId: string) => {
      socket.leave(`task:${taskId}`)
      logger.debug('取消订阅任务进度', { taskId, socketId: socket.id })
    })
  })

  return io
}

/**
 * 主函数
 *
 * 启动服务器
 */
function main(): void {
  // 创建必要的目录
  ensureDirectories()

  // 运行数据迁移（JSON -> SQLite）
  runMigrations()

  // 创建 Express 应用
  const app = createApp()

  // 创建 HTTP 服务器
  const server = http.createServer(app)

  // 初始化 Socket.io
  const io = initSocketIO(server)

  // 将 io 实例挂载到 app 上，供其他模块使用
  app.set('io', io)

  // 初始化转码工作进程
  initWorkers(app)

  // 启动定时清理任务（每天凌晨 3 点执行）
  startScheduledClean('0 3 * * *')

  // 启动服务器
  const PORT = config.server.port

  server.listen(PORT, () => {
    logger.info('=================================')
    logger.info('  my-customTools 后端服务启动成功')
    logger.info('=================================')
    logger.info(`端口: ${PORT}`)
    logger.info(`环境: ${config.server.nodeEnv}`)
    logger.info(`地址: ${config.server.baseUrl}`)
    logger.info(`API 文档: ${config.server.baseUrl}/api/system/health`)
    logger.info('---------------------------------')
  })

  // 优雅关闭
  process.on('SIGTERM', async () => {
    logger.info('收到 SIGTERM 信号，开始优雅关闭...')

    // 停止工作进程
    await stopWorkers()

    // 停止定时清理任务
    stopScheduledClean()

    // 关闭队列
    await closeQueues()

    // 关闭 Socket.io
    io.close(() => {
      logger.info('Socket.io 已关闭')
    })

    // 关闭 HTTP 服务器
    server.close(() => {
      logger.info('HTTP 服务器已关闭')
      process.exit(0)
    })
  })

  process.on('SIGINT', async () => {
    logger.info('收到 SIGINT 信号，开始优雅关闭...')

    // 停止工作进程
    await stopWorkers()

    // 停止定时清理任务
    stopScheduledClean()

    // 关闭队列
    await closeQueues()

    io.close(() => {
      logger.info('Socket.io 已关闭')
    })

    server.close(() => {
      logger.info('HTTP 服务器已关闭')
      process.exit(0)
    })
  })

  // 未捕获异常处理
  process.on('uncaughtException', (error: Error) => {
    logger.error('未捕获的异常', {
      error: error.message,
      stack: error.stack
    })
    process.exit(1)
  })

  process.on('unhandledRejection', (reason: Error | null | undefined) => {
    logger.error('未处理的 Promise 拒绝', {
      reason: reason?.message || reason,
      stack: reason?.stack
    })
  })
}

// 启动服务
main()