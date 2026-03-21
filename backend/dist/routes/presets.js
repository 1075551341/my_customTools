"use strict";
/**
 * 预设路由模块
 *
 * 提供转码预设管理接口
 *
 * @module routes/presets
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
const express_1 = require("express");
const presetsService = __importStar(require("../services/presets"));
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 获取预设列表
 *
 * GET /api/presets
 * Query: type - 按类型过滤 (video|image|document)
 */
router.get("/", (req, res, next) => {
    try {
        const { type } = req.query;
        const presets = presetsService.getList(type);
        return (0, response_1.success)(res, presets);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 获取单个预设详情
 *
 * GET /api/presets/:id
 */
router.get("/:id", (req, res, next) => {
    try {
        const id = req.params.id;
        const preset = presetsService.getById(id);
        if (!preset) {
            return (0, response_1.error)(res, "预设不存在", 404);
        }
        return (0, response_1.success)(res, preset);
    }
    catch (err) {
        return next(err);
    }
});
/**
 * 创建新预设
 *
 * POST /api/presets
 * Body: { name, type, config }
 */
router.post("/", auth_1.authMiddleware, (req, res, next) => {
    try {
        const { name, type, config } = req.body;
        if (!name || !type || !config) {
            return (0, response_1.error)(res, "缺少必要参数：name, type, config", 400);
        }
        if (!["video", "image", "document"].includes(type)) {
            return (0, response_1.error)(res, "无效的预设类型", 400);
        }
        const userId = req.user?.id;
        const preset = presetsService.create(name, type, config, userId);
        return (0, response_1.success)(res, preset, "预设创建成功", 201);
    }
    catch (err) {
        const message = err.message;
        if (message.includes("不能") || message.includes("无效")) {
            return (0, response_1.error)(res, message, 400);
        }
        return next(err);
    }
});
/**
 * 更新预设
 *
 * PUT /api/presets/:id
 * Body: { name?, config? }
 */
router.put("/:id", auth_1.authMiddleware, (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, config } = req.body;
        const userId = req.user?.id;
        const preset = presetsService.getById(id);
        if (!preset) {
            return (0, response_1.error)(res, "预设不存在", 404);
        }
        const updated = presetsService.update(id, { name, config }, userId);
        if (!updated) {
            return (0, response_1.error)(res, "更新失败或无权限", 403);
        }
        return (0, response_1.success)(res, updated, "预设更新成功");
    }
    catch (err) {
        const message = err.message;
        if (message.includes("不能") || message.includes("必须")) {
            return (0, response_1.error)(res, message, 400);
        }
        return next(err);
    }
});
/**
 * 删除预设
 *
 * DELETE /api/presets/:id
 */
router.delete("/:id", auth_1.authMiddleware, (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const successFlag = presetsService.remove(id, userId);
        if (!successFlag) {
            return (0, response_1.error)(res, "删除失败：可能是系统预设或无权限", 403);
        }
        return (0, response_1.success)(res, null, "预设删除成功");
    }
    catch (err) {
        return next(err);
    }
});
exports.default = router;
//# sourceMappingURL=presets.js.map