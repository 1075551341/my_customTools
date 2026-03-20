# 项目规则 (Cursor)

> 此文件同步自 .claude 配置，为 Cursor AI 提供项目上下文

## 项目概述

`my_customTools` 是一个媒体转码工具集，包含：
- **video-transcoder**：视频转码工具
- **img-transcoder**：图片/动图转码工具

## 技术栈

### 后端 (backend/)
- Node.js + Express
- FFmpeg（视频/动图转码）
- Sharp（图片处理）
- Bull + Redis（任务队列）
- Socket.io（实时进度推送）
- JWT 认证

### 前端 (frontend/)
- Vue 3 + TypeScript + Vite
- Ant Design Vue 4.x
- Pinia + Vue Router 4

## 架构设计

### 后端分层架构
```
routes/        → 路由层：接收请求，不写业务逻辑
middlewares/   → 中间件：JWT鉴权、上传、参数校验、错误处理
services/      → 服务层：核心业务逻辑
workers/       → 工作进程：队列消费者，执行转码
encoders/      → 编码器：插件式设计（H264/H265/VP9/AV1/Sharp/GIF等）
storage/       → 存储适配器：本地/S3抽象
db/            → 数据持久化：JSON文件模拟数据库
```

### 前端模块划分
```
views/         → 页面：Dashboard/Upload/Tasks/Gallery/Settings
components/    → 组件：layout/upload/config/task/gallery/common
stores/        → 状态管理：user/tasks/upload/gallery/settings
api/           → API封装：request/upload/tasks/download/config
```

## 开发规范

### API 响应格式
```json
{ "code": 0, "msg": "ok", "data": {} }
```

### 任务状态流转
```
waiting → uploading → processing → completed/failed/cancelled
```

## 环境依赖

| 依赖    | 版本要求 | 说明                       |
| ------- | -------- | -------------------------- |
| Node.js | 22.x     | 运行时（统一使用 22 版本） |
| pnpm    | 最新版   | 包管理器（优先使用）       |
| FFmpeg  | 4.0+     | 视频/动图转码（系统安装）  |
| Redis   | 6.0+     | 任务队列                   |

## 开发命令

### 后端 (backend/)
```bash
pnpm dev        # 开发模式（热重载）
pnpm start      # 生产模式
```

### 前端 (frontend/)
```bash
pnpm dev        # 开发模式
pnpm build      # 构建生产版本
pnpm preview    # 预览构建结果
```

## 扩展点

- 新增编码器：在 `encoders/video/` 或 `encoders/image/` 添加，注册到 `EncoderRegistry`
- 新增存储后端：实现 `storage/BaseStorage.js` 接口
- 切换数据库：替换 `db/` 层实现，服务层接口不变