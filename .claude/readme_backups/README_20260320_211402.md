# my-customTools

媒体转码工具集 - 支持视频、图片、文档等多种格式的转换处理

![Status](https://img.shields.io/badge/status-stable-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 功能特性

### 核心功能

- **视频转码** - 支持 H.264、H.265、VP9 等编码，可调整分辨率、码率、帧率
- **图片转码** - 支持 JPEG、PNG、WebP、AVIF 等格式，可调整质量、尺寸
- **文档转换** - 支持 Word/Excel 转 PDF、PDF 合并拆分、Excel 转 CSV
- **动图处理** - 支持 GIF、WebP、APNG 等格式转换

### 技术特性

- 🔐 JWT 认证 + 角色权限控制
- 📦 分片上传 + 断点续传
- ⚡ Bull 队列 + 异步任务处理
- 🔄 Socket.io 实时进度推送
- 🗄️ SQLite + Redis 数据存储
- 🎨 Vue 3 + Vben Admin 现代化 UI

## 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | 22.x | 运行时环境 |
| pnpm | 最新版 | 包管理器 |
| FFmpeg | 4.0+ | 视频/动图转码（系统安装） |
| Redis | 6.0+ | 任务队列 |

### 安装与启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd my-customTools

# 2. 安装后端依赖
cd backend
pnpm install

# 3. 启动 Redis（Windows）
net start Redis

# 4. 启动后端服务
pnpm dev

# 5. 安装前端依赖（新终端）
cd frontend/apps/web-antdv-next
pnpm install

# 6. 启动前端服务
pnpm dev
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:6001 | Vben Admin 界面 |
| 后端 API | http://localhost:3001 | RESTful API |
| API 文档 | http://localhost:3001/api-docs | Swagger UI |
| 健康检查 | http://localhost:6001/api/system/health | 服务状态 |

### 默认账号

```
用户名：admin
密码：admin123
```

## 项目结构

```
my-customTools/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── routes/          # API 路由层
│   │   ├── services/        # 业务逻辑层
│   │   ├── middlewares/     # 中间件（认证/限流）
│   │   ├── workers/         # 队列消费者
│   │   ├── encoders/        # 编码器插件
│   │   ├── db/              # 数据持久化
│   │   └── config/          # 配置管理
│   ├── docs/                # 后端文档
│   └── Dockerfile           # 容器化部署
│
├── frontend/                # 前端应用
│   └── apps/web-antdv-next/
│       ├── src/
│       │   ├── views/       # 页面组件
│       │   ├── components/  # 通用组件
│       │   ├── api/         # API 客户端
│       │   ├── store/       # 状态管理
│       │   └── router/      # 路由配置
│       └── vite.config.ts   # Vite 配置
│
├── CLAUDE.md                # 开发规范
├── TEST_REPORT.md           # 联调测试报告
└── README.md                # 项目说明
```

## 页面清单

| 页面 | 路径 | 功能 |
|------|------|------|
| 登录页 | `/auth/login` | 用户登录（滑块验证） |
| Dashboard | `/dashboard` | 系统仪表盘 |
| 视频转码 | `/video` | 视频上传 + 转码配置 |
| 图片转码 | `/image` | 图片上传 + 转换配置 |
| 文档转换 | `/document` | 文档上传 + 格式转换 |
| 任务管理 | `/tasks` | 全部任务列表 |
| 系统配置 | `/config` | 系统参数设置 |
| 用户配置 | `/profile` | 个人偏好设置 |

## API 接口概览

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 退出登录 |

### 任务接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 任务列表 |
| GET | `/api/tasks/:id` | 任务详情 |
| POST | `/api/tasks/:id/cancel` | 取消任务 |
| POST | `/api/tasks/:id/retry` | 重试任务 |

### 转码接口

| 类型 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 视频 | POST | `/api/video/transcode` | 视频转码 |
| 图片 | POST | `/api/image/convert` | 图片转换 |
| 文档 | POST | `/api/document/convert` | 文档转换 |

完整 API 文档请访问：http://localhost:3001/api-docs

## 开发规范

### 代码风格

- **TypeScript** - 严格模式，禁止 `any`
- **缩进** - 2 空格
- **引号** - 单引号
- **命名** - kebab-case（文件），PascalCase（组件）

### 提交规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
refactor: 重构
test: 测试
chore: 杂项
```

### 注释模板

```typescript
/**
 * @描述 简述功能
 * @参数 {string} param - 参数说明
 * @返回 {boolean} 返回值说明
 * @注意 副作用/依赖/边界限制
 */
```

## 测试报告

详细测试结果请参阅：

- [TEST_REPORT.md](./TEST_REPORT.md) - 前后端联调测试报告
- [backend/docs/test-report.md](./backend/docs/test-report.md) - 后端 API 测试报告
- [frontend/INTEGRATION_TEST.md](./frontend/INTEGRATION_TEST.md) - 前端集成测试

## 常见问题

### Redis 启动失败

```bash
# Windows 检查服务
sc query Redis

# 启动服务
net start Redis
```

### FFmpeg 未找到

```bash
# 检查是否安装
ffmpeg -version

# Windows 安装
choco install ffmpeg

# macOS 安装
brew install ffmpeg
```

### 端口被占用

```bash
# 查看端口占用
netstat -ano | findstr :3001

# 终止进程
taskkill /PID <PID> /F
```

## 许可证

MIT
