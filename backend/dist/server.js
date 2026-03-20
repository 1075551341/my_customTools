"use strict";
/**
 * HTTP 服务器启动入口
 *
 * 负责启动 HTTP 服务器和初始化 Socket.io
 *
 * 功能说明：
 * - 创建 HTTP 服务器
 * - 初始化 Socket.io（实时通信）
 * - 创建必要的目录结构
 * - 启动服务监听
 *
 * @module server
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const workers_1 = require("./workers");
const queue_1 = require("./queue");
const clean_1 = require("./services/clean");
/**
 * 创建必要的目录结构
 *
 * 确保数据、上传、输出、日志目录存在
 */
function ensureDirectories() {
    const directories = [
        config_1.default.storage.uploadDir,
        path_1.default.join(config_1.default.storage.uploadDir, 'chunks'),
        path_1.default.join(config_1.default.storage.uploadDir, 'complete'),
        config_1.default.storage.outputDir,
        path_1.default.join(config_1.default.storage.outputDir, 'video'),
        path_1.default.join(config_1.default.storage.outputDir, 'img'),
        config_1.default.storage.dataDir,
        config_1.default.storage.logDir
    ];
    directories.forEach(dir => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
            logger_1.default.info(`创建目录: ${dir}`);
        }
    });
}
/**
 * 初始化 Socket.io
 *
 * 配置 WebSocket 实时通信
 *
 * @param server - HTTP 服务器实例
 * @returns Socket.io 服务器实例
 */
function initSocketIO(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: config_1.default.cors.origins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        // 连接配置
        pingTimeout: 60000, // 60秒无响应断开
        pingInterval: 25000 // 25秒发送一次心跳
    });
    /**
     * Socket.io 认证中间件
     *
     * 验证客户端连接时携带的 JWT Token
     */
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            // 开发环境允许无 token 连接（方便调试）
            if (config_1.default.server.nodeEnv === 'development') {
                logger_1.default.warn('Socket 连接未携带 token（开发模式允许）');
                socket.userId = 'dev-user';
                return next();
            }
            return next(new Error('未授权的连接'));
        }
        // 验证 JWT Token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            socket.userId = decoded.id;
            next();
        }
        catch (err) {
            logger_1.default.warn('Socket 连接 token 验证失败', { error: err.message });
            next(new Error('无效的认证令牌'));
        }
    });
    /**
     * 连接事件处理
     */
    io.on('connection', (socket) => {
        logger_1.default.info('Socket 客户端连接', {
            socketId: socket.id,
            userId: socket.userId
        });
        // 加入用户专属房间（用于进度推送）
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
            logger_1.default.debug('用户加入房间', { room: `user:${socket.userId}` });
        }
        // 断开连接
        socket.on('disconnect', (reason) => {
            logger_1.default.info('Socket 客户端断开', {
                socketId: socket.id,
                userId: socket.userId,
                reason
            });
        });
        // 错误处理
        socket.on('error', (error) => {
            logger_1.default.error('Socket 错误', {
                socketId: socket.id,
                error: error.message
            });
        });
        // 订阅任务进度
        socket.on('subscribe:task', (taskId) => {
            socket.join(`task:${taskId}`);
            logger_1.default.debug('订阅任务进度', { taskId, socketId: socket.id });
        });
        // 取消订阅任务进度
        socket.on('unsubscribe:task', (taskId) => {
            socket.leave(`task:${taskId}`);
            logger_1.default.debug('取消订阅任务进度', { taskId, socketId: socket.id });
        });
    });
    return io;
}
/**
 * 主函数
 *
 * 启动服务器
 */
function main() {
    // 创建必要的目录
    ensureDirectories();
    // 创建 Express 应用
    const app = (0, app_1.default)();
    // 创建 HTTP 服务器
    const server = http_1.default.createServer(app);
    // 初始化 Socket.io
    const io = initSocketIO(server);
    // 将 io 实例挂载到 app 上，供其他模块使用
    app.set('io', io);
    // 初始化转码工作进程
    (0, workers_1.initWorkers)(app);
    // 启动定时清理任务（每天凌晨 3 点执行）
    (0, clean_1.startScheduledClean)('0 3 * * *');
    // 启动服务器
    const PORT = config_1.default.server.port;
    server.listen(PORT, () => {
        logger_1.default.info('=================================');
        logger_1.default.info('  my-customTools 后端服务启动成功');
        logger_1.default.info('=================================');
        logger_1.default.info(`端口: ${PORT}`);
        logger_1.default.info(`环境: ${config_1.default.server.nodeEnv}`);
        logger_1.default.info(`地址: ${config_1.default.server.baseUrl}`);
        logger_1.default.info(`API 文档: ${config_1.default.server.baseUrl}/api/system/health`);
        logger_1.default.info('---------------------------------');
    });
    // 优雅关闭
    process.on('SIGTERM', async () => {
        logger_1.default.info('收到 SIGTERM 信号，开始优雅关闭...');
        // 停止工作进程
        await (0, workers_1.stopWorkers)();
        // 停止定时清理任务
        (0, clean_1.stopScheduledClean)();
        // 关闭队列
        await (0, queue_1.closeQueues)();
        // 关闭 Socket.io
        io.close(() => {
            logger_1.default.info('Socket.io 已关闭');
        });
        // 关闭 HTTP 服务器
        server.close(() => {
            logger_1.default.info('HTTP 服务器已关闭');
            process.exit(0);
        });
    });
    process.on('SIGINT', async () => {
        logger_1.default.info('收到 SIGINT 信号，开始优雅关闭...');
        // 停止工作进程
        await (0, workers_1.stopWorkers)();
        // 停止定时清理任务
        (0, clean_1.stopScheduledClean)();
        // 关闭队列
        await (0, queue_1.closeQueues)();
        io.close(() => {
            logger_1.default.info('Socket.io 已关闭');
        });
        server.close(() => {
            logger_1.default.info('HTTP 服务器已关闭');
            process.exit(0);
        });
    });
    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
        logger_1.default.error('未捕获的异常', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        logger_1.default.error('未处理的 Promise 拒绝', {
            reason: reason?.message || reason,
            stack: reason?.stack
        });
    });
}
// 启动服务
main();
//# sourceMappingURL=server.js.map