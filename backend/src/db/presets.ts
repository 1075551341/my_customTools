/**
 * 转码预设数据持久化模块
 *
 * 使用 SQLite 数据库存储预设配置
 *
 * @module db/presets
 */

import type { Database } from "better-sqlite3";
import logger from "../utils/logger";

// db 将通过 initDb 函数注入，避免循环依赖
let db: Database;

/**
 * 预设配置接口
 */
export interface PresetConfig {
  // 视频预设配置
  codec?: string;
  resolution?: string;
  bitrate?: string;
  fps?: number;
  crf?: number;
  audioCodec?: string;
  // 图片预设配置
  format?: string;
  quality?: number;
  width?: number;
  height?: number;
  // 文档预设配置
  targetFormat?: string;
  merge?: boolean;
}

/**
 * 预设参数范围配置接口
 */
export interface PresetConfigRange {
  // 视频范围配置
  codec?: { options: string[]; default: string };
  resolution?: { options: string[]; default: string };
  bitrate?: { min: string; max: string; default: string; unit: string };
  fps?: { min: number; max: number; default: number; options: number[] };
  crf?: { min: number; max: number; default: number; description: string };
  audioCodec?: { options: string[]; default: string };
  // 图片范围配置
  format?: { options: string[]; default: string };
  quality?: { min: number; max: number; default: number };
  // 文档范围配置
  targetFormat?: { options: string[]; default: string };
}

/**
 * 预设数据接口
 */
