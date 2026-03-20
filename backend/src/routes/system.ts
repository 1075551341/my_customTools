/**
 * 系统路由
 *
 * 提供系统状态和健康检查接口
 *
 * @module routes/system
 */

import { Router, Request, Response } from 'express'
import { success } from '../utils/response'
import { getQueueStats } from '../queue'
import type { SystemStatus } from '../types'

const router: Router = Router()

/**
 * GET /api/system/health
 *
 * 健康检查接口（无需认证）
 *
 * 用于负载均衡器、监控系统或容器编排系统（如 Kubernetes）检测服务是否存活
 *
 * @returns 健康状态
 * - status: 'ok' | 'error'
 * - timestamp: 当前时间戳
 * - uptime: 服务运行时间（秒）
 */
router.get('/health', (req: Request, res: Response) => {
  const healthData = {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }

  return success(res, healthData, '服务正常')
})

/**
 * GET /api/system/status
 *
 * 获取系统资源状态（需要认证）
 *
 * 返回 CPU、内存、磁盘、队列使用情况
 *
 * @returns 系统状态
 * - cpu: CPU 使用率
 * - memory: 内存使用情况
 * - disk: 磁盘使用情况
 * - queue: 队列状态
 */
router.get('/status', async (req: Request, res: Response) => {
  // 获取队列状态（带超时）
  const getQueueStatsWithTimeout = async () => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Queue stats timeout')), 3000)
      })
      const statsPromise = getQueueStats()
      return await Promise.race([statsPromise, timeoutPromise])
    } catch {
      return null
    }
  }

  // 并行获取系统信息和队列状态
  const [si, queueStats] = await Promise.all([
    import('systeminformation').catch(() => null),
    getQueueStatsWithTimeout()
  ])

  // 默认队列状态
  const defaultQueueStats = {
    video: { waiting: 0, active: 0, completed: 0, failed: 0 },
    image: { waiting: 0, active: 0, completed: 0, failed: 0 },
    anim: { waiting: 0, active: 0, completed: 0, failed: 0 }
  }

  // 基础状态（队列信息）
  const baseStatus: Partial<SystemStatus> = {
    queue: queueStats || defaultQueueStats,
    timestamp: new Date().toISOString()
  }

  if (!si) {
    // 如果无法加载 systeminformation，返回基本信息
    const basicInfo: SystemStatus = {
      cpu: { usage: 'N/A' },
      memory: {
        total: 'N/A',
        used: 'N/A',
        free: 'N/A'
      },
      disk: 'N/A',
      ...baseStatus
    } as SystemStatus
    return success(res, basicInfo)
  }

  try {
    // 获取 CPU 使用率
    const cpu = await si.currentLoad()

    // 获取内存信息
    const memory = await si.mem()

    // 获取磁盘信息（只取第一个磁盘）
    const disk = await si.fsSize()

    const statusData: SystemStatus = {
      cpu: {
        usage: cpu.currentLoad,
        cores: cpu.cpus.length
      },
      memory: {
        total: memory.total,
        used: memory.used,
        free: memory.free,
        usage: (memory.used / memory.total) * 100
      },
      disk: disk.length > 0 ? {
        fs: disk[0].fs,
        total: disk[0].size,
        used: disk[0].used,
        usage: disk[0].use
      } : { fs: 'N/A', total: 0, used: 0, usage: 0 },
      ...baseStatus
    } as SystemStatus

    return success(res, statusData)
  } catch {
    // 获取失败时返回基本信息
    const basicInfo: SystemStatus = {
      cpu: { usage: 'N/A' },
      memory: {
        total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        free: 'N/A'
      },
      disk: 'N/A',
      ...baseStatus
    } as SystemStatus
    return success(res, { ...basicInfo, error: '无法获取完整系统信息' })
  }
})

export default router