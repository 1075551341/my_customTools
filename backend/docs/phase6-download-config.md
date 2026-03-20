# Phase 6 — 下载 & 配置模块

## 概述

本阶段实现了文件下载服务和系统配置管理功能。

## 后端 API

### 下载接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/download/:taskId` | 单文件下载 |
| POST | `/api/download/batch` | 批量打包下载（ZIP） |
| GET | `/api/download/list` | 获取可下载任务列表 |
| GET | `/api/download/size` | 获取用户下载空间占用 |

### 配置接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取系统配置 |
| PUT | `/api/config` | 更新系统配置 |
| POST | `/api/config/reset` | 重置为默认配置 |
| GET | `/api/config/diff` | 获取配置对比 |
| GET | `/api/config/video` | 获取视频配置 |
| GET | `/api/config/img` | 获取图片配置 |
| GET | `/api/config/upload` | 获取上传配置 |
| GET | `/api/config/storage` | 获取存储配置 |

### 系统状态接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/health` | 健康检查（无需认证） |
| GET | `/api/system/status` | 系统状态（CPU/内存/磁盘/队列） |

## 文件结构

### 后端

```
backend/src/
├── db/
│   └── config.ts           # 配置数据持久化
├── services/
│   ├── download.ts         # 下载服务
│   └── config.ts           # 配置服务
└── routes/
    ├── download.ts         # 下载路由
    ├── config.ts           # 配置路由
    └── system.ts           # 系统路由（已增强）
```

### 前端

```
frontend/apps/web-antd/src/api/core/
├── download.ts             # 下载 API 客户端
└── config.ts               # 配置 API 客户端
```

## 功能特性

### 下载服务

- **单文件下载**：支持文件流式传输，自动设置 Content-Type 和 Content-Disposition
- **批量打包下载**：使用 archiver 库生成 ZIP 文件，支持流式压缩
- **权限验证**：用户只能下载自己完成的任务
- **状态验证**：只能下载已完成的任务

### 配置服务

- **JSON 持久化**：配置保存在 `data/config.json` 文件
- **默认值合并**：自动合并默认配置，确保新增字段有值
- **配置验证**：更新配置时验证参数合法性
- **配置对比**：支持查看当前配置与默认配置的差异

### 系统状态

- **系统信息**：CPU、内存、磁盘使用情况
- **队列状态**：视频、图片、动图队列的任务统计
- **优雅降级**：当 systeminformation 或 Redis 不可用时返回基本信息

## 配置结构

```json
{
  "video": {
    "parallelLimit": 3,
    "maxFileSize": 5368709120,
    "allowedInputFormats": ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "ts"]
  },
  "img": {
    "parallelLimit": 5,
    "maxFileSize": 52428800,
    "allowedInputFormats": ["jpg", "png", "webp", "avif", "bmp", "tiff", "gif", "heic"]
  },
  "upload": {
    "chunkSize": 5242880,
    "maxParallelUploads": 2
  },
  "storage": {
    "type": "local",
    "uploadDir": "./uploads",
    "outputDir": "./outputs",
    "autoClean": true,
    "cleanDays": 7
  },
  "updatedAt": "2026-03-19T10:00:00Z"
}
```

## 使用示例

### 下载文件

```bash
# 获取 Token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' | jq -r '.data.accessToken')

# 获取可下载列表
curl http://localhost:3001/api/download/list \
  -H "Authorization: Bearer $TOKEN"

# 下载单个文件
curl http://localhost:3001/api/download/task_xxx \
  -H "Authorization: Bearer $TOKEN" \
  -o output.mp4

# 批量下载
curl -X POST http://localhost:3001/api/download/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskIds":["task_1","task_2"]}' \
  -o results.zip
```

### 管理配置

```bash
# 获取配置
curl http://localhost:3001/api/config \
  -H "Authorization: Bearer $TOKEN"

# 更新配置
curl -X PUT http://localhost:3001/api/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video":{"parallelLimit":5}}'

# 重置配置
curl -X POST http://localhost:3001/api/config/reset \
  -H "Authorization: Bearer $TOKEN"
```

## 依赖

- **archiver**: ZIP 打包
- **systeminformation**: 系统信息采集
- **bull**: 队列状态获取

## 注意事项

1. 下载接口需要用户认证
2. 批量下载最多支持 50 个任务
3. 配置更新会立即生效
4. 队列状态依赖 Redis 连接