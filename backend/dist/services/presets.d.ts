/**
 * 转码预设服务层
 *
 * 处理预设相关的业务逻辑
 *
 * @module services/presets
 */
import type { Preset, PresetConfig } from "../db/presets";
/**
 * 获取预设列表
 *
 * @param type - 按类型过滤（可选）
 * @returns 预设列表
 */
export declare function getList(type?: string): Preset[];
/**
 * 获取单个预设
 *
 * @param id - 预设 ID
 * @returns 预设对象或 null
 */
export declare function getById(id: string): Preset | null;
/**
 * 创建预设
 *
 * @param name - 预设名称
 * @param type - 预设类型
 * @param config - 转码配置
 * @param userId - 创建用户 ID（可选）
 * @returns 创建的预设
 */
export declare function create(name: string, type: "video" | "image" | "document", config: PresetConfig, userId?: string): Preset;
/**
 * 更新预设
 *
 * @param id - 预设 ID
 * @param updates - 要更新的字段
 * @param userId - 用户 ID（用于权限验证）
 * @returns 更新后的预设或 null
 */
export declare function update(id: string, updates: {
    name?: string;
    config?: PresetConfig;
}, userId?: string): Preset | null;
/**
 * 删除预设
 *
 * @param id - 预设 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 是否删除成功
 */
export declare function remove(id: string, userId?: string): boolean;
//# sourceMappingURL=presets.d.ts.map