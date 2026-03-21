"use strict";
/**
 * 转码预设数据持久化模块
 *
 * 使用 SQLite 数据库存储预设配置
 *
 * @module db/presets
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPresetsTable = initPresetsTable;
exports.getAllPresets = getAllPresets;
exports.getPresetById = getPresetById;
exports.createPreset = createPreset;
exports.updatePreset = updatePreset;
exports.deletePreset = deletePreset;
exports.initSystemPresets = initSystemPresets;
const sqlite_1 = __importDefault(require("./sqlite"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 初始化预设表
 */
function initPresetsTable() {
    sqlite_1.default.exec(`
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
  `);
    // 创建索引
    sqlite_1.default.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_type ON presets(type)
  `);
    sqlite_1.default.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_user ON presets(userId)
  `);
    logger_1.default.info("预设表初始化完成");
}
/**
 * 获取所有预设
 *
 * @param type - 按类型过滤（可选）
 * @returns 预设列表
 */
function getAllPresets(type) {
    let sql = "SELECT * FROM presets";
    const params = [];
    if (type) {
        sql += " WHERE type = ?";
        params.push(type);
    }
    sql += " ORDER BY isSystem DESC, name ASC";
    const rows = sqlite_1.default.prepare(sql).all(...params);
    return rows.map((row) => ({
        ...row,
        config: JSON.parse(row.config),
        isSystem: row.isSystem === 1,
    }));
}
/**
 * 获取单个预设
 *
 * @param id - 预设 ID
 * @returns 预设对象或 undefined
 */
function getPresetById(id) {
    const row = sqlite_1.default.prepare("SELECT * FROM presets WHERE id = ?").get(id);
    if (!row)
        return undefined;
    return {
        ...row,
        config: JSON.parse(row.config),
        isSystem: row.isSystem === 1,
    };
}
/**
 * 创建预设
 *
 * @param preset - 预设数据（不含 id、createdAt、updatedAt）
 * @returns 创建的预设
 */
function createPreset(preset) {
    const id = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    sqlite_1.default.prepare(`
    INSERT INTO presets (id, name, type, config, isSystem, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, preset.name, preset.type, JSON.stringify(preset.config), preset.isSystem ? 1 : 0, preset.userId, now, now);
    logger_1.default.info("创建预设", { id, name: preset.name, type: preset.type });
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
function updatePreset(id, updates) {
    const preset = getPresetById(id);
    if (!preset) {
        logger_1.default.warn("更新预设失败：预设不存在", { id });
        return undefined;
    }
    const now = new Date().toISOString();
    const fields = [];
    const values = [];
    if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
    }
    if (updates.config !== undefined) {
        fields.push("config = ?");
        values.push(JSON.stringify(updates.config));
    }
    if (updates.isSystem !== undefined) {
        fields.push("isSystem = ?");
        values.push(updates.isSystem ? 1 : 0);
    }
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(id);
    sqlite_1.default.prepare(`UPDATE presets SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    logger_1.default.info("更新预设", { id, updates });
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
function deletePreset(id) {
    const preset = getPresetById(id);
    if (!preset) {
        logger_1.default.warn("删除预设失败：预设不存在", { id });
        return false;
    }
    if (preset.isSystem) {
        logger_1.default.warn("删除预设失败：系统预设不可删除", { id });
        return false;
    }
    sqlite_1.default.prepare("DELETE FROM presets WHERE id = ?").run(id);
    logger_1.default.info("删除预设", { id });
    return true;
}
/**
 * 初始化系统预设
 *
 * 应用启动时自动调用，创建内置预设模板
 */
function initSystemPresets() {
    const systemPresets = [
        {
            name: "视频 - 通用 H.264",
            type: "video",
            config: { codec: "h264", resolution: "1080p", bitrate: "5000k", fps: 30 },
            isSystem: true,
        },
        {
            name: "视频 - 高清 H.265",
            type: "video",
            config: { codec: "h265", resolution: "1080p", bitrate: "3000k", fps: 30 },
            isSystem: true,
        },
        {
            name: "视频 - 标清 H.264",
            type: "video",
            config: { codec: "h264", resolution: "480p", bitrate: "1500k", fps: 24 },
            isSystem: true,
        },
        {
            name: "图片 - WebP 高质量",
            type: "image",
            config: { format: "webp", quality: 90 },
            isSystem: true,
        },
        {
            name: "图片 - JPEG 压缩",
            type: "image",
            config: { format: "jpeg", quality: 80 },
            isSystem: true,
        },
        {
            name: "图片 - PNG 无损",
            type: "image",
            config: { format: "png", quality: 100 },
            isSystem: true,
        },
        {
            name: "文档 - Word 转 PDF",
            type: "document",
            config: { targetFormat: "pdf" },
            isSystem: true,
        },
        {
            name: "文档 - Excel 转 CSV",
            type: "document",
            config: { targetFormat: "csv" },
            isSystem: true,
        },
    ];
    let created = 0;
    for (const preset of systemPresets) {
        try {
            createPreset({ ...preset, config: preset.config, userId: undefined });
            created++;
        }
        catch (e) {
            // 已存在则跳过
        }
    }
    logger_1.default.info(`系统预设初始化完成，新增 ${created}/${systemPresets.length} 个预设`);
}
//# sourceMappingURL=presets.js.map