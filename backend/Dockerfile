# my-customTools Backend
# 多阶段构建，优化镜像大小

# 构建阶段
FROM node:22-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建 TypeScript
RUN pnpm build

# 生产阶段
FROM node:22-alpine AS production

WORKDIR /app

# 安装 pnpm 和 FFmpeg
RUN apk add --no-cache ffmpeg && \
    npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist

# 创建必要的目录
RUN mkdir -p uploads outputs data logs

# 环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/server.js"]

# 开发阶段
FROM node:22-alpine AS development

WORKDIR /app

# 安装 pnpm 和 FFmpeg
RUN apk add --no-cache ffmpeg && \
    npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 环境变量
ENV NODE_ENV=development
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["pnpm", "dev"]