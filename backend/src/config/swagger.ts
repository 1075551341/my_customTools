/**
 * Swagger/OpenAPI 配置
 *
 * 自动生成 API 文档
 *
 * @module config/swagger
 */

import swaggerJsdoc from 'swagger-jsdoc'

/**
 * Swagger 配置选项
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'my-customTools API',
      version: '1.0.0',
      description: '统一后端服务 API 文档 - 视频转码 & 图片转码工具集',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '开发服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // 通用响应
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 0 },
            msg: { type: 'string', example: 'ok' },
            data: { type: 'object' },
          },
        },
        // 错误响应
        ErrorResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 400 },
            msg: { type: 'string', example: '错误描述' },
            data: { type: 'object', nullable: true },
          },
        },
        // 用户
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 任务
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['video', 'img', 'anim', 'document'] },
            userId: { type: 'string' },
            fileName: { type: 'string' },
            fileSize: { type: 'integer' },
            inputFormat: { type: 'string' },
            outputFormat: { type: 'string' },
            status: {
              type: 'string',
              enum: ['waiting', 'uploading', 'processing', 'completed', 'failed', 'cancelled'],
            },
            progress: { type: 'integer', minimum: 0, maximum: 100 },
            errorMsg: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 系统配置
        SystemConfig: {
          type: 'object',
          properties: {
            video: {
              type: 'object',
              properties: {
                parallelLimit: { type: 'integer' },
                maxFileSize: { type: 'integer' },
                allowedInputFormats: { type: 'array', items: { type: 'string' } },
              },
            },
            img: {
              type: 'object',
              properties: {
                parallelLimit: { type: 'integer' },
                maxFileSize: { type: 'integer' },
                allowedInputFormats: { type: 'array', items: { type: 'string' } },
              },
            },
            upload: {
              type: 'object',
              properties: {
                chunkSize: { type: 'integer' },
                maxParallelUploads: { type: 'integer' },
              },
            },
            storage: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['local', 's3'] },
                autoClean: { type: 'boolean' },
                cleanDays: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: '认证相关接口' },
      { name: 'Tasks', description: '任务管理接口' },
      { name: 'Upload', description: '文件上传接口' },
      { name: 'Download', description: '文件下载接口' },
      { name: 'Config', description: '系统配置接口' },
      { name: 'System', description: '系统状态接口' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.yaml'],
}

/**
 * Swagger 文档规格
 */
export const swaggerSpec = swaggerJsdoc(options)

/**
 * Swagger UI 选项
 */
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'my-customTools API Docs',
}