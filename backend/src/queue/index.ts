/**
 * 任务队列模块
 *
 * 使用 Bull + Redis 实现任务队列
 *
 * 功能说明：
 * - 创建和管理转码任务队列
 * - 提供任务添加、查询、控制等操作
 * - 支持任务优先级和并发控制
 *
 * @module queue
 */

import Queue from 'bull'
import config from '../config'
import logger from '../utils/logger'
import type { BaseTask } from '../types'

/**
 * 队列名称枚举
 */
export enum QueueName {
  VIDEO = 'video-transcode',
  IMAGE = 'image-transcode',
  ANIM = 'anim-transcode',
  DOCUMENT = 'document-transcode'
}

/**
 * 任务数据接口
 */
export interface TranscodeJobData {
  taskId: string
  type: 'video' | 'img' | 'anim' | 'document'
  userId: string
  inputPath: string
  outputPath: string
  config: Record<string, unknown>
}

/**
 * 任务进度接口
 */
export interface TranscodeJobProgress {
  taskId: string
  percent: number
  stage: string
  timestamp: number
}

/**
 * Redis 连接配置
 */
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined
}

/**
 * 视频转码队列
 *
 * 处理视频转码任务
 */
export const videoQueue = new Queue<TranscodeJobData>(QueueName.VIDEO, {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 50,
    timeout: 3600000 // 1小时超时
  }
})

/**
 * 图片转码队列
 *
 * 处理图片转码任务
 */
export const imageQueue = new Queue<TranscodeJobData>(QueueName.IMAGE, {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 2000
    },
    removeOnComplete: 200,
    removeOnFail: 100,
    timeout: 300000 // 5分钟超时
  }
})

/**
 * 动图转码队列
 *
 * 处理 GIF/WebP 动图转码任务
 */
export const animQueue = new Queue<TranscodeJobData>(QueueName.ANIM, {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 2000
    },
    removeOnComplete: 200,
    removeOnFail: 100,
    timeout: 600000 // 10分钟超时
  }
})

/**
 * 文档转码队列
 *
 * 处理文档格式转换任务
 */
export const documentQueue = new Queue<TranscodeJobData>(QueueName.DOCUMENT, {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 2000
    },
    removeOnComplete: 200,
    removeOnFail: 100,
    timeout: 300000 // 5分钟超时
  }
})

/**
 * 队列映射表
 *
 * 根据任务类型获取对应队列
 */
const queueMap: Record<string, Queue.Queue<TranscodeJobData>> = {
  video: videoQueue,
  img: imageQueue,
  anim: animQueue,
  document: documentQueue
}

/**
 * 添加转码任务到队列
 *
 * @param task - 任务信息
 * @returns Bull Job 实例
 */
export async function addTranscodeJob(task: BaseTask): Promise<Queue.Job<TranscodeJobData>> {
  const queue = queueMap[task.type]

  if (!queue) {
    throw new Error(`不支持的任务类型: ${task.type}`)
  }

  const jobData: TranscodeJobData = {
    taskId: task.id,
    type: task.type,
    userId: task.userId,
    inputPath: task.inputPath,
    outputPath: task.outputPath,
    config: task.config
  }

  const job = await queue.add(jobData, {
    jobId: task.id,
    priority: 0
  })

  logger.info('转码任务已加入队列', {
    taskId: task.id,
    jobId: job.id,
    type: task.type
  })

  return job
}

/**
 * 取消转码任务
 *
 * @param taskId - 任务ID
 * @param type - 任务类型
 * @returns 是否取消成功
 */
export async function cancelTranscodeJob(taskId: string, type: 'video' | 'img' | 'anim' | 'document'): Promise<boolean> {
  const queue = queueMap[type]

  if (!queue) {
    return false
  }

  const job = await queue.getJob(taskId)

  if (!job) {
    return false
  }

  // 如果任务正在处理，标记为需要停止
  if (await job.isActive()) {
    // Worker 会检查这个状态并停止处理
    await job.moveToFailed(new Error('用户取消'), true)
  } else {
    await job.remove()
  }

  logger.info('转码任务已取消', { taskId, type })

  return true
}

