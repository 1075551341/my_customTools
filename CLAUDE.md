# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供项目开发指南。

## 回复偏好

```
语言：  中文（技术术语保留英文）
长度：  简洁优先，复杂问题才展开
代码：  块必须标注语言，注释用中文
警告：  用 ⚠️ 标出，步骤用编号
```

## 项目概述

`my_customTools` 是一个媒体转码工具集，支持视频、图片、文档等多种格式的转换处理。

### 核心功能

- **视频转码**：支持 H.264、H.265、VP9、AV1 等编码格式，可调整分辨率、码率、帧率
- **图片转码**：支持 JPEG、PNG、WebP、AVIF、BMP、TIFF、ICO、HEIC 等格式转换
- **文档转换**：Word 转 PDF、Excel 转 CSV、PDF 合并拆分、Excel 转 Word
- **动图处理**：GIF、WebP、APNG 格式转换，支持视频截取转 GIF
- **消息推送**：实时消息通知中心
  - 支持普通消息和待办消息两种类型
  - WebSocket 实时推送新消息
  - 消息列表分页查询、标记已读、删除
  - 未读消息红点提示

## 技术栈

### 后端 (backend/)

| 技术           | 用途               |
| -------------- | ------------------ |
| Node.js 22.x   | 运行时环境         |
| Express        | Web 框架           |
| Socket.io      | WebSocket 实时通信 |
| Bull + Redis   | 任务队列           |
| Better-SQLite3 | 数据持久化         |
| FFmpeg         | 视频/动图转码      |
| Sharp          | 图片处理           |
| JWT            | 认证授权           |

### 前端 (frontend/)

| 技术               | 用途             |
| ------------------ | ---------------- |
| Vue 3 + TypeScript | 前端框架         |
| Vite               | 构建工具         |
| Vben Admin 5.x     | 管理后台框架     |
| Ant Design Vue 4.x | UI 组件库        |
| Pinia              | 状态管理         |
| Vue Router 4       | 路由管理         |
| Socket.io-client   | WebSocket 客户端 |

## 快速开始

### 环境要求

| 依赖    | 版本   | 说明                 |
| ------- | ------ | -------------------- |
| Node.js | 22.x   | 运行时               |
| pnpm    | 最新版 | 包管理器             |
| FFmpeg  | 4.0+   | 视频转码（系统安装） |
| Redis   | 6.0+   | 任务队列             |

### 启动开发服务

```bash
# 终端 1：启动后端
pnpm --prefix backend dev

# 终端 2：启动前端
cd frontend/apps/web-antd && pnpm dev
```

### 生产构建

```bash
# 后端构建
pnpm --prefix backend build
pnpm --prefix backend start

# 前端构建
pnpm --prefix frontend build
```

## 架构设计

### 后端分层架构

```
routes/        → 路由层：接收请求，不写业务逻辑
middlewares/   → 中间件：JWT 鉴权、上传、参数校验、错误处理
services/      → 服务层：核心业务逻辑
workers/       → 工作进程：队列消费者，执行转码
encoders/      → 编码器：插件式设计（H264/H265/VP9/Sharp/GIF 等）
storage/       → 存储适配器：本地/S3 抽象
db/            → 数据持久化：SQLite + Redis
socket/        → Socket.io 实时通信
queue/         → Bull 队列管理
```

### 前端页面结构

```
/video          → 视频转码页面
/image          → 图片转码页面
/document       → 文档转换页面
/tasks          → 全部任务管理页面
/settings       → 系统配置页面
/profile        → 用户偏好设置
/dashboard      → 系统仪表盘
/message        → 消息中心页面
```

## 开发规范

### API 响应格式

```json
{ "code": 0, "msg": "ok", "data": {} }
```

错误响应：
```json
{ "code": -1, "msg": "错误描述", "data": null }
```

### 任务状态流转

```
waiting → uploading → processing → completed/failed/cancelled
```

### 前端组件规范

- 页面组件：大驼峰，放在 `views/` 目录下
- 通用组件：大驼峰，放在 `components/common/` 目录下
- 使用 `<script setup lang="ts">` 语法
- 禁止使用 `any` 类型

### 数据格式化规范

统一使用 `#/utils` 中的格式化函数：

```typescript
import {
  formatFileSize,
  formatTime,
  formatPercent,
  formatUsageRate,
} from "#/utils";
```

