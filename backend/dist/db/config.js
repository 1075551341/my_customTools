"use strict";
/**
 * 系统配置数据持久化模块
 *
 * 使用 JSON 文件存储系统配置
 *
 * @module db/config
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.read = read;
exports.write = write;
exports.update = update;
exports.reset = reset;
exports.getDefaults = getDefaults;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 系统配置文件路径
 */
const CONFIG_FILE = path_1.default.join(config_1.default.storage.dataDir, 'config.json');
/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
    video: {
        parallelLimit: 3,
        maxFileSize: 5368709120, // 5GB
        allowedInputFormats: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ts']
    },
    img: {
        parallelLimit: 5,
        maxFileSize: 52428800, // 50MB
        allowedInputFormats: ['jpg', 'png', 'webp', 'avif', 'bmp', 'tiff', 'gif', 'heic']
    },
    upload: {
        chunkSize: 5242880, // 5MB
        maxParallelUploads: 2
    },
    storage: {
        type: 'local',
        uploadDir: './uploads',
        outputDir: './outputs',
        autoClean: true,
        cleanDays: 7
    },
    updatedAt: new Date().toISOString()
};
/**
 * 确保数据目录存在
 */
function ensureDataDir() {
    const dataDir = config_1.default.storage.dataDir;
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
}
/**
 * 读取系统配置
 *
 * @returns 系统配置对象
 */
function read() {
    ensureDataDir();
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        // 首次运行，创建默认配置
        write(DEFAULT_CONFIG);
        logger_1.default.info('创建默认系统配置', { path: CONFIG_FILE });
        return DEFAULT_CONFIG;
    }
    try {
        const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
        const savedConfig = JSON.parse(content);
        // 合并默认配置（确保新增字段有默认值）
        return {
            ...DEFAULT_CONFIG,
            ...savedConfig,
            video: { ...DEFAULT_CONFIG.video, ...savedConfig.video },
            img: { ...DEFAULT_CONFIG.img, ...savedConfig.img },
            upload: { ...DEFAULT_CONFIG.upload, ...savedConfig.upload },
            storage: { ...DEFAULT_CONFIG.storage, ...savedConfig.storage }
        };
    }
    catch (error) {
        logger_1.default.error('读取系统配置失败，使用默认配置', { error: error.message });
        return DEFAULT_CONFIG;
    }
}
/**
 * 写入系统配置
 *
 * @param cfg - 系统配置对象
 */
function write(cfg) {
    ensureDataDir();
    cfg.updatedAt = new Date().toISOString();
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    logger_1.default.info('系统配置已更新', { updatedAt: cfg.updatedAt });
}
/**
 * 更新部分配置
 *
 * @param updates - 要更新的配置项
 * @returns 更新后的完整配置
 */
function update(updates) {
    const currentConfig = read();
    // 深度合并
    const newConfig = {
        ...currentConfig,
        ...updates,
        video: { ...currentConfig.video, ...updates.video },
        img: { ...currentConfig.img, ...updates.img },
        upload: { ...currentConfig.upload, ...updates.upload },
        storage: { ...currentConfig.storage, ...updates.storage }
    };
    write(newConfig);
    return newConfig;
}
/**
 * 重置为默认配置
 *
 * @returns 默认配置
 */
function reset() {
    write(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
}
/**
 * 获取默认配置
 *
 * @returns 默认配置副本
 */
function getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
//# sourceMappingURL=config.js.map