/**
 * 获取队列统计信息
 *
 * @returns 各队列的任务统计
 */
export async function getQueueStats(): Promise<{
  video: { waiting: number; active: number; completed: number; failed: number }
  image: { waiting: number; active: number; completed: number; failed: number }
  anim: { waiting: number; active: number; completed: number; failed: number }
  document: { waiting: number; active: number; completed: number; failed: number }
}> {
  const [videoCounts, imageCounts, animCounts, documentCounts] = await Promise.all([
    videoQueue.getJobCounts(),
    imageQueue.getJobCounts(),
    animQueue.getJobCounts(),
    documentQueue.getJobCounts()
  ])

  return {
    video: {
      waiting: videoCounts.waiting || 0,
      active: videoCounts.active || 0,
      completed: videoCounts.completed || 0,
      failed: videoCounts.failed || 0
    },
    image: {
      waiting: imageCounts.waiting || 0,
      active: imageCounts.active || 0,
      completed: imageCounts.completed || 0,
      failed: imageCounts.failed || 0
    },
    anim: {
      waiting: animCounts.waiting || 0,
      active: animCounts.active || 0,
      completed: animCounts.completed || 0,
      failed: animCounts.failed || 0
    },
    document: {
      waiting: documentCounts.waiting || 0,
      active: documentCounts.active || 0,
      completed: documentCounts.completed || 0,
      failed: documentCounts.failed || 0
    }
  }
}

/**
 * 暂停队列
 *
 * @param type - 队列类型
 */
export async function pauseQueue(type: 'video' | 'img' | 'anim' | 'document'): Promise<void> {
  const queue = queueMap[type]
  if (queue) {
    await queue.pause()
    logger.info(`队列已暂停: ${type}`)
  }
}

/**
 * 恢复队列
 *
 * @param type - 队列类型
 */
export async function resumeQueue(type: 'video' | 'img' | 'anim' | 'document'): Promise<void> {
  const queue = queueMap[type]
  if (queue) {
    await queue.resume()
    logger.info(`队列已恢复: ${type}`)
  }
}

/**
 * 清空队列
 *
 * @param type - 队列类型
 */
export async function clearQueue(type: 'video' | 'img' | 'anim' | 'document'): Promise<void> {
  const queue = queueMap[type]
  if (queue) {
    await queue.empty()
    logger.info(`队列已清空: ${type}`)
  }
}

/**
 * 关闭所有队列
 *
 * 优雅关闭队列连接
 */
export async function closeQueues(): Promise<void> {
  await Promise.all([
    videoQueue.close(),
    imageQueue.close(),
    animQueue.close(),
    documentQueue.close()
  ])
  logger.info('所有队列已关闭')
}

/**
 * 初始化队列事件监听
 */
export function initQueueEvents(): void {
  const queues = [
    { name: 'video', queue: videoQueue },
    { name: 'image', queue: imageQueue },
    { name: 'anim', queue: animQueue },
    { name: 'document', queue: documentQueue }
  ]

  queues.forEach(({ name, queue }) => {
    queue.on('error', (error: Error) => {
      logger.error(`队列错误 [${name}]`, { error: error.message })
    })

    queue.on('waiting', (jobId: string) => {
      logger.debug(`任务等待中 [${name}]`, { jobId })
    })

    queue.on('active', (job: Queue.Job<TranscodeJobData>) => {
      logger.info(`任务开始处理 [${name}]`, { taskId: job.data.taskId })
    })

    queue.on('completed', (job: Queue.Job<TranscodeJobData>) => {
      logger.info(`任务处理完成 [${name}]`, { taskId: job.data.taskId })
    })

    queue.on('failed', (job: Queue.Job<TranscodeJobData> | undefined, error: Error) => {
      if (job) {
        logger.error(`任务处理失败 [${name}]`, {
          taskId: job.data.taskId,
          error: error.message
        })
      }
    })

    queue.on('stalled', (job: Queue.Job<TranscodeJobData>) => {
      logger.warn(`任务停滞 [${name}]`, { taskId: job.data.taskId })
    })
  })

  logger.info('队列事件监听已初始化')
}