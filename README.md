# my_customTools

> 统一媒体转码工具集 - 视频转码 & 图片转码 & 文档转换 & 消息推送

## ✨ 功能特性

### 转码功能

- **视频转码**：支持 H.264、H.265、VP9、AV1 等编码格式，可调整分辨率、码率、帧率
- **图片转码**：支持 JPEG、PNG、WebP、AVIF、BMP、TIFF、ICO、HEIC 等格式转换
- **文档转换**：Word 转 PDF、Excel 转 CSV、PDF 合并拆分、Excel 转 Word
- **动图处理**：GIF、WebP、APNG 格式转换，支持视频截取转 GIF

### 消息推送

- **实时通知**：WebSocket 实时推送新消息，无需刷新页面
- **消息分类**：支持普通消息和待办消息两种类型
- **未读提示**：右上角铃铛图标显示未读红点 badge
- **消息预览**：弹出层展示最近 5 条消息预览
- **消息管理**：支持标记已读、清空消息、删除单条
- **消息列表**：完整消息中心页面，支持类型筛选、已读/未读筛选、分页查询

## 🛠️ 技术栈

### 后端 (backend/)

| 技术 | 用途 |
|------|------|
| Node.js 22.x | 运行时环境 |
| Express | Web 框架 |
| Socket.io | WebSocket 实时通信 |
| Bull + Redis | 任务队列 |
| Better-SQLite3 | 数据持久化 |
| FFmpeg | 视频/动图转码 |
| Sharp | 图片处理 |
| JWT | 认证授权 |

### 前端 (frontend/)

| 技术 | 用途 |
|------|------|
| Vue 3 + TypeScript | 前端框架 |
| Vite | 构建工具 |
| Vben Admin 5.x | 管理后台框架 |
| Ant Design Vue 4.x | UI 组件库 |
| Pinia | 状态管理 |
| Vue Router 4 | 路由管理 |
| Socket.io-client | WebSocket 客户端 |

## 🚀 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | 22.x | 运行时 |
| pnpm | 最新版 | 包管理器 |
| FFmpeg | 4.0+ | 视频转码（系统安装） |
| Redis | 6.0+ | 任务队列 |

### 安装依赖

```bash
# 后端依赖
cd backend && pnpm install

# 前端依赖
cd frontend/apps/web-antd && pnpm install
```

### 启动开发服务

```bash
# 启动后端（终端 1）
pnpm --prefix backend dev

# 启动前端（终端 2）
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

## 📁 项目结构

```
my_customTools/
├── backend/
│   ├── src/
│   │   ├── routes/        # 路由层
│   │   ├── middlewares/   # 中间件
│   │   ├── services/      # 服务层
│   │   ├── workers/       # 工作进程
│   │   ├── encoders/      # 编码器插件
│   │   ├── db/            # 数据持久化
│   │   ├── socket/        # Socket.io 模块
│   │   ├── queue/         # 队列模块
│   │   ├── utils/         # 工具函数
│   │   ├── config/        # 配置管理
│   │   └── types/         # 类型定义
│   └── package.json
├── frontend/
│   └── apps/web-antd/
│       └── src/
│           ├── views/         # 页面组件
│           ├── components/    # 通用组件
│           ├── stores/        # Pinia 状态
│           ├── api/           # API 封装
│           ├── router/        # 路由配置
│           └── utils/         # 工具函数
├── CLAUDE.md
└── README.md
```

## 📝 API 文档

### 消息推送 API

| 方法 | 路径 | 描述 |
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

```javascript
socket.emit('subscribe:task', taskId)      // 订阅任务进度
socket.emit('unsubscribe:task', taskId)    // 取消订阅
socket.emit('subscribe:queue')             // 订阅队列状态
```

**服务端 → 客户端：**

```javascript
socket.on('message:push', (message) => {})    // 新消息推送
socket.on('task:progress', (data) => {})      // 任务进度更新
socket.on('task:completed', (data) => {})     // 任务完成
socket.on('task:failed', (data) => {})        // 任务失败
socket.on('queue:update', (data) => {})       // 队列状态更新
socket.on('system:notice', (data) => {})      // 系统通知
```

### 消息数据结构

```typescript
type MessageType = 'normal' | 'todo';

interface Message {
  id: string;          // 消息 ID
  userId: string;      // 接收用户 ID
  type: MessageType;   // 消息类型
  title: string;       // 消息标题
  content: string;     // 消息内容
  isRead: boolean;     // 是否已读
  link?: string;       // 相关链接
  createdAt: string;   // 创建时间
  readAt?: string;     // 阅读时间
}
```

## 🧪 测试

```bash
# 后端测试
pnpm --prefix backend test

# 前端测试
cd frontend/apps/web-antd && pnpm test
```

## 📋 开发规范

### 代码规范

- TypeScript 项目禁止使用 `any`
- 函数必须有类型注解
- 提交信息遵循 Conventional Commits 规范

### 提交规范

```
feat(scope): 新增功能描述
fix(scope): 修复问题描述
docs: 文档更新
test: 测试相关
chore: 构建/工具链相关
```

## 🔧 扩展开发

### 新增编码器

在 `backend/src/encoders/` 目录下创建新的编码器模块，并注册到对应的 `EncoderRegistry`。

### 新增消息类型

修改 `backend/src/types/index.ts` 中的 `MessageType` 类型定义，并更新前端相关组件。

## 📄 许可证

MIT License

---

> 最后更新：2026-03-21
