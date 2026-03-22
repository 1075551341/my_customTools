/**
 * 转码预设服务层
 *
 * 处理预设相关的业务逻辑，包含参数范围验证
 *
 * @module services/presets
 */

import * as presetDb from "../db/presets";
import type { Preset, PresetConfig, PresetConfigRange } from "../db/presets";
import { VIDEO_RANGES, IMAGE_RANGES, DOCUMENT_RANGES } from "../db/presets";
import logger from "../utils/logger";

/**
 * 验证视频配置参数
 */
function validateVideoConfig(config: PresetConfig): void {
  const ranges = VIDEO_RANGES;

  // 验证 codec
  if (config.codec && ranges.codec?.options) {
    if (!ranges.codec.options.includes(config.codec)) {
      throw new Error(`无效的视频编码：${config.codec}，可选值：${ranges.codec.options.join(", ")}`);
    }
  }

  // 验证 resolution
  if (config.resolution && ranges.resolution?.options) {
    if (!ranges.resolution.options.includes(config.resolution)) {
      throw new Error(`无效的分辨率：${config.resolution}，可选值：${ranges.resolution.options.join(", ")}`);
    }
  }

  // 验证 bitrate
  if (config.bitrate && ranges.bitrate) {
    const bitrateRegex = /^(\d+)(k|m)?$/i;
    const match = config.bitrate.match(bitrateRegex);
    if (!match) {
      throw new Error(`无效的码率格式：${config.bitrate}，格式应为：数字 + k/m（如 5000k）`);
    }
    const bitrateValue = parseInt(match[1], 10);
    const unit = (match[2] || "k").toLowerCase();
    const minValue = parseInt(ranges.bitrate.min, 10);
    const maxValue = parseInt(ranges.bitrate.max, 10);

    if (unit === "m") {
      if (bitrateValue < 1 || bitrateValue > 50) {
        throw new Error(`码率超出范围：${config.bitrate}，有效范围：${ranges.bitrate.min}-${ranges.bitrate.max}`);
      }
    } else {
      if (bitrateValue < minValue || bitrateValue > maxValue) {
        throw new Error(`码率超出范围：${config.bitrate}，有效范围：${ranges.bitrate.min}-${ranges.bitrate.max}`);
      }
    }
  }

  // 验证 fps
  if (config.fps !== undefined && ranges.fps) {
    if (config.fps < ranges.fps.min || config.fps > ranges.fps.max) {
      throw new Error(`帧率超出范围：${config.fps}，有效范围：${ranges.fps.min}-${ranges.fps.max} fps`);
    }
  }

  // 验证 crf
  if (config.crf !== undefined && ranges.crf) {
    if (config.crf < ranges.crf.min || config.crf > ranges.crf.max) {
      throw new Error(`CRF 值超出范围：${config.crf}，有效范围：${ranges.crf.min}-${ranges.crf.max}（${ranges.crf.description}）`);
    }
  }

  // 验证 audioCodec
  if (config.audioCodec && ranges.audioCodec?.options) {
    if (!ranges.audioCodec.options.includes(config.audioCodec)) {
      throw new Error(`无效的音频编码：${config.audioCodec}，可选值：${ranges.audioCodec.options.join(", ")}`);
    }
  }
}

/**
 * 验证图片配置参数
 */
function validateImageConfig(config: PresetConfig): void {
  const ranges = IMAGE_RANGES;

  // 验证 format
  if (config.format && ranges.format?.options) {
    if (!ranges.format.options.includes(config.format)) {
      throw new Error(`无效的图片格式：${config.format}，可选值：${ranges.format.options.join(", ")}`);
    }
  }

  // 验证 quality
  if (config.quality !== undefined && ranges.quality) {
    if (config.quality < ranges.quality.min || config.quality > ranges.quality.max) {
      throw new Error(`质量值超出范围：${config.quality}，有效范围：${ranges.quality.min}-${ranges.quality.max}`);
    }
  }
}

/**
 * 验证文档配置参数
 */
function validateDocumentConfig(config: PresetConfig): void {
  const ranges = DOCUMENT_RANGES;

  // 验证 targetFormat
  if (config.targetFormat && ranges.targetFormat?.options) {
    if (!ranges.targetFormat.options.includes(config.targetFormat)) {
      throw new Error(`无效的文档格式：${config.targetFormat}，可选值：${ranges.targetFormat.options.join(", ")}`);
    }
  }
}

