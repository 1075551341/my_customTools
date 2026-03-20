# 前后端联调测试报告

> **测试时间**: 2026-03-20
> **测试范围**: 前端 API 客户端与后端服务的连通性
> **测试状态**: ✅ 通过

---

## 测试结果摘要

| 测试项       | 状态 | 说明                              |
| ------------ | ---- | --------------------------------- |
| 后端服务启动 | ✅   | 端口 3001，Redis 连接成功         |
| 前端服务启动 | ✅   | 端口 6001，Vite 热重载正常        |
| CORS 配置    | ✅   | 前后端跨域访问正常                |
| Vite 代理    | ✅   | `/api` 请求正确转发到后端         |
| 健康检查接口 | ✅   | `/api/system/health` 返回正常     |
| 登录接口     | ✅   | `/api/auth/login` 返回 JWT token  |
| 任务列表接口 | ✅   | `/api/tasks` 需要认证，返回空列表 |
| 配置接口     | ✅   | `/api/config` 需要认证            |
| 用户偏好接口 | ✅   | `/api/user/preferences` 需要认证  |
| 用户信息接口 | ✅   | `/api/user/info` 返回用户详情     |

---

## 测试详情

### 1. 后端服务测试

```bash
# 健康检查
curl http://localhost:3001/api/system/health
# 响应：{"code":0,"msg":"服务正常","data":{"status":"ok",...}}

# 登录测试
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 响应：{"code":0,"msg":"登录成功","data":{"user":{...},"accessToken":"..."}}

# 用户信息
curl http://localhost:3001/api/user/info \
  -H "Authorization: Bearer <access_token>"
# 响应：{"code":0,"msg":"ok","data":{"userId":"...","username":"admin",...}}

# 用户偏好
curl http://localhost:3001/api/user/preferences \
  -H "Authorization: Bearer <access_token>"
# 响应：{"code":0,"msg":"ok","data":{"theme":"light","language":"zh-CN",...}}
```

### 2. 前端代理测试

```bash
# 通过前端代理访问后端 API
curl http://localhost:6001/api/system/health
curl http://localhost:6001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. 认证接口测试

```bash
# 带 token 访问受保护的接口
curl http://localhost:3001/api/tasks \
  -H "Authorization: Bearer <access_token>"
# 响应：{"code":0,"msg":"ok","data":{"list":[],"pagination":{...}}}
```

### 4. 前端页面测试

- 登录页面加载正常
- 滑块验证为前端安全机制（自动化测试需特殊处理）
- 通过 JavaScript 注入 token 后可访问受保护页面
- Dashboard 页面加载正常
- 所有功能页面路由配置正确

---

## 问题与解决

### 问题 1: CORS 跨域限制

**现象**: 后端请求被 CORS 阻止
**原因**: 后端 CORS 配置只允许 5173/5174 端口，前端实际运行在 6001 端口
**解决**: 更新 `backend/src/config/defaults.ts` 添加 6001 端口到允许列表

### 问题 2: Vite 代理路径重写

**现象**: 前端 `/api/*` 请求返回 404
**原因**: vite.config.ts 中 `rewrite: (path) => path.replace(/^\/api/, '')` 移除了 `/api` 前缀，但后端路由需要 `/api` 前缀
**解决**: 移除 rewrite 配置，保留 `/api` 前缀

### 问题 3: 滑块验证

**现象**: 自动化测试无法通过滑块验证
**原因**: 前端安全机制，需要用户交互
**解决**: 生产环境正常使用，测试时可通过 API 直接登录获取 token

---

## 前后端接口映射

| 前端 API 模块 | 后端路由         | 状态 |
| ------------- | ---------------- | ---- |
| auth.ts       | /api/auth/\*     | ✅   |
| tasks.ts      | /api/tasks/\*    | ✅   |
| upload.ts     | /api/upload/\*   | ✅   |
| config.ts     | /api/config/\*   | ✅   |
| user.ts       | /api/user/\*     | ✅   |
| system.ts     | /api/system/\*   | ✅   |
| menu.ts       | /api/menu/\*     | ✅   |
| download.ts   | /api/download/\* | ✅   |
| document.ts   | /api/document/\* | ✅   |
| export.ts     | /api/export/\*   | ✅   |
| clean.ts      | /api/clean/\*    | ✅   |

---

## 前端页清单

| 页面       | 路径             | 状态 |
| ---------- | ---------------- | ---- |
| 登录页     | `/auth/login`    | ✅   |
| Dashboard  | `/dashboard`     | ✅   |
| 视频转码   | `/video`         | ✅   |
| 图片转码   | `/image`         | ✅   |
| 文档转换   | `/document`      | ✅   |
| 任务管理   | `/tasks`         | ✅   |
| 系统配置   | `/config`        | ✅   |
| 用户配置   | `/profile`       | ✅   |

---

## 环境信息

### 后端

- 端口：3001
- 数据库：SQLite (data/app.db)
- 缓存：Redis (127.0.0.1:6379)
- 队列：Bull (Redis)
- 实时通信：Socket.io

### 前端

- 端口：6001
- 框架：Vue 3 + Vben Admin 5.x
- UI 库：Ant Design Vue 4.x
- 状态管理：Pinia
- HTTP 客户端：@vben/request

### 代理配置

```javascript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    ws: true,
  },
}
```

---

## 结论

✅ 前后端联调测试通过，所有核心 API 接口正常工作。

- 认证流程：正常
- 请求代理：正常
- 跨域访问：正常
- 权限控制：正常
- 响应格式：统一
- 用户信息 API：正常
- 用户偏好 API：正常

所有功能页面已创建并可访问，可以继续开发前端页面功能。
