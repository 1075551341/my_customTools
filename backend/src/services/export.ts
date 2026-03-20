/**
 * 任务导出服务模块
 *
 * 提供任务报告导出功能（JSON/CSV）
 *
 * @module services/export
 */

import * as tasksDb from '../db/tasks'
import type { BaseTask, TaskStatus, TaskType } from '../types'

/**
 * 导出选项
 */
export interface ExportOptions {
  userId?: string
  status?: TaskStatus
  type?: TaskType
  format: 'json' | 'csv'
  startDate?: string
  endDate?: string
}

/**
 * 导出结果
 */
export interface ExportResult {
  content: string
  fileName: string
  mimeType: string
  count: number
}

/**
 * 导出任务报告为 JSON
 *
 * @param tasks - 任务列表
 * @returns JSON 字符串
 */
function exportToJson(tasks: BaseTask[]): string {
  return JSON.stringify(tasks, null, 2)
}

/**
 * 导出任务报告为 CSV
 *
 * @param tasks - 任务列表
 * @returns CSV 字符串
 */
function exportToCsv(tasks: BaseTask[]): string {
  // CSV 表头
  const headers = [
    'ID',
    '类型',
    '文件名',
    '文件大小',
    '输入格式',
    '输出格式',
    '状态',
    '进度',
    '创建时间',
    '开始时间',
    '完成时间',
    '错误信息'
  ]

  // CSV 行
  const rows = tasks.map(task => [
    task.id,
    task.type,
    task.fileName,
    task.fileSize,
    task.inputFormat,
    task.outputFormat,
    task.status,
    task.progress,
    task.createdAt,
    task.startedAt || '',
    task.completedAt || '',
    task.errorMsg || ''
  ])

  // 转义 CSV 字段（处理包含逗号、引号、换行的内容）
  const escapeCsvField = (field: string | number): string => {
    const str = String(field)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // 组装 CSV
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ]

  return csvLines.join('\n')
}

/**
 * 导出任务报告
 *
 * @param options - 导出选项
 * @returns 导出结果
 */
export function exportTasks(options: ExportOptions): ExportResult {
  // 获取任务列表
  const allTasks = tasksDb.findAll()

  // 过滤任务
  let filteredTasks = allTasks

  // 用户过滤
  if (options.userId) {
    filteredTasks = filteredTasks.filter(t => t.userId === options.userId)
  }

  // 状态过滤
  if (options.status) {
    filteredTasks = filteredTasks.filter(t => t.status === options.status)
  }

  // 类型过滤
  if (options.type) {
    filteredTasks = filteredTasks.filter(t => t.type === options.type)
  }

  // 日期范围过滤
  if (options.startDate) {
    const startTime = new Date(options.startDate).getTime()
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt).getTime() >= startTime)
  }

  if (options.endDate) {
    const endTime = new Date(options.endDate).getTime()
    filteredTasks = filteredTasks.filter(t => new Date(t.createdAt).getTime() <= endTime)
  }

  // 按创建时间排序
  filteredTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // 导出
  const timestamp = new Date().toISOString().split('T')[0]
  let content: string
  let fileName: string
  let mimeType: string

  if (options.format === 'json') {
    content = exportToJson(filteredTasks)
    fileName = `tasks_export_${timestamp}.json`
    mimeType = 'application/json'
  } else {
    content = exportToCsv(filteredTasks)
    fileName = `tasks_export_${timestamp}.csv`
    mimeType = 'text/csv'
  }

  return {
    content,
    fileName,
    mimeType,
    count: filteredTasks.length
  }
}

/**
 * 获取导出统计
 *
 * @param userId - 用户ID
 * @returns 统计信息
 */
export function getExportStats(userId?: string): {
  total: number
  byStatus: Record<TaskStatus, number>
  byType: Record<TaskType, number>
} {
  const tasks = userId ? tasksDb.findByUserId(userId) : tasksDb.findAll()
  const stats = tasksDb.getStats(userId)

  const byType: Record<TaskType, number> = {
    video: 0,
    img: 0,
    anim: 0,
    document: 0
  }

  tasks.forEach(task => {
    byType[task.type]++
  })

  return {
    total: tasks.length,
    byStatus: stats,
    byType
  }
}