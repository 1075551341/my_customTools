"use strict";
/**
 * 路由注册入口
 *
 * 汇总注册所有路由模块
 *
 * @module routes/index
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// 导入各路由模块
const system_1 = __importDefault(require("./system"));
const auth_1 = __importDefault(require("./auth"));
const upload_1 = __importDefault(require("./upload"));
const tasks_1 = __importDefault(require("./tasks"));
const queue_1 = __importDefault(require("./queue"));
const download_1 = __importDefault(require("./download"));
const config_1 = __importDefault(require("./config"));
const clean_1 = __importDefault(require("./clean"));
const export_1 = __importDefault(require("./export"));
const user_1 = __importDefault(require("./user"));
const menu_1 = __importDefault(require("./menu"));
const document_1 = __importDefault(require("./document"));
const messages_1 = __importDefault(require("./messages"));
const presets_1 = __importDefault(require("./presets"));
/**
 * 创建路由实例
 */
const router = (0, express_1.Router)();
/**
 * 路由注册
 *
 * 所有路由统一前缀：/api
 */
// 系统路由（健康检查、系统状态）
router.use("/system", system_1.default);
// 认证路由（注册、登录、刷新令牌）
router.use("/auth", auth_1.default);
// 上传路由（分片上传、进度查询）
router.use("/upload", upload_1.default);
// 任务路由（任务管理）
router.use("/tasks", tasks_1.default);
// 队列路由（队列管理）
router.use("/queue", queue_1.default);
// 下载路由（文件下载）
router.use("/download", download_1.default);
// 配置路由（系统配置管理）
router.use("/config", config_1.default);
// 清理路由（自动清理服务）
router.use("/clean", clean_1.default);
// 导出路由（任务报告导出）
router.use("/export", export_1.default);
// 用户路由（用户信息，兼容 Vben Admin）
router.use("/user", user_1.default);
// 菜单路由（菜单配置，兼容 Vben Admin）
router.use("/menu", menu_1.default);
// 文档路由（文档格式转换）
router.use("/document", document_1.default);
// 消息路由（消息推送）
router.use("/messages", messages_1.default);
// 预设路由（转码预设管理）
router.use("/presets", presets_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map