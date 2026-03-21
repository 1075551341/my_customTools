/**
 * 转码预设数据持久化模块
 *
 * 使用 SQLite 数据库存储预设配置
 *
 * @module db/presets
 */
/**
 * 预设配置接口
 */
export interface PresetConfig {
    codec?: string;
    resolution?: string;
    bitrate?: string;
    fps?: number;
    format?: string;
    quality?: number;
    width?: number;
    height?: number;
    targetFormat?: string;
    merge?: boolean;
}
/**
 * 预设数据接口
 */
export interface Preset {
    id: string;
    name: string;
    type: "video" | "image" | "document";
    config: PresetConfig;
    isSystem: boolean;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * 初始化预设表
 */
export declare function initPresetsTable(): void;
/**
 * 获取所有预设
 *
 * @param type - 按类型过滤（可选）
 * @returns 预设列表
 */
export declare function getAllPresets(type?: string): Preset[];
/**
 * 获取单个预设
 *
 * @param id - 预设 ID
 * @returns 预设对象或 undefined
 */
export declare function getPresetById(id: string): Preset | undefined;
/**
 * 创建预设
 *
 * @param preset - 预设数据（不含 id、createdAt、updatedAt）
 * @returns 创建的预设
 */
export declare function createPreset(preset: Omit<Preset, "id" | "createdAt" | "updatedAt">): Preset;
/**
 * 更新预设
 *
 * @param id - 预设 ID
 * @param updates - 要更新的字段
 * @returns 更新后的预设或 undefined
 */
export declare function updatePreset(id: string, updates: Partial<Preset>): Preset | undefined;
/**
 * 删除预设
 *
 * @param id - 预设 ID
 * @returns 是否删除成功
 */
export declare function deletePreset(id: string): boolean;
/**
 * 初始化系统预设
 *
 * 应用启动时自动调用，创建内置预设模板
 */
export declare function initSystemPresets(): void;
//# sourceMappingURL=presets.d.ts.map