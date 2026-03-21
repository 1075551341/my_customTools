/**
 * 转码预设服务层
 *
 * 处理预设相关的业务逻辑
 *
 * @module services/presets
 */

import * as presetDb from "../db/presets";
import type { Preset, PresetConfig } from "../db/presets";
import logger from "../utils/logger";

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