/**
 * 验证预设配置
 */
function validateConfig(type: string, config: PresetConfig): void {
  switch (type) {
    case "video":
      validateVideoConfig(config);
      break;
    case "image":
      validateImageConfig(config);
      break;
    case "document":
      validateDocumentConfig(config);
      break;
    default:
      throw new Error(`未知的预设类型：${type}`);
  }
}

/**
 * 获取预设列表
 *
 * @param type - 按类型过滤（可选）
 * @returns 预设列表
 */
export function getList(type?: string): Preset[] {
  logger.info("获取预设列表", { type });
  return presetDb.getAllPresets(type);
}

/**
 * 获取单个预设
 *
 * @param id - 预设 ID
 * @returns 预设对象或 null
 */
export function getById(id: string): Preset | null {
  const preset = presetDb.getPresetById(id);
  if (!preset) {
    logger.warn("预设不存在", { id });
    return null;
  }
  return preset;
}

/**
 * 创建预设
 *
 * @param name - 预设名称
 * @param type - 预设类型
 * @param config - 转码配置
 * @param userId - 创建用户 ID（可选）
 * @returns 创建的预设
 */
export function create(
  name: string,
  type: "video" | "image" | "document",
  config: PresetConfig,
  userId?: string,
): Preset {
  logger.info("创建预设", { name, type, userId });

  // 验证名称
  if (!name || name.trim().length === 0) {
    throw new Error("预设名称不能为空");
  }

  if (name.length > 50) {
    throw new Error("预设名称不能超过 50 个字符");
  }

  // 验证类型
  if (!["video", "image", "document"].includes(type)) {
    throw new Error("无效的预设类型");
  }

  // 验证配置
  if (!config || typeof config !== "object") {
    throw new Error("转码配置不能为空");
  }

  // 验证配置参数范围
  validateConfig(type, config);

  return presetDb.createPreset({
    name: name.trim(),
    type,
    config,
    isSystem: false,
    userId,
  });
}

/**
 * 更新预设
 *
 * @param id - 预设 ID
 * @param updates - 要更新的字段
 * @param userId - 用户 ID（用于权限验证）
 * @returns 更新后的预设或 null
 */
export function update(
  id: string,
  updates: { name?: string; config?: PresetConfig },
  userId?: string,
): Preset | null {
  logger.info("更新预设", { id, updates, userId });

  const preset = presetDb.getPresetById(id);
  if (!preset) {
    return null;
  }

  // 系统预设只能修改 config，不能修改 name
  if (preset.isSystem && updates.name) {
    logger.warn("系统预设不可修改名称", { id });
    return null;
  }

  // 检查权限：只能修改自己的预设
  if (preset.userId && preset.userId !== userId) {
    logger.warn("无权修改他人预设", { id, userId });
    return null;
  }

  // 验证名称
  if (updates.name) {
    if (updates.name.trim().length === 0) {
      throw new Error("预设名称不能为空");
    }
    if (updates.name.length > 50) {
      throw new Error("预设名称不能超过 50 个字符");
    }
    updates.name = updates.name.trim();
  }

  // 验证配置
  if (updates.config && typeof updates.config !== "object") {
    throw new Error("转码配置必须为对象");
  }

  // 验证配置参数范围
  if (updates.config) {
    validateConfig(preset.type, updates.config);
  }

  const result = presetDb.updatePreset(id, updates);
  return result || null;
}

/**
 * 删除预设
 *
 * @param id - 预设 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 是否删除成功
 */
export function remove(id: string, userId?: string): boolean {
  logger.info("删除预设", { id, userId });

  const preset = presetDb.getPresetById(id);
  if (!preset) {
    return false;
  }

  // 系统预设不可删除
  if (preset.isSystem) {
    logger.warn("系统预设不可删除", { id });
    return false;
  }

  // 检查权限
  if (preset.userId && preset.userId !== userId) {
    logger.warn("无权删除他人预设", { id, userId });
    return false;
  }

  return presetDb.deletePreset(id);
}
