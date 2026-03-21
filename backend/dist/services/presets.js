"use strict";
/**
 * 转码预设服务层
 *
 * 处理预设相关的业务逻辑
 *
 * @module services/presets
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getList = getList;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.remove = remove;
const presetDb = __importStar(require("../db/presets"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 获取预设列表
 *
 * @param type - 按类型过滤（可选）
 * @returns 预设列表
 */
function getList(type) {
    logger_1.default.info("获取预设列表", { type });
    return presetDb.getAllPresets(type);
}
/**
 * 获取单个预设
 *
 * @param id - 预设 ID
 * @returns 预设对象或 null
 */
function getById(id) {
    const preset = presetDb.getPresetById(id);
    if (!preset) {
        logger_1.default.warn("预设不存在", { id });
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
function create(name, type, config, userId) {
    logger_1.default.info("创建预设", { name, type, userId });
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
function update(id, updates, userId) {
    logger_1.default.info("更新预设", { id, updates, userId });
    const preset = presetDb.getPresetById(id);
    if (!preset) {
        return null;
    }
    // 系统预设只能修改 config，不能修改 name
    if (preset.isSystem && updates.name) {
        logger_1.default.warn("系统预设不可修改名称", { id });
        return null;
    }
    // 检查权限：只能修改自己的预设
    if (preset.userId && preset.userId !== userId) {
        logger_1.default.warn("无权修改他人预设", { id, userId });
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
function remove(id, userId) {
    logger_1.default.info("删除预设", { id, userId });
    const preset = presetDb.getPresetById(id);
    if (!preset) {
        return false;
    }
    // 系统预设不可删除
    if (preset.isSystem) {
        logger_1.default.warn("系统预设不可删除", { id });
        return false;
    }
    // 检查权限
    if (preset.userId && preset.userId !== userId) {
        logger_1.default.warn("无权删除他人预设", { id, userId });
        return false;
    }
    return presetDb.deletePreset(id);
}
//# sourceMappingURL=presets.js.map