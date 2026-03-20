# 后端部署文档

## 目录

1. [环境要求](#环境要求)
2. [本地开发部署](#本地开发部署)
3. [生产环境部署](#生产环境部署)
4. [Docker 部署](#docker-部署)
5. [Nginx 反向代理配置](#nginx-反向代理配置)
6. [进程管理](#进程管理)
7. [监控与日志](#监控与日志)
8. [故障排查](#故障排查)

---

## 环境要求

### 必需软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | 22.x | 运行时环境 |
| pnpm | 最新版 | 包管理器（推荐）/ npm 也可 |
| FFmpeg | 4.0+ | 视频/音频转码 |
| Redis | 6.0+ | 任务队列 |

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+) / Windows Server / macOS
- **内存**: 最低 2GB，推荐 4GB+
- **磁盘**: 根据存储需求，建议 50GB+
- **CPU**: 多核推荐（转码任务消耗 CPU）

### FFmpeg 安装

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg

# 验证安装
ffmpeg -version
```

**CentOS/RHEL:**
```bash
sudo yum install epel-release
sudo yum install ffmpeg ffmpeg-devel

# 或使用 RPM Fusion
sudo yum localinstall --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-7.noarch.rpm
sudo yum install ffmpeg
```

**Windows:**
1. 下载 FFmpeg: https://ffmpeg.org/download.html
2. 解压到 `C:\ffmpeg`
3. 添加 `C:\ffmpeg\bin` 到系统 PATH
4. 验证: `ffmpeg -version`

**macOS:**
```bash
brew install ffmpeg
```

### Redis 安装

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**CentOS/RHEL:**
```bash
sudo yum install redis
sudo systemctl enable redis
sudo systemctl start redis
```

**Windows:**
1. 下载 Redis for Windows: https://github.com/microsoftarchive/redis/releases
2. 解压并运行 `redis-server.exe`

**macOS:**
```bash
brew install redis
brew services start redis
```

---

## 本地开发部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd my_customTools/backend
```

### 2. 安装依赖

```bash
# 推荐 pnpm
pnpm install

# 或使用 npm
npm install
```

### 3. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置
vim .env  # 或使用其他编辑器
```

**.env 配置说明:**

```env
# ==========================================
# 服务配置
# ==========================================
PORT=3001                           # 服务端口
NODE_ENV=development                # 环境: development | production

# ==========================================
# JWT 配置
# ==========================================
JWT_SECRET=your-secret-key-here     # JWT 签名密钥（生产环境必须修改！）
JWT_REFRESH_SECRET=refresh-secret   # 刷新令牌密钥
JWT_EXPIRES_IN=2h                   # 访问令牌有效期
JWT_REFRESH_EXPIRES_IN=7d           # 刷新令牌有效期

# ==========================================
# Redis 配置
# ==========================================
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=                     # 无密码留空

# ==========================================
# 存储路径
# ==========================================
UPLOAD_DIR=./uploads                # 上传文件目录
OUTPUT_DIR=./outputs                # 转码输出目录
DATA_DIR=./data                     # 数据文件目录
LOG_DIR=./logs                      # 日志目录

# ==========================================
# 功能开关
# ==========================================
ALLOW_REGISTER=true                 # 是否允许注册
ENABLE_RATE_LIMIT=true              # 是否启用请求频率限制

# ==========================================
# FFmpeg 路径（留空自动查找）
# ==========================================
FFMPEG_PATH=
FFPROBE_PATH=

# ==========================================
# CORS 配置
# ==========================================
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# ==========================================
# 基础 URL
# ==========================================
BASE_URL=http://localhost:3001
```

### 4. 启动服务

```bash
# 开发模式（热重载）
pnpm dev

# 或
npm run dev
```

### 5. 验证服务

```bash
# 健康检查
curl http://localhost:3001/api/system/health

# 预期响应
{"code":0,"msg":"服务正常","data":{"status":"ok","timestamp":"...","uptime":...}}
```

---

## 生产环境部署

### 1. 构建项目

```bash
# 安装依赖（仅生产依赖）
pnpm install --prod

# 或安装全部依赖后构建
pnpm install
pnpm build
```

### 2. 环境变量配置

```env
# 生产环境配置
NODE_ENV=production
PORT=3001

# 安全配置
JWT_SECRET=<强密码，至少32位随机字符串>
JWT_REFRESH_SECRET=<另一个强密码>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis（建议使用密码）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<redis密码>

# 功能配置
ALLOW_REGISTER=false                 # 生产环境关闭注册
ENABLE_RATE_LIMIT=true

# CORS（只允许正式域名）
CORS_ORIGINS=https://your-domain.com

BASE_URL=https://api.your-domain.com
```

### 3. 目录结构

```
/var/www/my-customtools/
├── backend/
│   ├── dist/           # 编译产物
│   ├── node_modules/
│   ├── uploads/        # 上传文件
│   ├── outputs/        # 转码输出
│   ├── data/           # 数据文件
│   ├── logs/           # 日志文件
│   ├── .env            # 环境配置
│   └── package.json
```

### 4. 设置目录权限

```bash
# 创建目录
mkdir -p /var/www/my-customtools/{uploads,outputs,data,logs}

# 设置权限（假设使用 www-data 用户）
chown -R www-data:www-data /var/www/my-customtools
chmod -R 755 /var/www/my-customtools
```

---

## Docker 部署

### 1. 构建镜像

```bash
cd backend

# 构建镜像
docker build -t my-customtools-backend:latest .

# 或指定阶段
docker build --target production -t my-customtools-backend:prod .
```

### 2. 使用 docker-compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    image: my-customtools-backend:latest
    container_name: my-customtools-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./uploads:/app/uploads
      - ./outputs:/app/outputs
      - ./data:/app/data
      - ./logs:/app/logs
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/system/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: my-customtools-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis_data:
```

**启动服务:**

```bash
# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 3. 环境变量文件

**.env.docker:**
```env
JWT_SECRET=your-production-secret-key-at-least-32-characters
JWT_REFRESH_SECRET=another-production-secret-key
```

```bash
docker-compose --env-file .env.docker up -d
```

---

## Nginx 反向代理配置

### 基础配置

```nginx
# /etc/nginx/sites-available/my-customtools
upstream backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name api.your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 请求体大小限制
    client_max_body_size 5G;

    # API 代理
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # WebSocket 代理（Socket.io）
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
    }

    # 静态文件（可选）
    location /uploads/ {
        alias /var/www/my-customtools/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /outputs/ {
        alias /var/www/my-customtools/outputs/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/my-customtools /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

---

## 进程管理

### 使用 PM2（推荐）

**安装 PM2:**
```bash
npm install -g pm2
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'my-customtools-backend',
    script: 'dist/server.js',
    cwd: '/var/www/my-customtools/backend',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

**PM2 命令:**
```bash
# 启动
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs my-customtools-backend

# 重启
pm2 restart my-customtools-backend

# 停止
pm2 stop my-customtools-backend

# 开机自启
pm2 startup
pm2 save
```

### 使用 systemd

**/etc/systemd/system/my-customtools.service:**
```ini
[Unit]
Description=my-customTools Backend Service
After=network.target redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/my-customtools/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=my-customtools
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

**systemd 命令:**
```bash
# 重载配置
sudo systemctl daemon-reload

# 启动
sudo systemctl start my-customtools

# 开机自启
sudo systemctl enable my-customtools

# 查看状态
sudo systemctl status my-customtools

# 查看日志
sudo journalctl -u my-customtools -f
```

---

## 监控与日志

### 日志管理

日志存储在 `logs/` 目录：

```
logs/
├── app-2026-03-19.log    # 应用日志
├── error-2026-03-19.log  # 错误日志
└── access.log            # 访问日志
```

**日志轮转（logrotate）:**

**/etc/logrotate.d/my-customtools:**
```
/var/www/my-customtools/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 健康检查脚本

**healthcheck.sh:**
```bash
#!/bin/bash

URL="http://localhost:3001/api/system/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ "$RESPONSE" -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy (HTTP $RESPONSE)"
    # 发送告警
    # curl -X POST https://hooks.slack.com/xxx -d '{"text":"服务异常"}'
    exit 1
fi
```

**添加到 crontab:**
```bash
# 每5分钟检查一次
*/5 * * * * /var/www/my-customtools/backend/scripts/healthcheck.sh
```

### 性能监控

```bash
# 安装监控工具
npm install -g clinic

# CPU 分析
clinic doctor -- node dist/server.js

# 内存分析
clinic heapprofiler -- node dist/server.js
```

---

## 故障排查

### 常见问题

#### 1. 端口被占用

```bash
# 查看端口占用
lsof -i :3001
# 或
netstat -tlnp | grep 3001

# 杀掉进程
kill -9 <PID>
```

#### 2. Redis 连接失败

```bash
# 检查 Redis 状态
redis-cli ping
# 应返回 PONG

# 检查 Redis 配置
redis-cli config get bind
redis-cli config get protected-mode

# 如果是远程连接，确保防火墙开放
sudo ufw allow 6379
```

#### 3. FFmpeg 未找到

```bash
# 检查 FFmpeg
which ffmpeg
ffmpeg -version

# 如果未安装
sudo apt install ffmpeg
```

#### 4. 内存不足

```bash
# 查看内存使用
free -h

# 查看进程内存
ps aux --sort=-%mem | head

# 清理缓存
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

#### 5. 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 清理日志
find logs/ -name "*.log" -mtime +7 -delete

# 清理旧任务
curl -X POST http://localhost:3001/api/clean/run \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 日志分析

```bash
# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 搜索特定错误
grep -r "Error" logs/ | tail -20

# 统计错误类型
grep "Error" logs/app-*.log | awk '{print $NF}' | sort | uniq -c
```

### 重启服务

```bash
# PM2 方式
pm2 restart my-customtools-backend

# systemd 方式
sudo systemctl restart my-customtools

# Docker 方式
docker-compose restart backend
```

---

## 安全建议

1. **定期更新依赖**
   ```bash
   pnpm update
   pnpm audit
   ```

2. **使用强密码**
   - JWT_SECRET 至少 32 位随机字符
   - Redis 设置密码

3. **限制注册**
   - 生产环境设置 `ALLOW_REGISTER=false`

4. **启用 HTTPS**
   - 使用 Let's Encrypt 免费证书

5. **防火墙配置**
   ```bash
   # 只开放必要端口
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw enable
   ```

6. **定期备份**
   ```bash
   # 备份数据目录
   tar -czf backup-$(date +%Y%m%d).tar.gz data/
   ```

---

## 联系支持

如遇到问题，请查看：
- 日志文件: `logs/` 目录
- 健康检查: `/api/system/health`
- 系统状态: `/api/system/status`