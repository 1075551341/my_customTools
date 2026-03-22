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

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config";
import logger from "./utils/logger";
import routes from "./routes";
import swaggerRouter from "./routes/swagger";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler";

/**
 * 创建 Express 应用实例
 *
 * @returns Express 应用实例
 */
function createApp(): Application {
  const app: Application = express();

  // ==================== 基础中间件 ====================

  /**
   * CORS 跨域配置
   *
   * 允许指定的前端域名访问 API
   */
  app.use(
    cors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // 允许无 origin 的请求（如 Postman、服务器内部调用）
        if (!origin) return callback(null, true);

        // 检查是否在允许列表中
        if (config.cors.origins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn("CORS 阻止请求", {
            origin,
            allowed: config.cors.origins,
          });
          callback(null, false);
        }
      },
      credentials: true, // 允许携带 Cookie
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),
  );

  /**
   * Cookie 解析中间件
   *
   * 解析请求中的 Cookie，用于 HttpOnly Cookie 认证
   */
  app.use(cookieParser());

  /**
   * JSON 请求体解析
   *
   * 限制请求体大小为 50MB，支持大文件上传时的元数据
   */
  app.use(express.json({ limit: "50mb" }));

  /**
   * URL 编码请求体解析
   *
   * 支持传统的表单提交
   */
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  /**
   * 设置响应头编码
   *
   * 确保所有 JSON 响应使用 UTF-8 编码
   */
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
  });

  // ==================== 请求日志中间件 ====================

  /**
   * 请求日志记录
   *
   * 记录每个请求的方法、路径、响应时间
   */
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // 响应完成后记录日志
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.socket.remoteAddress,
      };

      // 根据状态码选择日志级别
      if (res.statusCode >= 400) {
        logger.warn("请求失败", logData);
      } else {
        logger.info("请求完成", logData);
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
  app.use("/api-docs", swaggerRouter);

  /**
   * API 路由
   *
   * 所有业务路由统一前缀：/api
   */
  app.use("/api", routes);

  // ==================== 错误处理 ====================

  /**
   * 404 处理
   *
   * 当请求路径不存在时返回 404 错误
   */
  app.use(notFoundHandler);

  /**
   * 全局错误处理
   *
   * 捕获所有未处理的错误，统一返回错误响应格式
   */
  app.use(errorHandler);

  return app;
}

export default createApp;
