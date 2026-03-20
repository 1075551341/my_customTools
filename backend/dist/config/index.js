"use strict";
/**
 * 配置模块主入口
 *
 * 功能说明：
 * - 合并环境变量和持久化配置
 * - 提供统一的配置访问接口
 * - 支持配置热更新
 *
 * @module config
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const defaults_1 = __importDefault(require("./defaults"));
// 加载 .env 文件
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
// 数据目录路径
const DATA_DIR = process.env.DATA_DIR || './data';
const CONFIG_FILE = path_1.default.join(DATA_DIR, 'config.json');
/**
 * 从 JSON 文件加载持久化配置
 *
 * @returns 持久化配置对象
 */
function loadPersistedConfig() {
    try {
        if (fs_1.default.existsSync(CONFIG_FILE)) {
            const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(content);
        }
    }
    catch (error) {
        console.warn('加载持久化配置失败，使用默认配置:', error.message);
    }
    return {};
}
/**
 * 合并配置
 *
 * 优先级：环境变量 > 持久化配置 > 默认配置
 *
 * @param key - 配置键名
 * @param defaultValue - 默认值
 * @returns 最终配置值
 */
function getConfigValue(key, defaultValue) {
    // 优先使用环境变量
    if (process.env[key] !== undefined) {
        const envValue = process.env[key];
        // 尝试解析布尔值
        if (envValue === 'true')
            return true;
        if (envValue === 'false')
            return false;
        // 尝试解析数字
        const num = Number(envValue);
        if (!isNaN(num))
            return num;
        return envValue;
    }
    return defaultValue;
}
/**
 * 应用配置对象
 *
 * 包含所有配置项，按模块分组
 */
const config = {
    /**
     * 服务配置
     */
    server: {
        port: getConfigValue('PORT', defaults_1.default.server.port),
        nodeEnv: getConfigValue('NODE_ENV', defaults_1.default.server.nodeEnv),
        baseUrl: getConfigValue('BASE_URL', defaults_1.default.server.baseUrl)
    },
    /**
     * JWT 认证配置
     */
    jwt: {
        secret: getConfigValue('JWT_SECRET', defaults_1.default.jwt.secret),
        refreshSecret: getConfigValue('JWT_REFRESH_SECRET', defaults_1.default.jwt.refreshSecret),
        expiresIn: getConfigValue('JWT_EXPIRES_IN', defaults_1.default.jwt.expiresIn),
        refreshExpiresIn: getConfigValue('JWT_REFRESH_EXPIRES_IN', defaults_1.default.jwt.refreshExpiresIn)
    },
    /**
     * Redis 配置
     */
    redis: {
        host: getConfigValue('REDIS_HOST', defaults_1.default.redis.host),
        port: getConfigValue('REDIS_PORT', defaults_1.default.redis.port),
        password: getConfigValue('REDIS_PASSWORD', defaults_1.default.redis.password)
    },
    /**
     * 存储路径配置
     */
    storage: {
        uploadDir: getConfigValue('UPLOAD_DIR', defaults_1.default.storage.uploadDir),
        outputDir: getConfigValue('OUTPUT_DIR', defaults_1.default.storage.outputDir),
        dataDir: DATA_DIR,
        logDir: getConfigValue('LOG_DIR', defaults_1.default.storage.logDir)
    },
    /**
     * 功能开关配置
     */
    features: {
        allowRegister: getConfigValue('ALLOW_REGISTER', defaults_1.default.features.allowRegister),
        enableRateLimit: getConfigValue('ENABLE_RATE_LIMIT', defaults_1.default.features.enableRateLimit)
    },
    /**
     * FFmpeg 配置
     */
    ffmpeg: {
        path: getConfigValue('FFMPEG_PATH', defaults_1.default.ffmpeg.path),
        ffprobePath: getConfigValue('FFPROBE_PATH', defaults_1.default.ffmpeg.ffprobePath)
    },
    /**
     * CORS 配置
     */
    cors: {
        origins: getConfigValue('CORS_ORIGINS', defaults_1.default.cors.origins).split(',').map(s => s.trim())
    },
    /**
     * 视频转码配置（从持久化配置加载或使用默认值）
     */
    video: {
        parallelLimit: 3,
        maxFileSize: 5368709120, // 5GB
        allowedInputFormats: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ts']
    },
    /**
     * 图片转码配置（从持久化配置加载或使用默认值）
     */
    img: {
        parallelLimit: 5,
        maxFileSize: 52428800, // 50MB
        allowedInputFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'tiff', 'gif', 'heic']
    },
    /**
     * 上传配置
     */
    upload: {
        chunkSize: 5242880, // 5MB
        maxParallelUploads: 2
    }
};
// 合并持久化配置
const persistedConfig = loadPersistedConfig();
if (persistedConfig.video) {
    config.video = { ...config.video, ...persistedConfig.video };
}
if (persistedConfig.img) {
    config.img = { ...config.img, ...persistedConfig.img };
}
if (persistedConfig.upload) {
    config.upload = { ...config.upload, ...persistedConfig.upload };
}
exports.default = config;
//# sourceMappingURL=index.js.map