export interface Preset {
  id: string;
  name: string;
  type: "video" | "image" | "document";
  config: PresetConfig;
  configRange?: PresetConfigRange;
  isSystem: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 视频预设范围常量
 */
export const VIDEO_RANGES: PresetConfigRange = {
  codec: {
    options: ["h264", "h265", "vp9", "av1"],
    default: "h264"
  },
  resolution: {
    options: ["240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"],
    default: "1080p"
  },
  bitrate: {
    min: "500k",
    max: "50000k",
    default: "5000k",
    unit: "k"
  },
  fps: {
    min: 15,
    max: 120,
    default: 30,
    options: [24, 25, 30, 50, 60, 120]
  },
  crf: {
    min: 0,
    max: 51,
    default: 23,
    description: "CRF 质量，0-51，越小质量越好"
  },
  audioCodec: {
    options: ["aac", "mp3", "opus", "copy"],
    default: "aac"
  }
};

/**
 * 图片预设范围常量
 */
export const IMAGE_RANGES: PresetConfigRange = {
  format: {
    options: ["jpg", "jpeg", "png", "webp", "avif", "bmp", "tiff", "ico", "heic"],
    default: "webp"
  },
  quality: {
    min: 1,
    max: 100,
    default: 85
  }
};

/**
 * 文档预设范围常量
 */
export const DOCUMENT_RANGES: PresetConfigRange = {
  targetFormat: {
    options: ["pdf", "csv", "word", "txt"],
    default: "pdf"
  }
};

/**
 * 初始化数据库连接（由 sqlite.ts 调用）
 */
export function initDb(database: Database) {
  db = database;

  // 检查是否需要添加 configRange 列（兼容旧数据库）
  const tableInfo = db.pragma("table_info('presets')") as any[];
  const hasConfigRange = tableInfo.some(col => col.name === 'configRange');

  if (!hasConfigRange) {
    logger.info("为预设表添加 configRange 列");
    db.exec("ALTER TABLE presets ADD COLUMN configRange TEXT");
  }

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_type ON presets(type)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_user ON presets(userId)
  `);

  logger.info("预设表索引初始化完成");
}

/**
 * 获取所有预设
 *
 * @param type - 按类型过滤（可选）
 * @returns 预设列表
 */
export function getAllPresets(type?: string): Preset[] {
  let sql = "SELECT * FROM presets";
  const params: any[] = [];

  if (type) {
    sql += " WHERE type = ?";
    params.push(type);
  }

  sql += " ORDER BY isSystem DESC, name ASC";

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((row) => ({
    ...row,
    config: JSON.parse(row.config) as PresetConfig,
    configRange: row.configRange ? JSON.parse(row.configRange) as PresetConfigRange : getDefaultRangeForType(row.type),
    isSystem: row.isSystem === 1,
  }));
}

/**
 * 获取单个预设
 *
 * @param id - 预设 ID
 * @returns 预设对象或 undefined
 */
export function getPresetById(id: string): Preset | undefined {
  const row = db.prepare("SELECT * FROM presets WHERE id = ?").get(id) as any;
  if (!row) return undefined;

  return {
    ...row,
    config: JSON.parse(row.config) as PresetConfig,
    configRange: row.configRange ? JSON.parse(row.configRange) as PresetConfigRange : getDefaultRangeForType(row.type),
    isSystem: row.isSystem === 1,
  };
}

/**
 * 获取预设范围值
 * @param type 预设类型
 * @returns 范围值配置
 */
export function getConfigRangeByType(type: string): PresetConfigRange | null {
  switch (type) {
    case "video":
      return VIDEO_RANGES;
    case "image":
      return IMAGE_RANGES;
    case "document":
      return DOCUMENT_RANGES;
    default:
      return null;
  }
}

/**
 * 获取默认范围值
 */
function getDefaultRangeForType(type: string): PresetConfigRange {
  return getConfigRangeByType(type) || {};
}

/**
 * 创建预设
 *
 * @param preset - 预设数据（不含 id、createdAt、updatedAt）
 * @returns 创建的预设
 */
export function createPreset(
  preset: Omit<Preset, "id" | "createdAt" | "updatedAt">,
): Preset {
  const id = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO presets (id, name, type, config, configRange, isSystem, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    preset.name,
    preset.type,
    JSON.stringify(preset.config),
    preset.configRange ? JSON.stringify(preset.configRange) : JSON.stringify(getDefaultRangeForType(preset.type)),
    preset.isSystem ? 1 : 0,
    preset.userId,
    now,
    now,
  );

  logger.info("创建预设", { id, name: preset.name, type: preset.type });

  return {
    ...preset,
    id,
    createdAt: now,
    updatedAt: now,
  };
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
  updates: Partial<Preset>,
): Preset | undefined {
  const preset = getPresetById(id);
  if (!preset) {
    logger.warn("更新预设失败：预设不存在", { id });
    return undefined;
  }

  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.config !== undefined) {
    fields.push("config = ?");
    values.push(JSON.stringify(updates.config));
  }
  if (updates.configRange !== undefined) {
    fields.push("configRange = ?");
    values.push(JSON.stringify(updates.configRange));
  }
  if (updates.isSystem !== undefined) {
    fields.push("isSystem = ?");
    values.push(updates.isSystem ? 1 : 0);
  }

  fields.push("updatedAt = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE presets SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );

  logger.info("更新预设", { id, updates });

  return {
    ...preset,
    ...updates,
    updatedAt: now,
  };
}

/**
 * 删除预设
 *
 * @param id - 预设 ID
 * @returns 是否删除成功
 */
export function deletePreset(id: string): boolean {
  const preset = getPresetById(id);
  if (!preset) {
    logger.warn("删除预设失败：预设不存在", { id });
    return false;
  }

  if (preset.isSystem) {
    logger.warn("删除预设失败：系统预设不可删除", { id });
    return false;
  }

  db.prepare("DELETE FROM presets WHERE id = ?").run(id);
  logger.info("删除预设", { id });

  return true;
}

/**
 * 强制删除预设（用于清理无效数据，绕过系统预设保护）
 *
 * @param id - 预设 ID
 * @returns 是否删除成功
 */
export function forceDeletePreset(id: string): boolean {
  const preset = getPresetById(id);
  if (!preset) {
    return false;
  }

  db.prepare("DELETE FROM presets WHERE id = ?").run(id);
  logger.info("强制删除预设", { id });

  return true;
}

/**
 * 清理无效预设（乱码数据）
 */
export function cleanupInvalidPresets(): number {
  const stmt = db.prepare("SELECT id, name FROM presets");
  const rows = stmt.all() as { id: string; name: string }[];
  let deleted = 0;

  // 乱码检测正则：只允许中英文、日文假名、字母数字、常见标点
  const validPattern = /^[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FFa-zA-Z0-9\s\-\u2014\u2013\u3001\u3002\uff0c]+$/u;

  for (const row of rows) {
    // 检查名称是否包含乱码字符
    if (!validPattern.test(row.name)) {
      logger.warn("发现乱码预设，准备删除", { id: row.id, name: row.name });
      // 使用强制删除，绕过系统预设保护
      forceDeletePreset(row.id);
      deleted++;
    }
  }

  return deleted;
}

/**
 * 为现有预设添加范围值（数据迁移）
 */
export function migratePresetRanges(): number {
  const stmt = db.prepare("SELECT id, type, configRange FROM presets");
  const rows = stmt.all() as { id: string; type: string; configRange: string | null }[];
  let updated = 0;

  const updateStmt = db.prepare("UPDATE presets SET configRange = ? WHERE id = ?");

  for (const row of rows) {
    if (!row.configRange) {
      const defaultRange = getDefaultRangeForType(row.type);
      updateStmt.run(JSON.stringify(defaultRange), row.id);
      updated++;
    }
  }

  if (updated > 0) {
    logger.info(`[迁移] 为 ${updated} 个预设添加了范围值配置`);
  }

  return updated;
}

/**
 * 检查预设是否已存在
 *
 * @param name - 预设名称
 * @param type - 预设类型
 * @param isSystem - 是否系统预设
 * @returns 是否存在
 */
export function presetExists(name: string, type: string, isSystem: boolean): boolean {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM presets WHERE name = ? AND type = ? AND isSystem = ?");
  const result = stmt.get(name, type, isSystem ? 1 : 0) as { count: number };
  return result.count > 0;
}

/**
 * 初始化系统预设
 *
 * 应用启动时自动调用，创建内置预设模板
 */
export function initSystemPresets() {
  const systemPresets = [
    {
      name: "视频 - 通用 H.264",
      type: "video" as const,
      config: { codec: "h264", resolution: "1080p", bitrate: "5000k", fps: 30, crf: 23, audioCodec: "aac" },
      configRange: VIDEO_RANGES,
      isSystem: true,
    },
    {
      name: "视频 - 高清 H.265",
      type: "video" as const,
      config: { codec: "h265", resolution: "1080p", bitrate: "3000k", fps: 30, crf: 25, audioCodec: "aac" },
      configRange: VIDEO_RANGES,
      isSystem: true,
    },
    {
      name: "视频 - 标清 H.264",
      type: "video" as const,
      config: { codec: "h264", resolution: "480p", bitrate: "1500k", fps: 24, crf: 23, audioCodec: "aac" },
      configRange: VIDEO_RANGES,
      isSystem: true,
    },
    {
      name: "图片 - WebP 高质量",
      type: "image" as const,
      config: { format: "webp", quality: 90 },
      configRange: IMAGE_RANGES,
      isSystem: true,
    },
    {
      name: "图片 - JPEG 压缩",
      type: "image" as const,
      config: { format: "jpeg", quality: 80 },
      configRange: IMAGE_RANGES,
      isSystem: true,
    },
    {
      name: "图片 - PNG 无损",
      type: "image" as const,
      config: { format: "png", quality: 100 },
      configRange: IMAGE_RANGES,
      isSystem: true,
    },
    {
      name: "文档 - Word 转 PDF",
      type: "document" as const,
      config: { targetFormat: "pdf" },
      configRange: DOCUMENT_RANGES,
      isSystem: true,
    },
    {
      name: "文档 - Excel 转 CSV",
      type: "document" as const,
      config: { targetFormat: "csv" },
      configRange: DOCUMENT_RANGES,
      isSystem: true,
    },
  ];

  let created = 0;
  for (const preset of systemPresets) {
    // 检查预设是否已存在
    if (presetExists(preset.name, preset.type, true)) {
      continue;
    }
    try {
      createPreset({ ...preset, userId: undefined });
      created++;
    } catch (e) {
      logger.warn("创建系统预设失败", { name: preset.name, error: e });
    }
  }

  logger.info(
    `系统预设初始化完成，新增 ${created}/${systemPresets.length} 个预设`,
  );
}
