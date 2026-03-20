# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 回复偏好

```
语言:   中文（技术术语保留英文）
长度:   简洁优先，复杂问题才展开
代码:   块必须标注语言，注释用中文
警告:   用 ⚠️ 标出，步骤用编号
```

## 项目概述

`my_customTools` 是一个媒体转码工具集，支持视频、图片、文档等多种格式的转换处理。

### 核心功能

- **视频转码**：支持 H.264、H.265、VP9 等编码，可调整分辨率、码率、帧率
- **图片转码**：支持 JPEG、PNG、WebP、AVIF 等格式，可调整质量、尺寸
- **文档转换**：支持 Word/Excel 转 PDF、PDF 合并拆分、Excel 转 CSV
- **动图处理**：支持 GIF、WebP、APNG 等格式转换

## 技术栈

### 后端 (backend/)

- Node.js 22.x + Express
- FFmpeg（视频/动图转码）
- Sharp（图片处理）
- Bull + Redis（任务队列）
- Socket.io（实时进度推送）
- JWT 认证

### 前端 (frontend/)

- Vue 3 + TypeScript + Vite
- Vben Admin 5.x（基于 Ant Design Vue 4.x）
- Pinia + Vue Router 4

## 架构设计

### 后端分层架构

```
routes/        → 路由层：接收请求，不写业务逻辑
middlewares/   → 中间件：JWT鉴权、上传、参数校验、错误处理
services/      → 服务层：核心业务逻辑
workers/       → 工作进程：队列消费者，执行转码
encoders/      → 编码器：插件式设计（H264/H265/VP9/Sharp/GIF等）
storage/       → 存储适配器：本地/S3抽象
db/            → 数据持久化：SQLite + Redis
```

### 前端页面结构

```
/video         → 视频转码页面（上传+任务列表+配置）
/image         → 图片转码页面（上传+任务列表+配置）
/document      → 文档转换页面（上传+任务列表+配置）
/tasks         → 全部任务管理页面
/settings      → 系统配置页面
/profile       → 用户偏好设置（主题/语言/通知）
/dashboard     → 系统仪表盘
```

### 前端模块划分

```
views/         → 页面组件
  video/       → 视频转码页面
  image/       → 图片转码页面
  document/    → 文档转换页面
  tasks/       → 任务管理页面
  settings/    → 系统配置页面
  dashboard/   → 仪表盘页面
  _core/       → 核心页面（登录、个人设置等）
components/    → 通用组件
  common/      → SizeSelector、LoadingOverlay、EmptyState 等
stores/        → 状态管理
  auth.ts      → 认证状态
  tasks.ts     → 任务状态
  upload.ts    → 上传状态
  settings.ts  → 配置状态
api/           → API 封装
  core/        → 核心 API（auth、tasks、upload、config、preferences 等）
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

### 前端组件命名

- 页面组件：大驼峰，放在 `views/` 目录下
- 通用组件：大驼峰，放在 `components/common/` 目录下
- 使用 `<script setup lang="ts">` 语法

### 数据格式化规范

所有页面统一使用 `#/utils` 中的格式化函数：

```typescript
import { formatFileSize, formatTime, formatPercent, formatUsageRate } from '#/utils';
```

- `formatFileSize(bytes)` - 文件大小格式化（如：1.23 MB）
- `formatTime(dateStr)` - 时间格式化（如：2024-01-01 12:00:00）
- `formatPercent(value, decimals)` - 百分比格式化（如：95%）
- `formatUsageRate(value)` - 使用率格式化（如：45.3%）

### 用户偏好 API

```
GET  /api/user/preferences     → 获取用户偏好
PUT  /api/user/preferences     → 更新用户偏好
POST /api/user/preferences/reset → 重置用户偏好
```

用户偏好结构：
```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: {
    taskCompleted: boolean;
    taskFailed: boolean;
    soundEnabled: boolean;
  };
}
```

## 环境依赖

| 依赖    | 版本要求 | 说明                       |
| ------- | -------- | -------------------------- |
| Node.js | 22.x     | 运行时                     |
| pnpm    | 最新版   | 包管理器（优先使用）       |
| FFmpeg  | 4.0+     | 视频/动图转码（系统安装）  |
| Redis   | 6.0+     | 任务队列                   |

## 开发命令

### 后端 (backend/)

```bash
pnpm --prefix backend dev      # 开发模式（热重载）
pnpm --prefix backend start    # 生产模式
pnpm --prefix backend test     # 运行测试
```

### 前端 (frontend/)

```bash
cd frontend/apps/web-antd && pnpm dev    # 开发模式
pnpm --prefix frontend build             # 构建生产版本
```

## 扩展点

- 新增编码器：在 `backend/src/encoders/video/` 或 `encoders/image/` 添加，注册到 `EncoderRegistry`
- 新增存储后端：实现 `backend/src/utils/storage.ts` 接口
- 新增转码类型页面：参考 `views/video/index.vue` 创建新页面，添加路由

## 能力边界

```
✅ 直接用 实现功能 | 调试 | 生成测试 | 解释代码 | 方案对比
⚠️ 需确认 数据库变更 | 第三方集成 | 核心权限逻辑 | 生产配置
❌ 不适合 跨系统架构重设计 | 安全审计 | 性能基准测试方案
```