| 函数 | 说明 | 示例 |
|------|------|------|
| `formatFileSize(bytes)` | 文件大小格式化 | `1.23 MB` |
| `formatTime(dateStr)` | 时间格式化 | `2024-01-01 12:00:00` |
| `formatPercent(value, decimals)` | 百分比格式化 | `95%` |
| `formatUsageRate(value)` | 使用率格式化 | `45.3%` |

## API 文档

### 认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 转码任务 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 获取任务列表（分页） |
| GET | `/api/tasks/:id` | 获取任务详情 |
| POST | `/api/tasks/:id/cancel` | 取消任务 |
| POST | `/api/tasks/:id/retry` | 重试任务 |
| DELETE | `/api/tasks/:id` | 删除任务 |

### 上传 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传文件并创建转码任务 |
| POST | `/api/upload/chunk` | 分片上传 |

### 消息推送 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/messages` | 获取消息列表（分页） |
| GET | `/api/messages/unread-count` | 获取未读消息数量 |
| GET | `/api/messages/latest` | 获取最新 5 条消息 |
| PUT | `/api/messages/:id/read` | 标记消息为已读 |
| PUT | `/api/messages/read-all` | 标记全部为已读 |
| DELETE | `/api/messages/:id` | 删除单条消息 |
| DELETE | `/api/messages/all` | 清空所有消息 |
| POST | `/api/messages` | 创建消息（管理员专用） |

### WebSocket 事件

**客户端 → 服务端：**

```typescript
socket.emit("subscribe:task", taskId);  // 订阅任务进度
socket.emit("unsubscribe:task", taskId); // 取消订阅
socket.emit("subscribe:queue");         // 订阅队列状态
socket.emit("subscribe:message");       // 订阅消息推送
```

**服务端 → 客户端：**

```typescript
socket.on("message:push", (message) => {});    // 新消息推送
socket.on("task:progress", (data) => {});      // 任务进度更新
socket.on("task:completed", (data) => {});     // 任务完成
socket.on("task:failed", (data) => {});        // 任务失败
socket.on("queue:update", (data) => {});       // 队列状态更新
socket.on("system:notice", (data) => {});      // 系统通知
```

### 消息数据结构

```typescript
type MessageType = "normal" | "todo";

interface Message {
  id: string;         // 消息 ID
  userId: string;     // 接收用户 ID
  type: MessageType;  // 消息类型
  title: string;      // 消息标题
  content: string;    // 消息内容
  isRead: boolean;    // 是否已读
  link?: string;      // 相关链接
  createdAt: string;  // 创建时间
  readAt?: string;    // 阅读时间
}
```

## 扩展开发

### 新增编码器

在 `backend/src/encoders/` 目录下创建新的编码器模块，并注册到对应的 `EncoderRegistry`。

使用技能 `/new-encoder` 可自动生成编码器模板。

### 新增 API 路由

使用技能 `/api-route` 可自动生成符合项目规范的路由、服务和类型定义。

### 新增 Vue 组件

使用技能 `/vue-component` 可自动生成符合 Vben Admin 规范的 Vue 3 组件。

## 常用技能

| 技能 | 说明 |
|------|------|
| `/new-encoder` | 创建新的转码编码器插件 |
| `/api-route` | 创建新的 API 路由模块 |
| `/vue-component` | 创建 Vue 3 组件 |
| `/api-client` | 创建前端 API 调用封装 |
| `/test-gen` | 生成单元测试文件 |
| `/send-message` | 发送系统通知或待办消息 |
| `/transcode-task` | 管理转码任务 |
| `/ws-debug` | 调试 WebSocket 连接 |

## 常用 Agents

| Agent | 说明 |
|-------|------|
| `api-tester` | 测试后端 API 接口 |
| `api-documenter` | 生成 OpenAPI 文档 |
| `vue-reviewer` | 审查 Vue 组件代码质量 |
| `message-center` | 管理消息推送 |
| `transcode-debug` | 调试转码任务问题 |

## 能力边界

```
✅ 直接执行：实现功能 | 调试 | 生成测试 | 解释代码 | 方案对比
⚠️ 需确认：数据库变更 | 第三方集成 | 核心权限逻辑 | 生产配置
❌ 不适合：跨系统架构重设计 | 安全审计 | 性能基准测试方案
```

---

最后更新：2026-03-21
