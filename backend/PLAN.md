# 统一后端服务 · 开发计划

> **所属工具集**：my_customTools  
> **技术栈**：Node.js + Express + FFmpeg + Sharp + Bull + Socket.io  
> **版本**：v1.0.0  
> **最后更新**：2026-03-08  
> **注意**：本文档为后端核心开发参考，包含大量注释说明，适合前端开发者理解后端逻辑

---

## 目录

1. [项目概述](#1-项目概述)
2. [目录结构](#2-目录结构)
3. [数据库设计（JSON文件持久化）](#3-数据库设计)
4. [API 接口总览](#4-api-接口总览)
5. [各模块详细设计](#5-各模块详细设计)
6. [WebSocket 事件设计](#6-websocket-事件设计)
7. [核心服务说明](#7-核心服务说明)
8. [环境变量配置](#8-环境变量配置)
9. [迭代路线图](#9-迭代路线图)
10. [扩展性说明](#10-扩展性说明)

---

## 1. 项目概述

`backend` 是 `my_customTools` 工具集的**统一后端服务**，同时服务于：
- `video-transcoder`（视频/动图转码工具）
- `img-transcoder`（图片/动图转码工具）
- 工具集统一认证（登录/注册/JWT）

**核心职责**：
- JWT 认证（统一登录/注册/登出）
- 文件上传（普通上传 + 分片上传，两个工具共用同一个接口）
- 视频转码任务（FFmpeg 驱动）
- 图片转码任务（Sharp 驱动 + FFmpeg 处理动图）
- 任务队列管理（Bull + Redis，并行控制）
- 实时进度推送（Socket.io）
- 系统配置持久化（JSON 文件，无需数据库）
- 文件下载 / 批量打包 ZIP

**为什么用 JSON 文件而不是数据库？**  
> 工具集定位为个人/小团队内部使用，JSON 文件持久化无需安装数据库，降低部署复杂度。  
> 如需扩展为多用户生产环境，可替换为 SQLite 或 MongoDB（已在扩展性章节说明）。

---

## 2. 目录结构

```
backend/
├── src/
│   ├── app.js                      # Express 应用入口，注册中间件和路由
│   ├── server.js                   # HTTP 服务器 + Socket.io 初始化入口
│   │
│   ├── config/
│   │   ├── index.js                # 配置读取主入口（合并环境变量和持久化配置）
│   │   ├── defaults.js             # 所有配置项的默认值
│   │   └── schema.js               # 配置项校验规则（用 Joi 或手写）
│   │
│   ├── routes/                     # 路由层：只负责接收请求和返回响应，不写业务逻辑
│   │   ├── index.js                # 汇总注册所有路由
│   │   ├── auth.js                 # 认证路由（登录/注册/刷新token/登出）
│   │   ├── upload.js               # 文件上传路由（普通 + 分片）
│   │   ├── videoTasks.js           # 视频任务路由（CRUD + 取消/重试）
│   │   ├── imgTasks.js             # 图片任务路由（CRUD + 取消/重试）
│   │   ├── download.js             # 文件下载 / ZIP 打包路由
│   │   ├── system.js               # 系统状态路由（CPU/磁盘信息）
│   │   └── config.js               # 系统配置 CRUD 路由
│   │
│   ├── middlewares/                # 中间件层：在请求到达路由前/后进行处理
│   │   ├── auth.js                 # JWT 鉴权中间件（验证 token）
│   │   ├── upload.js               # Multer 上传中间件配置（文件大小/类型限制）
│   │   ├── rateLimit.js            # 请求频率限制（防止恶意请求）
│   │   ├── validate.js             # 请求参数校验中间件
│   │   └── errorHandler.js         # 全局错误处理中间件（统一错误响应格式）
│   │
│   ├── services/                   # 服务层：核心业务逻辑
│   │   ├── authService.js          # 认证业务（登录验证、token生成、用户管理）
│   │   ├── uploadService.js        # 文件上传业务（分片合并、格式校验）
│   │   ├── videoTranscodeService.js # 视频转码业务（创建任务、调用FFmpeg）
│   │   ├── imgTranscodeService.js  # 图片转码业务（创建任务、调用Sharp）
│   │   ├── queueService.js         # 队列管理（Bull队列的封装、优先级控制）
│   │   ├── taskService.js          # 任务通用CRUD（查询/更新/删除任务记录）
│   │   ├── downloadService.js      # 下载业务（文件流、ZIP打包）
│   │   ├── cleanService.js         # 自动清理业务（定时删除过期文件）
│   │   └── configService.js        # 配置读写业务（持久化到JSON文件）
│   │
│   ├── workers/                    # 工作进程层：实际执行转码，由 Bull 队列调度
│   │   ├── videoWorker.js          # 视频转码工作器（消费 video-queue 队列）
│   │   ├── imgWorker.js            # 图片转码工作器（消费 img-queue 队列）
│   │   └── animWorker.js           # 动图转码工作器（消费 anim-queue 队列）
│   │
│   ├── encoders/                   # 插件式编码器（每个编码器独立封装）
│   │   ├── BaseEncoder.js          # 编码器基类（定义 encode() 接口）
│   │   ├── video/
│   │   │   ├── H264Encoder.js      # H.264 编码（FFmpeg libx264）
│   │   │   ├── H265Encoder.js      # H.265 编码（FFmpeg libx265）
│   │   │   ├── VP9Encoder.js       # VP9 编码（FFmpeg libvpx-vp9）
│   │   │   ├── AV1Encoder.js       # AV1 编码（FFmpeg libaom-av1）
│   │   │   └── CopyEncoder.js      # 流复制（不重新编码，仅换容器）
│   │   ├── image/
│   │   │   ├── SharpEncoder.js     # 静态图片（Sharp，支持JPG/PNG/WebP/AVIF）
│   │   │   ├── GifEncoder.js       # GIF 动图（FFmpeg palettegen + paletteuse）
│   │   │   ├── WebPAnimEncoder.js  # WebP 动图（FFmpeg libwebp_anim）
│   │   │   └── ApngEncoder.js      # APNG（FFmpeg apng muxer）
│   │   └── EncoderRegistry.js      # 编码器注册表（根据参数自动选择编码器）
│   │
│   ├── storage/                    # 存储适配器（便于将来切换云存储）
│   │   ├── BaseStorage.js          # 存储基类
│   │   ├── LocalStorage.js         # 本地磁盘存储（当前使用）
│   │   ├── S3Storage.js            # AWS S3（预留，未实现）
│   │   └── StorageFactory.js       # 根据配置自动选择存储实现
│   │
│   ├── db/                         # 数据持久化层（JSON 文件模拟数据库）
│   │   ├── TaskDB.js               # 任务记录的增删改查（读写 tasks.json）
│   │   ├── UserDB.js               # 用户记录（读写 users.json）
│   │   └── ConfigDB.js             # 系统配置（读写 config.json）
│   │
│   ├── socket/
│   │   ├── index.js                # Socket.io 初始化和事件注册
│   │   └── events.js               # 事件名常量（防止拼写错误）
│   │
│   └── utils/
│       ├── ffmpeg.js               # FFmpeg 命令封装（fluent-ffmpeg 封装）
│       ├── sharp.js                # Sharp 封装（图片处理参数映射）
│       ├── ffprobe.js              # 视频/图片元信息探测（ffprobe 封装）
│       ├── logger.js               # 日志工具（Winston，分级别输出到文件和控制台）
│       ├── response.js             # 统一响应格式工具函数
│       ├── validator.js            # 参数校验工具（Joi schema）
│       ├── zipBuilder.js           # ZIP 打包工具（archiver 封装）
│       ├── systemInfo.js           # 系统资源信息（CPU/内存/磁盘用量）
│       └── idGenerator.js          # UUID 生成工具
│
├── data/                           # 数据目录（JSON 文件存储，不提交到 git）
│   ├── tasks.json                  # 任务记录
│   ├── users.json                  # 用户记录
│   └── config.json                 # 系统配置
│
├── uploads/                        # 上传文件临时目录（处理完毕后可清理）
│   ├── chunks/                     # 分片上传临时目录
│   └── complete/                   # 已完成合并的文件
│
├── outputs/
│   ├── video/                      # 视频转码输出目录
│   └── img/                        # 图片转码输出目录
│
├── logs/                           # 日志目录（不提交到 git）
│   ├── combined.log                # 所有日志
│   ├── error.log                   # 仅错误日志
│   └── access.log                  # 访问日志
│
├── .env.example                    # 环境变量模板（提交到 git）
├── .env                            # 实际环境变量（不提交到 git）
├── .gitignore
├── package.json
└── README.md
```

---

## 3. 数据库设计

### tasks.json — 任务记录

```json
{
  "tasks": [
    {
      "id": "uuid-xxxx",
      "type": "video",              // "video" | "img" | "anim"
      "userId": "user-id",
      "fileName": "input.mp4",
      "fileSize": 1073741824,
      "inputPath": "/uploads/complete/uuid-xxxx.mp4",
      "outputPath": "/outputs/video/uuid-xxxx.webm",
      "inputFormat": "mp4",
      "outputFormat": "webm",
      "status": "completed",        // waiting|uploading|processing|completed|failed|cancelled
      "progress": 100,
      "config": { "videoCodec": "vp9", "resolution": "1280x720" },
      "metadata": {
        "input": { "width": 1920, "height": 1080, "duration": 120, "fps": 30 },
        "output": { "width": 1280, "height": 720, "fileSize": 45000000 }
      },
      "errorMsg": null,
      "createdAt": "2026-03-08T10:00:00Z",
      "startedAt": "2026-03-08T10:00:05Z",
      "completedAt": "2026-03-08T10:02:30Z"
    }
  ]
}
```

### users.json — 用户记录

```json
{
  "users": [
    {
      "id": "user-uuid",
      "username": "admin",
      "passwordHash": "bcrypt-hash",
      "role": "admin",              // "admin" | "user"（预留权限扩展）
      "createdAt": "2026-03-08T00:00:00Z",
      "lastLoginAt": "2026-03-08T10:00:00Z"
    }
  ]
}
```

### config.json — 系统配置

```json
{
  "video": {
    "parallelLimit": 3,             // 视频并行转码数
    "maxFileSize": 5368709120,      // 5GB
    "allowedInputFormats": ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "ts"]
  },
  "img": {
    "parallelLimit": 5,             // 图片并行转码数
    "maxFileSize": 52428800,        // 50MB
    "allowedInputFormats": ["jpg", "png", "webp", "avif", "bmp", "tiff", "gif", "heic"]
  },
  "upload": {
    "chunkSize": 5242880,           // 分片大小 5MB
    "maxParallelUploads": 2
  },
  "storage": {
    "type": "local",
    "uploadDir": "./uploads",
    "outputDir": "./outputs",
    "autoClean": true,
    "cleanDays": 7
  },
  "updatedAt": "2026-03-08T10:00:00Z"
}
```

---

## 4. API 接口总览

所有接口统一前缀：`/api`  
统一响应格式：
```json
{ "code": 0, "msg": "ok", "data": {} }
```
错误时：
```json
{ "code": 400, "msg": "错误描述", "data": null }
```

### 认证接口（无需 token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（首次使用创建账号） |
| POST | `/api/auth/login` | 登录，返回 access_token + refresh_token |
| POST | `/api/auth/refresh` | 刷新 access_token |
| POST | `/api/auth/logout` | 登出（清除 refresh_token） |
| GET  | `/api/auth/me` | 获取当前登录用户信息 |

### 文件上传接口（需要 token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload/single` | 直接上传单文件（≤50MB 图片） |
| POST | `/api/upload/multipart/init` | 初始化分片上传，返回 uploadId |
| POST | `/api/upload/multipart/chunk` | 上传单个分片 |
| POST | `/api/upload/multipart/complete` | 合并分片，提交转码任务 |
| DELETE | `/api/upload/multipart/:uploadId` | 取消分片上传，清理临时文件 |

### 视频任务接口（需要 token）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/video/tasks` | 获取任务列表（分页/筛选） |
| GET | `/api/video/tasks/:id` | 获取单个任务详情 |
| POST | `/api/video/tasks/:id/cancel` | 取消任务 |
| POST | `/api/video/tasks/:id/retry` | 重试失败任务 |
| DELETE | `/api/video/tasks/:id` | 删除任务记录和文件 |
| DELETE | `/api/video/tasks/batch` | 批量删除 |
| GET | `/api/video/tasks/:id/download` | 下载单个转码结果 |
| POST | `/api/video/tasks/batch/download` | 批量打包下载（ZIP） |
| POST | `/api/video/tasks/export` | 导出任务报告（JSON/CSV） |

### 图片任务接口（需要 token）

与视频任务接口结构完全一致，路径前缀改为 `/api/img/tasks`。

### 系统接口（需要 token）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/status` | 获取系统状态（CPU/内存/磁盘） |
| GET | `/api/system/health` | 健康检查（无需 token，用于监控） |
| GET | `/api/config` | 获取系统配置 |
| PUT | `/api/config` | 更新系统配置 |
| POST | `/api/config/reset` | 重置为默认配置 |

---

## 5. 各模块详细设计

### 5.1 认证模块（authService.js）

```javascript
/**
 * 认证服务
 * 说明：
 * - 使用 bcryptjs 对密码进行哈希（bcrypt 是行业标准的密码哈希算法）
 * - access_token：有效期 2 小时，每次请求都带此 token
 * - refresh_token：有效期 7 天，用于静默刷新 access_token，避免用户频繁登录
 * - token 存储在客户端（前端 localStorage 或内存），后端无状态
 */

class AuthService {
  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 明文密码
   * @returns {{ accessToken, refreshToken, user }} 成功返回 token 和用户信息
   */
  async login(username, password) {
    // 1. 从 UserDB 查找用户
    // 2. bcrypt.compare(password, user.passwordHash) 验证密码
    // 3. 生成 access_token: jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '2h' })
    // 4. 生成 refresh_token: jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
    // 5. 更新 lastLoginAt
    // 6. 返回 token 和脱敏用户信息（不含 passwordHash）
  }

  /**
   * 用户注册
   * 注意：为安全起见，可通过环境变量 ALLOW_REGISTER=false 关闭注册
   */
  async register(username, password) {
    // 1. 检查用户名是否已存在
    // 2. 密码强度校验（最少8位，含字母和数字）
    // 3. bcrypt.hash(password, 12) 生成密码哈希（12轮，安全与性能平衡）
    // 4. 保存到 UserDB
  }

  /**
   * 刷新 Access Token
   * 说明：前端 Axios 拦截器在收到 401 时自动调用此方法静默刷新
   */
  async refreshToken(refreshToken) {
    // 1. jwt.verify(refreshToken, JWT_REFRESH_SECRET) 验证合法性
    // 2. 生成新的 access_token 返回
  }
}
```

### 5.2 分片上传模块（uploadService.js）

```javascript
/**
 * 分片上传服务
 * 
 * 为什么要分片上传？
 * - 大文件（如 5GB 视频）直接上传容易因网络超时中断
 * - 分片上传支持断点续传（失败只需重传失败的分片）
 * - 可并行上传多个分片提高速度
 * 
 * 工作流程：
 * 1. 前端调用 /upload/multipart/init 获取 uploadId
 * 2. 前端将文件分成多个 5MB 的分片，并行上传
 * 3. 所有分片上传完毕，前端调用 /upload/multipart/complete
 * 4. 后端合并分片，提交转码任务
 */

class UploadService {
  /**
   * 初始化分片上传
   * @param {string} fileName - 原始文件名
   * @param {number} fileSize - 文件总大小（字节）
   * @param {number} totalChunks - 总分片数
   * @param {string} type - 'video' | 'img' | 'anim'
   * @returns {{ uploadId, chunkSize }} 上传ID和建议的分片大小
   */
  async initMultipart({ fileName, fileSize, totalChunks, type }) {
    // 1. 校验文件大小是否超过配置限制
    // 2. 校验文件格式（根据 type 检查扩展名）
    // 3. 生成 uploadId（UUID）
    // 4. 在 uploads/chunks/uploadId/ 创建分片临时目录
    // 5. 记录上传会话到内存（Map 存储，uploadId -> { fileName, totalChunks, uploadedChunks[] }）
    // 6. 返回 uploadId
  }

  /**
   * 接收单个分片
   * @param {string} uploadId - 上传ID
   * @param {number} chunkIndex - 分片序号（从 0 开始）
   * @param {Buffer} chunkData - 分片数据
   */
  async uploadChunk(uploadId, chunkIndex, chunkData) {
    // 1. 将分片写入 uploads/chunks/{uploadId}/{chunkIndex}
    // 2. 记录已上传的分片索引
    // 3. 返回已上传分片数 / 总分片数
  }

  /**
   * 合并分片并提交转码任务
   */
  async completeUpload(uploadId, transcodeConfig) {
    // 1. 检查所有分片是否都已上传（通过记录的已上传分片列表核对）
    // 2. 按顺序读取所有分片，写入 uploads/complete/{uuid}.{ext}
    // 3. 删除临时分片目录
    // 4. 根据文件类型提交到对应的转码队列（视频/图片）
    // 5. 创建任务记录保存到 TaskDB
    // 6. 返回 taskId
  }

  /**
   * 取消分片上传（清理临时文件）
   */
  async abortUpload(uploadId) {
    // 删除 uploads/chunks/{uploadId}/ 目录
    // 清理内存中的会话记录
  }
}
```

### 5.3 视频转码服务（videoTranscodeService.js）

```javascript
/**
 * 视频转码服务
 * 
 * 核心依赖：
 * - fluent-ffmpeg：FFmpeg 的 Node.js 封装，提供链式 API
 * - FFmpeg 本身需要单独安装在系统中
 * 
 * 转码配置说明：
 * - codec: 视频编码格式（h264/h265/vp9/av1）
 * - resolution: 输出分辨率，如 "1280x720"
 * - bitrate: 视频码率，如 "1000k"（固定码率 CBR）
 * - crf: 恒定质量因子（CRF 模式，0-51，越小质量越高）
 * - fps: 帧率
 * - audioCodec: 音频编码（aac/mp3/opus/copy）
 * - audioBitrate: 音频码率，如 "128k"
 * - startTime: 裁剪起始时间（秒或 HH:mm:ss）
 * - endTime: 裁剪结束时间
 * - rotate: 旋转角度（90/-90/180）
 * - hwAccel: 是否启用硬件加速（nvidia/vaapi/videotoolbox）
 */

class VideoTranscodeService {
  /**
   * 创建转码任务（不立即执行，加入队列）
   */
  async createTask(inputPath, fileName, config, userId) {
    // 1. 用 ffprobe 探测输入文件元信息（宽高/时长/帧率/编码）
    // 2. 生成任务ID，确定输出文件路径
    // 3. 保存任务记录到 TaskDB（初始状态 waiting）
    // 4. 将任务加入 Bull 队列（queueService.addVideoJob）
    // 5. 返回 taskId
  }

  /**
   * 执行实际转码（由 videoWorker.js 调用，在队列中执行）
   */
  async executeTranscode(taskId) {
    // 1. 从 TaskDB 加载任务详情
    // 2. 更新任务状态为 processing
    // 3. 根据 config.videoCodec 从 EncoderRegistry 获取对应编码器
    // 4. 调用编码器的 encode(inputPath, outputPath, config, onProgress) 方法
    //    - onProgress 回调：接收 percent(0-100)，更新 TaskDB 中的 progress
    //    - 同时通过 Socket.io 推送进度给前端
    // 5. 转码完成：更新状态为 completed，记录输出文件信息
    // 6. 转码失败：更新状态为 failed，记录错误信息
  }
}
```

### 5.4 图片转码服务（imgTranscodeService.js）

```javascript
/**
 * 图片转码服务
 * 
 * 核心依赖：
 * - sharp：高性能 Node.js 图片处理库（基于 libvips）
 *   - 支持：JPG/PNG/WebP/AVIF/TIFF/BMP/GIF（静帧）
 *   - 性能：比 ImageMagick 快约 5-10 倍
 * - fluent-ffmpeg：用于处理动图（GIF/WebP-Anim/APNG）转换
 * 
 * 静态图片处理流程（以 JPG → WebP 为例）：
 * sharp(inputPath)
 *   .resize(width, height, { fit: 'cover' })   // 调整尺寸
 *   .rotate()                                    // 自动根据 EXIF 旋转
 *   .withMetadata(false)                         // 去除 EXIF（如配置）
 *   .webp({ quality: 82 })                       // WebP 编码参数
 *   .toFile(outputPath)                          // 输出文件
 * 
 * 动图处理流程（GIF → WebP-Anim）：
 * 使用 FFmpeg：ffmpeg -i input.gif -vf "fps=15,scale=480:-1" output.webp
 */

class ImgTranscodeService {
  async createTask(inputPath, fileName, config, userId) {
    // 1. 读取图片元信息（sharp.metadata()）
    // 2. 判断是否为动图（sharp 可检测 GIF 帧数，WebP 动图需 ffprobe）
    // 3. 创建任务记录，加入对应队列
    //    - 静态图片 → img-queue
    //    - 动图 → anim-queue
    // 4. 返回 taskId
  }

  async executeStaticTranscode(taskId) {
    // sharp 处理流程，进度更新通过文件字节写入量估算
  }

  async executeAnimTranscode(taskId) {
    // FFmpeg 处理动图，通过 ffmpeg progress 事件获取进度
  }
}
```

### 5.5 队列服务（queueService.js）

```javascript
/**
 * 队列服务
 * 
 * 为什么需要队列？
 * - 控制并行转码数量，避免服务器资源耗尽
 * - 任务持久化：即使服务器重启，队列中的任务也不会丢失（Redis 存储）
 * - 支持任务优先级（预留）
 * - 失败自动重试
 * 
 * 使用 Bull 队列（基于 Redis）：
 * - video-queue：视频转码队列，并行数 = config.video.parallelLimit
 * - img-queue：图片转码队列，并行数 = config.img.parallelLimit
 * - anim-queue：动图转码队列，并行数 = 2（动图处理较轻量）
 */

const videoQueue = new Bull('video-queue', { redis: REDIS_CONFIG })
const imgQueue   = new Bull('img-queue',   { redis: REDIS_CONFIG })
const animQueue  = new Bull('anim-queue',  { redis: REDIS_CONFIG })

// 队列消费者配置
videoQueue.process(config.video.parallelLimit, videoWorker)
imgQueue.process(config.img.parallelLimit, imgWorker)
animQueue.process(2, animWorker)

// 队列事件监听
videoQueue.on('progress', (job, progress) => { /* 通过 socket 推送进度 */ })
videoQueue.on('completed', (job) => { /* 更新任务状态 */ })
videoQueue.on('failed', (job, err) => { /* 记录错误，更新任务状态 */ })
```

### 5.6 自动清理服务（cleanService.js）

```javascript
/**
 * 自动清理服务
 * 
 * 功能：
 * - 定时扫描 outputs/ 目录下的过期文件
 * - 删除创建时间超过 cleanDays 天的文件
 * - 同步删除 TaskDB 中对应的任务记录（或仅标记文件已清理）
 * - 同时清理 uploads/chunks/ 中的僵尸临时分片（超过 24 小时未完成的）
 * 
 * 定时策略：每天凌晨 3:00 执行（使用 node-cron）
 */

// cron.schedule('0 3 * * *', () => cleanService.run())
```

---

## 6. WebSocket 事件设计

```javascript
/**
 * Socket.io 实时通信
 * 
 * 连接方式（前端）：
 * const socket = io('http://localhost:3001', {
 *   auth: { token: 'JWT_ACCESS_TOKEN' }
 * })
 * 
 * 服务端鉴权：
 * io.use((socket, next) => {
 *   // 验证 socket.handshake.auth.token
 *   // 通过则 next()，否则 next(new Error('unauthorized'))
 * })
 */

// ======= 服务端 → 客户端 事件 =======

// 任务进度更新（转码过程中持续推送）
socket.emit('task:progress', {
  taskId: 'uuid',
  progress: 45,            // 0-100
  message: '转码中...',
  type: 'video'            // 'video' | 'img' | 'anim'
})

// 任务状态变更（状态机流转）
socket.emit('task:status', {
  taskId: 'uuid',
  status: 'completed',     // 'processing' | 'completed' | 'failed' | 'cancelled'
  outputSize: 45000000,    // 完成时附带输出文件大小
  errorMsg: null           // 失败时附带错误信息
})

// 队列状态变更（进入/离开队列）
socket.emit('queue:update', {
  videoQueue: { waiting: 3, active: 2, completed: 156 },
  imgQueue:   { waiting: 0, active: 1, completed: 340 }
})

// ======= 客户端 → 服务端 事件 =======

// 订阅特定任务的进度（可选，默认推送用户所有任务）
socket.emit('task:subscribe', { taskIds: ['uuid1', 'uuid2'] })
socket.emit('task:unsubscribe', { taskIds: ['uuid1'] })
```

---

## 7. 核心服务说明

### 7.1 FFmpeg 封装（utils/ffmpeg.js）

```javascript
/**
 * FFmpeg 封装工具
 * 
 * 使用 fluent-ffmpeg 库，它将复杂的 FFmpeg 命令行参数转为 JS 链式调用。
 * 
 * 使用前提：系统需要安装 FFmpeg
 *   - Windows: 下载 ffmpeg.exe 放入 PATH
 *   - macOS: brew install ffmpeg
 *   - Linux: sudo apt install ffmpeg
 * 
 * 示例：将 input.avi 转为 720p MP4
 * ffmpeg(inputPath)
 *   .videoCodec('libx264')         // H.264 编码器
 *   .size('1280x720')              // 输出分辨率
 *   .videoBitrate('1000k')         // 视频码率
 *   .audioCodec('aac')            // 音频编码
 *   .audioBitrate('128k')         // 音频码率
 *   .fps(30)                       // 帧率
 *   .on('progress', cb)            // 进度回调
 *   .on('end', cb)                 // 完成回调
 *   .on('error', cb)               // 错误回调
 *   .save(outputPath)              // 开始执行并输出
 */
```

### 7.2 Sharp 封装（utils/sharp.js）

```javascript
/**
 * Sharp 封装工具
 * 
 * Sharp 是基于 libvips 的高性能图片处理库。
 * 安装：npm install sharp（会自动下载预编译二进制，无需系统安装额外依赖）
 * 
 * 注意事项：
 * - Sharp 不支持直接处理 GIF 动图（只能处理首帧）
 * - 动图转换需要借助 FFmpeg
 * - HEIC 格式需要安装 libheif 系统依赖，或使用 sharp 的 heif 支持（需特殊编译）
 * 
 * 示例：图片压缩 + 格式转换
 * await sharp(inputPath)
 *   .resize({ width: 1920, withoutEnlargement: true })  // 不超过原始尺寸
 *   .withMetadata(false)                                  // 去除 EXIF
 *   .webp({ quality: 82, effort: 4 })                    // WebP 参数（effort越高越慢但更小）
 *   .toFile(outputPath)
 */
```

### 7.3 日志工具（utils/logger.js）

```javascript
/**
 * 日志工具（Winston）
 * 
 * 日志级别：error > warn > info > debug
 * 
 * 输出位置：
 * - 开发环境：控制台（彩色输出）
 * - 生产环境：
 *   - 控制台（JSON格式）
 *   - logs/combined.log（所有级别）
 *   - logs/error.log（仅 error）
 * 
 * 使用示例：
 * logger.info('任务开始', { taskId, type, fileName })
 * logger.error('转码失败', { taskId, error: err.message })
 */
```

---

## 8. 环境变量配置

```env
# ==========================================
# backend/.env.example
# ==========================================
# 复制本文件为 .env，按实际情况修改值

# 服务配置
PORT=3001                           # 后端服务端口（前端代理此端口）
NODE_ENV=development                # 环境：development | production

# JWT 配置（生产环境必须修改！）
JWT_SECRET=change-me-please-xxx     # access_token 签名密钥（越长越安全）
JWT_REFRESH_SECRET=change-me-too    # refresh_token 签名密钥
JWT_EXPIRES_IN=2h                   # access_token 有效期
JWT_REFRESH_EXPIRES_IN=7d           # refresh_token 有效期

# Redis 配置（Bull 队列依赖 Redis）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=                     # 无密码留空

# 存储路径（相对路径或绝对路径均可）
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
DATA_DIR=./data                     # JSON 数据文件目录
LOG_DIR=./logs

# 功能开关
ALLOW_REGISTER=true                 # 是否允许新用户注册（多人使用改为 false 后手动管理用户）
ENABLE_RATE_LIMIT=true              # 是否启用请求频率限制

# FFmpeg 配置
FFMPEG_PATH=                        # FFmpeg 可执行文件路径（留空则从 PATH 中查找）
FFPROBE_PATH=                       # FFprobe 路径（留空则从 PATH 中查找）

# CORS 配置（允许哪些前端域名访问，逗号分隔）
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# 前端访问地址（用于生成文件访问 URL）
BASE_URL=http://localhost:3001
```

---

## 9. 迭代路线图

### Phase 1 — 基础搭建（2天）✅
- [x] 项目初始化（npm init，安装核心依赖）
- [x] Express 应用配置（CORS / JSON解析 / 请求日志）
- [x] 目录结构创建和 .gitignore 配置
- [x] 统一响应格式工具（utils/response.js）
- [x] 日志工具配置（utils/logger.js）
- [x] 全局错误处理中间件（middlewares/errorHandler.js）
- [x] 健康检查接口（GET /api/system/health）

### Phase 2 — 认证模块（1-2天）✅
- [x] UserDB（JSON文件读写封装）
- [x] AuthService（登录/注册/token生成）
- [x] JWT 认证中间件
- [x] 认证路由（登录/注册/刷新/登出/获取用户信息）
- [x] 请求频率限制（防暴力破解）

### Phase 3 — 文件上传（2天）✅
- [x] Multer 上传中间件配置
- [x] 普通上传接口（/upload/single）
- [x] 分片上传接口（init/chunk/complete/abort）
- [x] 文件格式和大小校验
- [x] UploadService（分片合并逻辑）

### Phase 4 — 视频转码（3-4天）✅
- [x] FFmpeg 封装工具（utils/ffmpeg.js）
- [x] FFprobe 元信息探测（utils/ffprobe.js）
- [x] H264/H265/VP9 编码器实现
- [x] TaskDB（JSON文件任务记录读写）
- [x] VideoTranscodeService
- [x] Redis + Bull 视频队列配置
- [x] videoWorker.js 工作器
- [x] Socket.io 进度推送
- [x] 视频任务 CRUD 路由

### Phase 5 — 图片转码（2-3天）✅
- [x] Sharp 封装工具（utils/sharp.js）
- [x] SharpEncoder（静态图片编码器）
- [x] GifEncoder / WebPAnimEncoder（动图编码器，FFmpeg）
- [x] ImgTranscodeService
- [x] img-queue / anim-queue 队列配置
- [x] imgWorker.js / animWorker.js
- [x] 图片任务 CRUD 路由

### Phase 6 — 下载 & 配置（1-2天）✅
- [x] 单文件下载接口（文件流）
- [x] ZIP 批量打包下载（archiver）
- [x] ConfigService + ConfigDB
- [x] 系统配置 CRUD 接口
- [x] 系统状态接口（CPU/磁盘/队列状态）

### Phase 7 — 运维特性（1天）✅
- [x] 自动清理服务（node-cron）
- [x] 任务报告导出（JSON/CSV）
- [x] Docker 化（Dockerfile + docker-compose.yml）
- [x] README 快速启动文档

### Phase 8 — 实时通信（已完成）✅
- [x] Socket.io 模块化封装（socket/events.ts, socket/emitter.ts）
- [x] 任务进度实时推送（task:progress）
- [x] 任务状态变更事件（task:status, task:completed, task:failed）
- [x] 队列状态更新（queue:update）
- [x] 前端 WebSocket 服务封装（api/core/socket.ts）
- [x] Dashboard 页面实时更新
- [x] Tasks 页面实时进度条

### Phase 9 — 前端状态管理（已完成）✅
- [x] stores/tasks.ts - 任务状态管理
- [x] stores/upload.ts - 上传状态管理
- [x] stores/settings.ts - 设置状态管理
- [x] 各页面组件集成 stores
- [x] WebSocket 与 stores 联动

### Phase 10 — 测试完善（已完成）✅
- [x] 补充 services 测试（upload.test.ts）
- [x] 添加 routes 集成测试（routes.test.ts）
- [x] 配置测试覆盖率报告（vitest coverage）
- [x] 32 个测试全部通过

### Phase 11 — 文档与部署（已完成）✅
- [x] 集成 Swagger/OpenAPI（swagger-jsdoc + swagger-ui-express）
- [x] 添加路由 JSDoc 注释（auth.ts 已添加）
- [x] 创建 CI/CD 配置（.github/workflows/ci.yml）
- [x] 完善 Docker 配置（已有 Dockerfile + docker-compose.yml）

### Phase 12 — 用户体验优化（已完成）✅
- [x] 前端错误处理统一封装（utils/errorHandling.ts）
- [x] 加载状态组合式 API（composables/useLoading.ts）
- [x] 响应式布局工具（composables/useResponsive.ts）
- [x] 通用组件（LoadingOverlay、EmptyState）
- [x] Dashboard 页面优化（响应式、错误状态）

---

## 10. 扩展性说明

| 扩展点 | 实现方式 |
|--------|----------|
| 新增视频编码器（如 AV1） | 在 `encoders/video/` 添加 `AV1Encoder.js`，注册到 `EncoderRegistry` |
| 新增图片格式支持（如 HEIC 输入） | 在 `encoders/image/` 添加处理逻辑，更新 `formats.ts` |
| 换用 SQLite 数据库 | 替换 `db/TaskDB.js` 等，接口不变（服务层不感知） |
| 换用 MongoDB 数据库 | 同上，替换 db 层 |
| 接入 AWS S3 云存储 | 实现 `storage/S3Storage.js`，在 `.env` 中切换 `STORAGE_TYPE=s3` |
| 新增工具（如 audio-transcoder） | 新增路由文件 + 服务文件，在 `routes/index.js` 注册 |
| 扩展转码队列优先级 | Bull 队列支持 priority 参数，在 `queueService.addJob` 中传入 |
| 水平扩展（多实例） | Redis 队列天然支持多 Worker 实例并行消费，直接部署多实例即可 |

---

## 11. 项目完成总结

### 已完成功能

| 模块 | 状态 | 说明 |
|------|------|------|
| JWT 认证 | ✅ | 登录/注册/刷新令牌/权限控制 |
| 文件上传 | ✅ | 普通上传 + 分片上传 + 断点续传 |
| 视频转码 | ✅ | H264/H265/VP9 编码器 + FFmpeg |
| 图片转码 | ✅ | Sharp 编码器 + 多格式支持 |
| 动图转码 | ✅ | GIF/WebP-anim/APNG 支持 |
| 任务队列 | ✅ | Bull + Redis + 并行控制 |
| 实时通信 | ✅ | Socket.io 进度推送 |
| 下载服务 | ✅ | 单文件 + ZIP 批量打包 |
| 系统配置 | ✅ | JSON 持久化 + 热更新 |
| 自动清理 | ✅ | 定时任务 + 过期文件清理 |
| API 文档 | ✅ | Swagger/OpenAPI 集成 |
| 测试覆盖 | ✅ | 32 个单元测试 + 集成测试 |
| CI/CD | ✅ | GitHub Actions 自动化 |
| Docker | ✅ | 容器化部署支持 |

### 前端功能

| 模块 | 状态 | 说明 |
|------|------|------|
| 状态管理 | ✅ | Pinia stores (tasks/upload/settings) |
| WebSocket | ✅ | 实时进度更新 |
| 错误处理 | ✅ | 统一错误封装 + 用户友好提示 |
| 加载状态 | ✅ | 组合式 API + 全局/局部加载 |
| 响应式布局 | ✅ | 移动端适配 |
| 通用组件 | ✅ | LoadingOverlay/EmptyState |

### 技术指标

- **后端测试**: 32 个测试全部通过
- **API 接口**: 50+ 个 RESTful 接口
- **代码质量**: TypeScript 严格模式 + ESLint
- **文档覆盖**: Swagger UI + 详细注释

### 依赖清单

```json
{
  "dependencies": {
    "express": "^4.18.0",           // Web 框架
    "cors": "^2.8.5",               // 跨域
    "multer": "^1.4.5",             // 文件上传
    "bull": "^4.11.0",              // 任务队列（依赖 Redis）
    "ioredis": "^5.3.0",            // Redis 客户端
    "socket.io": "^4.7.0",          // WebSocket
    "jsonwebtoken": "^9.0.0",       // JWT
    "bcryptjs": "^2.4.3",           // 密码哈希
    "fluent-ffmpeg": "^2.1.2",      // FFmpeg 封装
    "sharp": "^0.33.0",             // 图片处理
    "archiver": "^6.0.0",           // ZIP 打包
    "winston": "^3.11.0",           // 日志
    "node-cron": "^3.0.0",          // 定时任务
    "uuid": "^9.0.0",               // UUID 生成
    "joi": "^17.11.0",              // 参数校验
    "dotenv": "^16.3.0",            // 环境变量
    "express-rate-limit": "^7.1.0", // 请求限流
    "systeminformation": "^5.21.0"  // 系统资源信息
  },
  "devDependencies": {
    "nodemon": "^3.0.0"             // 开发时热重载
  }
}
```

### 系统环境要求

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18.0+ | 运行时 |
| FFmpeg | 4.0+ | 视频/动图转码（系统安装） |
| Redis | 6.0+ | 任务队列（Bull 依赖） |
| 磁盘空间 | 20GB+ | 上传和输出文件存储 |
