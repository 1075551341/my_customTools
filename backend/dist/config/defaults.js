"use strict";
/**
 * 默认配置值
 *
 * 定义所有配置项的默认值，当环境变量未设置时使用
 *
 * @module config/defaults
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 默认配置值
 */
const defaults = {
    /**
     * 服务默认配置
     */
    server: {
        port: 3001,
        nodeEnv: "development",
        baseUrl: "http://localhost:3001",
    },
    /**
     * JWT 默认配置
     */
    jwt: {
        secret: "default-jwt-secret-change-in-production",
        refreshSecret: "default-refresh-secret-change-in-production",
        expiresIn: "2h",
        refreshExpiresIn: "7d",
    },
    /**
     * Redis 默认配置
     */
    redis: {
        host: "127.0.0.1",
        port: 6379,
        password: "",
    },
    /**
     * 存储路径默认配置
     */
    storage: {
        uploadDir: "./uploads",
        outputDir: "./outputs",
        dataDir: "./data",
        logDir: "./logs",
    },
    /**
     * 功能开关默认配置
     */
    features: {
        allowRegister: true,
        enableRateLimit: true,
    },
    /**
     * FFmpeg 默认配置
     */
    ffmpeg: {
        path: "", // 留空则从 PATH 中查找
        ffprobePath: "",
    },
    /**
     * CORS 默认配置
     */
    cors: {
        origins: "http://localhost:5173,http://localhost:5174,http://localhost:5999,http://localhost:6000,http://localhost:6001,http://localhost:5666,http://localhost:5667",
    },
};
exports.default = defaults;
//# sourceMappingURL=defaults.js.map