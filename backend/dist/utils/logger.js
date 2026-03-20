"use strict";
/**
 * 日志工具模块
 *
 * 基于 Winston 实现的统一日志系统
 *
 * 功能说明：
 * - 支持多级别日志：error / warn / info / debug
 * - 开发环境：控制台彩色输出
 * - 生产环境：控制台 JSON 格式 + 文件输出
 * - 自动创建日志目录
 *
 * @module utils/logger
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
// 日志目录路径
const LOG_DIR = config_1.default.storage.logDir;
// 确保日志目录存在
if (!fs_1.default.existsSync(LOG_DIR)) {
    fs_1.default.mkdirSync(LOG_DIR, { recursive: true });
}
/**
 * 自定义日志格式
 *
 * 格式：[时间] [级别] 消息 {元数据}
 */
const customFormat = winston_1.default.format.printf(({ level, message, timestamp, ...metadata }) => {
    const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
});
/**
 * 控制台输出格式（带颜色）
 */
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat);
/**
 * 文件输出格式（JSON）
 */
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.json());
/**
 * 定义传输器（根据环境配置）
 */
const transports = [];
// 开发环境：控制台彩色输出
if (config_1.default.server.nodeEnv === 'development') {
    transports.push(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}
else {
    // 生产环境：控制台 JSON 输出
    transports.push(new winston_1.default.transports.Console({
        format: fileFormat,
        level: 'info'
    }));
    // 生产环境：文件输出
    transports.push(
    // 所有日志
    new winston_1.default.transports.File({
        filename: path_1.default.join(LOG_DIR, 'combined.log'),
        format: fileFormat,
        level: 'info',
        maxsize: 10485760, // 10MB
        maxFiles: 5
    }), 
    // 错误日志
    new winston_1.default.transports.File({
        filename: path_1.default.join(LOG_DIR, 'error.log'),
        format: fileFormat,
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5
    }));
}
/**
 * Winston Logger 实例
 *
 * 使用示例：
 * ```typescript
 * import logger from './utils/logger'
 *
 * logger.info('服务启动', { port: 3001 })
 * logger.error('数据库连接失败', { error: err.message })
 * logger.warn('配置项缺失，使用默认值', { key: 'maxConnections' })
 * logger.debug('调试信息', { data: someObject })
 * ```
 */
const logger = winston_1.default.createLogger({
    levels: winston_1.default.config.npm.levels,
    defaultMeta: { service: 'my-customtools-backend' },
    transports
});
exports.default = logger;
//# sourceMappingURL=logger.js.map