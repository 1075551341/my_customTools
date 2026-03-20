"use strict";
/**
 * Express 应用入口
 *
 * 负责创建和配置 Express 应用实例
 *
 * 功能说明：
 * - 注册全局中间件（CORS、JSON解析、请求日志）
 * - 注册路由
 * - 注册错误处理中间件
 *
 * @module app
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const routes_1 = __importDefault(require("./routes"));
const swagger_1 = __importDefault(require("./routes/swagger"));
const errorHandler_1 = require("./middlewares/errorHandler");
/**
 * 创建 Express 应用实例
 *
 * @returns Express 应用实例
 */
function createApp() {
    const app = (0, express_1.default)();
    // ==================== 基础中间件 ====================
    /**
     * CORS 跨域配置
     *
     * 允许指定的前端域名访问 API
     */
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // 允许无 origin 的请求（如 Postman、服务器内部调用）
            if (!origin)
                return callback(null, true);
            // 检查是否在允许列表中
            if (config_1.default.cors.origins.includes(origin)) {
                callback(null, true);
            }
            else {
                logger_1.default.warn('CORS 阻止请求', { origin, allowed: config_1.default.cors.origins });
                callback(null, false);
            }
        },
        credentials: true, // 允许携带 Cookie
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    /**
     * JSON 请求体解析
     *
     * 限制请求体大小为 50MB，支持大文件上传时的元数据
     */
    app.use(express_1.default.json({ limit: '50mb' }));
    /**
     * URL 编码请求体解析
     *
     * 支持传统的表单提交
     */
    app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
    // ==================== 请求日志中间件 ====================
    /**
     * 请求日志记录
     *
     * 记录每个请求的方法、路径、响应时间
     */
    app.use((req, res, next) => {
        const startTime = Date.now();
        // 响应完成后记录日志
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const logData = {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip || req.socket.remoteAddress
            };
            // 根据状态码选择日志级别
            if (res.statusCode >= 400) {
                logger_1.default.warn('请求失败', logData);
            }
            else {
                logger_1.default.info('请求完成', logData);
            }
        });
        next();
    });
    // ==================== 路由注册 ====================
    /**
     * Swagger API 文档
     *
     * 访问地址：/api-docs
     */
    app.use('/api-docs', swagger_1.default);
    /**
     * API 路由
     *
     * 所有业务路由统一前缀：/api
     */
    app.use('/api', routes_1.default);
    // ==================== 错误处理 ====================
    /**
     * 404 处理
     *
     * 当请求路径不存在时返回 404 错误
     */
    app.use(errorHandler_1.notFoundHandler);
    /**
     * 全局错误处理
     *
     * 捕获所有未处理的错误，统一返回错误响应格式
     */
    app.use(errorHandler_1.errorHandler);
    return app;
}
exports.default = createApp;
//# sourceMappingURL=app.js.map