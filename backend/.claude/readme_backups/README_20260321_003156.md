# my-customTools Backend

统一后端服务 - 视频转码 & 图片转码工具集

## 快速开始

### 环境要求

- Node.js 22.x
- pnpm (推荐) 或 npm
- FFmpeg 4.0+ (系统安装)
- Redis 6.0+ (任务队列)

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 启动服务

```bash
# 开发模式（热重载）
pnpm dev

# 生产模式
pnpm build
pnpm start

# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage
```

服务启动后访问：
- 健康检查：http://localhost:3001/api/system/health
- API 文档：http://localhost:3001/api-docs

## API 接口

> 完整 API 文档：访问 `/api-docs` 查看 Swagger UI 交互文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/me` | 获取当前用户 |

### 任务接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 获取任务列表 |
| GET | `/api/tasks/:id` | 获取任务详情 |
| POST | `/api/tasks/:id/cancel` | 取消任务 |
| POST | `/api/tasks/:id/retry` | 重试任务 |
| DELETE | `/api/tasks/:id` | 删除任务 |

### 下载接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/download/:taskId` | 单文件下载 |
| POST | `/api/download/batch` | 批量打包下载 |
| GET | `/api/download/list` | 可下载任务列表 |
| GET | `/api/download/size` | 空间占用 |

### 配置接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取系统配置 |
| PUT | `/api/config` | 更新配置 |
| POST | `/api/config/reset` | 重置配置 |

### 系统接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/health` | 健康检查 |
| GET | `/api/system/status` | 系统状态 |
| GET | `/api/export/tasks` | 导出任务报告 |
| POST | `/api/clean/run` | 执行清理 |

## Docker 部署

### 构建镜像

```bash
docker build -t my-customtools-backend .
```

### 使用 docker-compose

```bash
# 生产模式
docker-compose up -d

# 开发模式
docker-compose --profile dev up -d
```

## 目录结构

```
backend/
├── src/
│   ├── db/              # 数据持久化
│   ├── routes/          # API 路由
│   ├── services/        # 业务逻辑
│   ├── middlewares/     # 中间件
│   ├── utils/           # 工具函数
│   ├── queue/           # 任务队列
│   ├── workers/         # 工作进程
│   ├── encoders/        # 编码器
│   └── config/          # 配置
├── dist/                # 编译输出
├── uploads/             # 上传目录
├── outputs/             # 输出目录
├── data/                # 数据目录
└── logs/                # 日志目录
```

## 开发指南

### 代码规范

- TypeScript 严格模式
- ESLint + Prettier
- 注释使用中文

### 提交规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
refactor: 重构
test: 测试
chore: 杂项
```

## 许可证

MIT

## 文档

- [OpenAPI 规范](./docs/openapi.yaml) - 完整 API 文档（59 个接口）
- [详细部署文档](./DEPLOYMENT.md) - 生产环境部署指南
- [测试报告](./docs/test-report.md) - API 测试结果
- [Phase 6 文档](./docs/phase6-download-config.md) - 下载和配置模块说明