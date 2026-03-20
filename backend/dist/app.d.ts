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
import { Application } from 'express';
/**
 * 创建 Express 应用实例
 *
 * @returns Express 应用实例
 */
declare function createApp(): Application;
export default createApp;
//# sourceMappingURL=app.d.ts.map