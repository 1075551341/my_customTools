"use strict";
/**
 * 配置服务模块
 *
 * 提供系统配置管理功能
 *
 * @module services/config
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
exports.resetConfig = resetConfig;
exports.getVideoConfig = getVideoConfig;
exports.getImgConfig = getImgConfig;
exports.getUploadConfig = getUploadConfig;
exports.getStorageConfig = getStorageConfig;
exports.getConfigDiff = getConfigDiff;
const configDb = __importStar(require("../db/config"));
/**
 * 获取系统配置
 *
 * @returns 系统配置
 */
function getConfig() {
    return configDb.read();
}
/**
 * 更新系统配置
 *
 * @param updates - 要更新的配置项
 * @returns 更新后的完整配置
 */
function updateConfig(updates) {
    // 验证配置值
    validateConfig(updates);
    return configDb.update(updates);
}
/**
 * 重置为默认配置
 *
 * @returns 默认配置
 */
function resetConfig() {
    return configDb.reset();
}
/**
 * 获取视频转码配置
 *
 * @returns 视频配置
 */
function getVideoConfig() {
    const config = getConfig();
    return config.video;
}
/**
 * 获取图片转码配置
 *
 * @returns 图片配置
 */
function getImgConfig() {
    const config = getConfig();
    return config.img;
}
/**
 * 获取上传配置
 *
 * @returns 上传配置
 */
function getUploadConfig() {
    const config = getConfig();
    return config.upload;
}
/**
 * 获取存储配置
 *
 * @returns 存储配置
 */
function getStorageConfig() {
    const config = getConfig();
    return config.storage;
}
/**
 * 验证配置值
 *
 * @param config - 配置对象
 * @throws 配置验证失败
 */
function validateConfig(config) {
    // 验证视频配置
    if (config.video) {
        if (config.video.parallelLimit && (config.video.parallelLimit < 1 || config.video.parallelLimit > 10)) {
            throw new Error('视频并行转码数必须在 1-10 之间');
        }
        if (config.video.maxFileSize && config.video.maxFileSize < 1048576) {
            throw new Error('视频最大文件大小不能小于 1MB');
        }
    }
    // 验证图片配置
    if (config.img) {
        if (config.img.parallelLimit && (config.img.parallelLimit < 1 || config.img.parallelLimit > 20)) {
            throw new Error('图片并行转码数必须在 1-20 之间');
        }
        if (config.img.maxFileSize && config.img.maxFileSize < 1048576) {
            throw new Error('图片最大文件大小不能小于 1MB');
        }
    }
    // 验证上传配置
    if (config.upload) {
        if (config.upload.chunkSize && (config.upload.chunkSize < 1048576 || config.upload.chunkSize > 104857600)) {
            throw new Error('分片大小必须在 1MB-100MB 之间');
        }
        if (config.upload.maxParallelUploads && (config.upload.maxParallelUploads < 1 || config.upload.maxParallelUploads > 5)) {
            throw new Error('并行上传数必须在 1-5 之间');
        }
    }
    // 验证存储配置
    if (config.storage) {
        if (config.storage.cleanDays && (config.storage.cleanDays < 1 || config.storage.cleanDays > 30)) {
            throw new Error('清理天数必须在 1-30 之间');
        }
    }
}
/**
 * 获取配置对比（当前 vs 默认）
 *
 * @returns 配置对比信息
 */
function getConfigDiff() {
    const current = getConfig();
    const defaults = configDb.getDefaults();
    const changed = [];
    // 比较配置变化
    if (JSON.stringify(current.video) !== JSON.stringify(defaults.video)) {
        changed.push('video');
    }
    if (JSON.stringify(current.img) !== JSON.stringify(defaults.img)) {
        changed.push('img');
    }
    if (JSON.stringify(current.upload) !== JSON.stringify(defaults.upload)) {
        changed.push('upload');
    }
    if (JSON.stringify(current.storage) !== JSON.stringify(defaults.storage)) {
        changed.push('storage');
    }
    return { current, defaults, changed };
}
//# sourceMappingURL=config.js.map