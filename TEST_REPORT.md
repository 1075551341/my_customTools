# 前后端联调测试报告

> **测试时间**: 2026-03-20
> **测试范围**: 前端 API 客户端与后端服务的连通性、菜单切换、登录跳转
> **测试状态**: ✅ 修复完成，待启动验证

---

## 修复内容摘要

| 修复项 | 状态 | 说明 |
| ------ | ---- | ---- |
| 默认首页路径 | ✅ | 从 `/analytics` 改为 `/dashboard` |
| 后端菜单组件路径 | ✅ | 从 `views/xxx/index` 改为 `/xxx/index` |
| 菜单图标统一 | ✅ | 从 `mdi:*` 改为 `lucide:*` |
| 菜单标题统一 | ✅ | 从"仪表盘"改为"项目看板" |
| upload 页面创建 | ✅ | 新增完整上传页面 |
| 登录跳转逻辑 | ✅ | 所有角色默认跳转 `/dashboard` |
| 示例页面清理 | ✅ | 无需清理（无示例页面） |

---

## 测试详情

### 1. 菜单切换测试

**问题现象**: 功能页面下切换子菜单报错

**原因分析**:
1. 前端默认首页配置为 `/analytics`，但此路由不存在
2. 后端返回的菜单组件路径格式为 `views/dashboard/index`，前端 `import.meta.glob` 加载的格式为 `/dashboard/index`

**修复方案**:
1. 修改 `frontend/packages/@core/preferences/src/config.ts` 的 `defaultHomePath` 为 `/dashboard`
2. 修改 `backend/src/routes/menu.ts` 的菜单配置：
   - `component: "/dashboard/index"`（而非 `views/dashboard/index`）
   - `icon: "lucide:layout-dashboard"`（而非 `mdi:view-dashboard`）
   - `title: "项目看板"`（而非"仪表盘"）

**测试方法**:
```bash
# 1. 启动后端
cd backend && pnpm dev

# 2. 启动前端
cd frontend/apps/web-antd && pnpm dev

# 3. 登录后依次点击各菜单项
- 项目看板
- 视频转码
- 图片转码
- 文档转换
- 任务管理
- 系统配置
- 文件上传
```

**预期结果**: 所有菜单项可正常切换，无路由匹配错误

---

### 2. 登录后重定向测试

**问题现象**: 登录后未跳转到项目看板

**修复方案**:
1. 后端 `backend/src/routes/user.ts` 中 `homePathMap` 所有角色配置为 `/dashboard`
2. 前端 `frontend/apps/web-antd/src/store/auth.ts` 已使用 `userInfo.homePath || preferences.app.defaultHomePath`

**测试方法**:
1. 清除浏览器缓存
2. 访问登录页
3. 输入用户名密码登录（默认账号：admin / 123456）
4. 检查登录后跳转地址

**预期结果**: 登录后地址栏显示 `http://localhost:xxxx/#/dashboard`

---

### 3. 示例界面清理

**检查结果**: 当前项目无框架示例页面需要删除

**views 目录清单**:
```
views/
├── _core/          # 核心页面（认证、错误页等）
├── dashboard/      # 项目看板 ✅
├── video/          # 视频转码 ✅
├── image/          # 图片转码 ✅
├── document/       # 文档转换 ✅
├── tasks/          # 任务管理 ✅
├── settings/       # 系统配置 ✅
├── upload/         # 文件上传 ✅（新增）
└── profile/        # 个人设置 ✅
```

---

### 4. 流程交互测试清单

