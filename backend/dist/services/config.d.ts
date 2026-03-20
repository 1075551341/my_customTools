/**
 * 配置服务模块
 *
 * 提供系统配置管理功能
 *
 * @module services/config
 */
import type { SystemConfig, VideoConfig, ImgConfig, UploadConfig, StorageConfig } from '../db/config';
/**
 * 获取系统配置
 *
 * @returns 系统配置
 */
export declare function getConfig(): SystemConfig;
/**
 * 更新系统配置
 *
 * @param updates - 要更新的配置项
 * @returns 更新后的完整配置
 */
export declare function updateConfig(updates: Partial<SystemConfig>): SystemConfig;
/**
 * 重置为默认配置
 *
 * @returns 默认配置
 */
export declare function resetConfig(): SystemConfig;
/**
 * 获取视频转码配置
 *
 * @returns 视频配置
 */
export declare function getVideoConfig(): VideoConfig;
/**
 * 获取图片转码配置
 *
 * @returns 图片配置
 */
export declare function getImgConfig(): ImgConfig;
/**
 * 获取上传配置
 *
 * @returns 上传配置
 */
export declare function getUploadConfig(): UploadConfig;
/**
 * 获取存储配置
 *
 * @returns 存储配置
 */
export declare function getStorageConfig(): StorageConfig;
/**
 * 获取配置对比（当前 vs 默认）
 *
 * @returns 配置对比信息
 */
export declare function getConfigDiff(): {
    current: SystemConfig;
    defaults: SystemConfig;
    changed: string[];
};
//# sourceMappingURL=config.d.ts.map