/**
 * 转码预设数据持久化模块
 *
 * 使用 SQLite 数据库存储预设配置
 *
 * @module db/presets
 */

import db from './sqlite'
import logger from '../utils/logger'

/**
 * 预设配置接口
 */
export interface PresetConfig {
  // 视频预设配置
  codec?: string
  resolution?: string
  bitrate?: string
  fps?: number
  // 图片预设配置
  format?: string
  quality?: number
  width?: number
  height?: number
  // 文档预设配置
  targetFormat?: string
  merge?: boolean
}

/**
 * 预设数据接口
 */
export interface Preset {
  id: string
  name: string
  type: 'video' | 'image' | 'document'
  config: PresetConfig
  isSystem: boolean
  userId?: string
  createdAt: string
  updatedAt: string
}

/**
 * 初始化预设表
 */
export function initPresetsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('video', 'image', 'document')),
      config TEXT NOT NULL,
      isSystem INTEGER DEFAULT 0,
      userId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(name, type, userId)
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_type ON presets(type)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_user ON presets(userId)
  `)

  logger.info('预设表初始化完成')
}

/**
 * 获取所有预设
 *
 * @param type - 按类型过滤（可选）
 * @returns 预设列表
 */
export function getAllPresets(type?: string): Preset[] {
  let sql = 'SELECT * FROM presets'
  const params: any[] = []

  if (type) {
    sql += ' WHERE type = ?'
    params.push(type)
  }

  sql += ' ORDER BY isSystem DESC, name ASC'

  const rows = db.prepare(sql).all(...params) as any[]
  return rows.map(row => ({
    ...row,
    config: JSON.parse(row.config) as PresetConfig,
    isSystem: row.isSystem === 1,
  }))
}

/**
 * 获取单个预设
 *
 * @param id - 预设 ID
 * @returns 预设对象或 undefined
 */
export function getPresetById(id: string): Preset | undefined {
  const row = db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as any
  if (!row) return undefined

  return {
    ...row,
    config: JSON.parse(row.config) as PresetConfig,
    isSystem: row.isSystem === 1,
  }
}

/**
 * 创建预设
 *
 * @param preset - 预设数据（不含 id、createdAt、updatedAt）
 * @returns 创建的预设
 */
export function createPreset(
  preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>
): Preset {
  const id = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO presets (id, name, type, config, isSystem, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    preset.name,
    preset.type,
    JSON.stringify(preset.config),
    preset.isSystem ? 1 : 0,
    preset.userId,
    now,
    now
  )

  logger.info('创建预设', { id, name: preset.name, type: preset.type })

  return {
    ...preset,
    id,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 更新预设
 *
 * @param id - 预设 ID
 * @param updates - 要更新的字段
 * @returns 更新后的预设或 undefined
 */
export function updatePreset(
  id: string,
  updates: Partial<Preset>
): Preset | undefined {
  const preset = getPresetById(id)
  if (!preset) {
    logger.warn('更新预设失败：预设不存在', { id })
    return undefined
  }

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(JSON.stringify(updates.config))
  }
  if (updates.isSystem !== undefined) {
    fields.push('isSystem = ?')
    values.push(updates.isSystem ? 1 : 0)
  }

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.prepare(`UPDATE presets SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  logger.info('更新预设', { id, updates })

  return {
    ...preset,
    ...updates,
    updatedAt: now,
  }
}

/**
 * 删除预设
 *
 * @param id - 预设 ID
 * @returns 是否删除成功
 */
export function deletePreset(id: string): boolean {
  const preset = getPresetById(id)
  if (!preset) {
    logger.warn('删除预设失败：预设不存在', { id })
    return false
  }

  if (preset.isSystem) {
    logger.warn('删除预设失败：系统预设不可删除', { id })
    return false
  }

  db.prepare('DELETE FROM presets WHERE id = ?').run(id)
  logger.info('删除预设', { id })

  return true
}

/**
 * 初始化系统预设
 *
 * 应用启动时自动调用，创建内置预设模板
 */
export function initSystemPresets() {
  const systemPresets = [
    {
      name: '视频 - 通用 H.264',
      type: 'video' as const,
      config: { codec: 'h264', resolution: '1080p', bitrate: '5000k', fps: 30 },
      isSystem: true,
    },
    {
      name: '视频 - 高清 H.265',
      type: 'video' as const,
      config: { codec: 'h265', resolution: '1080p', bitrate: '3000k', fps: 30 },
      isSystem: true,
    },
    {
      name: '视频 - 标清 H.264',
      type: 'video' as const,
      config: { codec: 'h264', resolution: '480p', bitrate: '1500k', fps: 24 },
      isSystem: true,
    },
    {
      name: '图片 - WebP 高质量',
      type: 'image' as const,
      config: { format: 'webp', quality: 90 },
      isSystem: true,
    },
    {
      name: '图片 - JPEG 压缩',
      type: 'image' as const,
      config: { format: 'jpeg', quality: 80 },
      isSystem: true,
    },
    {
      name: '图片 - PNG 无损',
      type: 'image' as const,
      config: { format: 'png', quality: 100 },
      isSystem: true,
    },
    {
      name: '文档 - Word 转 PDF',
      type: 'document' as const,
      config: { targetFormat: 'pdf' },
      isSystem: true,
    },
    {
      name: '文档 - Excel 转 CSV',
      type: 'document' as const,
      config: { targetFormat: 'csv' },
      isSystem: true,
    },
  ]

  let created = 0
  for (const preset of systemPresets) {
    try {
      createPreset({ ...preset, config: preset.config, userId: undefined })
      created++
    } catch (e) {
      // 已存在则跳过
    }
  }

  logger.info(`系统预设初始化完成，新增 ${created}/${systemPresets.length} 个预设`)
}
