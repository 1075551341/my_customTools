/**
 * 系统配置数据持久化模块
 *
 * 使用 JSON 文件存储系统配置
 *
 * @module db/config
 */
/**
 * 视频转码配置
 */
export interface VideoConfig {
    parallelLimit: number;
    maxFileSize: number;
    allowedInputFormats: string[];
}
/**
 * 图片转码配置
 */
export interface ImgConfig {
    parallelLimit: number;
    maxFileSize: number;
    allowedInputFormats: string[];
}
/**
 * 上传配置
 */
export interface UploadConfig {
    chunkSize: number;
    maxParallelUploads: number;
}
/**
 * 存储配置
 */
export interface StorageConfig {
    type: 'local' | 's3';
    uploadDir: string;
    outputDir: string;
    autoClean: boolean;
    cleanDays: number;
}
/**
 * 系统配置结构
 */
export interface SystemConfig {
    video: VideoConfig;
    img: ImgConfig;
    upload: UploadConfig;
    storage: StorageConfig;
    updatedAt: string;
}
/**
 * 读取系统配置
 *
 * @returns 系统配置对象
 */
export declare function read(): SystemConfig;
/**
 * 写入系统配置
 *
 * @param cfg - 系统配置对象
 */
export declare function write(cfg: SystemConfig): void;
/**
 * 更新部分配置
 *
 * @param updates - 要更新的配置项
 * @returns 更新后的完整配置
 */
export declare function update(updates: Partial<SystemConfig>): SystemConfig;
/**
 * 重置为默认配置
 *
 * @returns 默认配置
 */
export declare function reset(): SystemConfig;
/**
 * 获取默认配置
 *
 * @returns 默认配置副本
 */
export declare function getDefaults(): SystemConfig;
//# sourceMappingURL=config.d.ts.map