| 功能模块 | 测试项 | 状态 | 备注 |
|---------|--------|------|------|
| 登录/注册 | 用户名密码登录 | ⏳待测 | 需启动服务 |
| 登录/注册 | Token 刷新 | ⏳待测 | 需启动服务 |
| 登录/注册 | 退出登录 | ⏳待测 | 需启动服务 |
| 项目看板 | WebSocket 连接 | ⏳待测 | 需 Redis |
| 项目看板 | 任务统计显示 | ⏳待测 | 需后端数据 |
| 项目看板 | 队列状态显示 | ⏳待测 | 需 Redis |
| 视频转码 | 文件上传 | ⏳待测 | 需 FFmpeg |
| 视频转码 | 参数配置 | ⏳待测 | - |
| 视频转码 | 任务提交 | ⏳待测 | 需 FFmpeg |
| 图片转码 | 文件上传 | ⏳待测 | 需 Sharp |
| 图片转码 | 参数配置 | ⏳待测 | - |
| 文档转换 | 文件上传 | ⏳待测 | - |
| 文档转换 | 格式选择 | ⏳待测 | - |
| 任务管理 | 任务列表 | ⏳待测 | 需后端数据 |
| 任务管理 | 任务详情 | ⏳待测 | 需后端数据 |
| 任务管理 | 任务取消 | ⏳待测 | 需后端支持 |
| 系统配置 | 参数修改 | ⏳待测 | - |
| 系统配置 | 参数保存 | ⏳待测 | 需后端支持 |
| 系统配置 | 队列状态 | ⏳待测 | 需 Redis |
| 文件上传 | 拖拽上传 | ⏳待测 | - |
| 文件上传 | 批量上传 | ⏳待测 | - |

---

## 启动说明

### 环境要求
- Node.js 22.x ✅
- Redis 6.0+ ⏳待确认
- FFmpeg 4.0+ ⏳待确认

### 启动步骤

```bash
# 1. 启动 Redis（Windows）
redis-server

# 2. 启动后端（新终端）
cd D:/apdms/coding_AI/my_customTools/backend
pnpm dev

# 3. 启动前端（新终端）
cd D:/apdms/coding_AI/my_customTools/frontend/apps/web-antd
pnpm dev
```

### 默认账号
```
用户名：admin
密码：123456
角色：admin（管理员）
```

---

## 后端菜单配置（已修复）

### 普通用户菜单
```json
[
  { "path": "/dashboard", "name": "Dashboard", "component": "/dashboard/index", "meta": { "title": "项目看板", "icon": "lucide:layout-dashboard" } },
  { "path": "/video", "name": "Video", "component": "/video/index", "meta": { "title": "视频转码", "icon": "lucide:video" } },
  { "path": "/image", "name": "Image", "component": "/image/index", "meta": { "title": "图片转码", "icon": "lucide:image" } },
  { "path": "/document", "name": "Document", "component": "/document/index", "meta": { "title": "文档转换", "icon": "lucide:file-text" } },
  { "path": "/tasks", "name": "Tasks", "component": "/tasks/index", "meta": { "title": "任务管理", "icon": "lucide:list-todo" } },
  { "path": "/settings", "name": "Settings", "component": "/settings/index", "meta": { "title": "系统配置", "icon": "lucide:settings" } }
]
```

### 管理员菜单
同普通用户菜单（当前配置，后续可按需扩展）

---

## 文件修改清单

| 文件 | 修改内容 | 状态 |
|------|----------|------|
| `frontend/packages/@core/preferences/src/config.ts` | defaultHomePath: '/dashboard' | ✅ |
| `backend/src/routes/menu.ts` | 更新 DEFAULT_MENUS 和 ADMIN_MENUS | ✅ |
| `frontend/apps/web-antd/src/router/routes/modules/dashboard.ts` | meta.title: '项目看板' | ✅ |
| `frontend/apps/web-antd/src/views/dashboard/index.vue` | Page title: '项目看板' | ✅ |
| `frontend/apps/web-antd/src/views/upload/index.vue` | 新建上传页面 | ✅ |
| `backend/src/routes/user.ts` | homePathMap 全部指向 /dashboard | 已存在 |

---

## 下一步

1. ✅ 代码修复已完成
2. ⏳ 启动 Redis 服务
3. ⏳ 启动后端服务
4. ⏳ 启动前端服务
5. ⏳ 执行完整测试流程

---

## 结论

所有代码修复已完成，等待环境验证。
