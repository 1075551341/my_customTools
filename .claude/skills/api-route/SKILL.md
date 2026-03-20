---
name: api-route
description: 创建新的 API 路由（含路由、服务层、类型定义），遵循项目分层架构
---

# 创建 API 路由

根据用户指定的路由名称，创建符合项目分层架构的完整 API 模块。

## 使用方式

```
/api-route <name> [options]
```

**参数说明：**
- `<name>`: 路由名称，如 `users`、`products`（小写字母，复数形式）

**可选选项：**
- `--auth`: 路由需要认证（默认）
- `--no-auth`: 路由无需认证
- `--crud`: 生成完整 CRUD 接口

## 执行步骤

### 1. 确认需求

询问用户：
- 路由名称（如未提供）
- 需要的接口方法：GET / POST / PUT / DELETE
- 是否需要认证
- 数据模型字段（如果需要 CRUD）

### 2. 创建路由文件

创建文件 `backend/src/routes/{name}.ts`：

```typescript
/**
 * {Name} 路由
 *
 * {description}
 *
 * @module routes/{name}
 */

import { Router, Request, Response } from 'express'
import { success, error } from '../utils/response'
import { authenticate } from '../middlewares/auth'
import { NameService } from '../services/{name}'

const router: Router = Router()

// 是否需要认证
const authMiddleware = [authenticate] // 或 [] 表示无需认证

/**
 * GET /api/{name}
 *
 * 获取{资源}列表
 */
router.get('/', ...authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await {Name}Service.getList(req.query)
    return success(res, result)
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * GET /api/{name}/:id
 *
 * 获取单个{资源}
 */
router.get('/:id', ...authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await {Name}Service.getById(req.params.id)
    return success(res, result)
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * POST /api/{name}
 *
 * 创建{资源}
 */
router.post('/', ...authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await {Name}Service.create(req.body)
    return success(res, result, '创建成功', 201)
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * PUT /api/{name}/:id
 *
 * 更新{资源}
 */
router.put('/:id', ...authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await {Name}Service.update(req.params.id, req.body)
    return success(res, result, '更新成功')
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * DELETE /api/{name}/:id
 *
 * 删除{资源}
 */
router.delete('/:id', ...authMiddleware, async (req: Request, res: Response) => {
  try {
    await {Name}Service.delete(req.params.id)
    return success(res, null, '删除成功')
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

export default router
```

### 3. 创建服务层

创建文件 `backend/src/services/{name}.ts`：

```typescript
/**
 * {Name} 服务层
 *
 * 处理{资源}相关的业务逻辑
 *
 * @module services/{name}
 */

import logger from '../utils/logger'
import { db } from '../db'

/**
 * {Name} 服务类
 */
export class {Name}Service {
  /**
   * 获取列表
   */
  static async getList(query: Record<string, any>) {
    // TODO: 实现列表查询逻辑
    logger.info('获取{name}列表', { query })
    return []
  }

  /**
   * 获取单个
   */
  static async getById(id: string) {
    // TODO: 实现查询单个逻辑
    logger.info('获取{name}详情', { id })
    return null
  }

  /**
   * 创建
   */
  static async create(data: any) {
    // TODO: 实现创建逻辑
    logger.info('创建{name}', { data })
    return data
  }

  /**
   * 更新
   */
  static async update(id: string, data: any) {
    // TODO: 实现更新逻辑
    logger.info('更新{name}', { id, data })
    return data
  }

  /**
   * 删除
   */
  static async delete(id: string) {
    // TODO: 实现删除逻辑
    logger.info('删除{name}', { id })
  }
}
```

### 4. 添加类型定义

更新 `backend/src/types/index.ts`：

```typescript
/**
 * {Name} 相关类型
 */
export interface {Name} {
  id: string
  // TODO: 添加字段定义
  createdAt: string
  updatedAt: string
}

export interface {Name}CreateInput {
  // TODO: 添加创建输入字段
}

export interface {Name}UpdateInput {
  // TODO: 添加更新输入字段
}
```

### 5. 注册路由

更新 `backend/src/routes/index.ts`：

```typescript
// 添加导入
import {name}Routes from './{name}'

// 添加注册
router.use('/{name}', {name}Routes)
```

### 6. 输出摘要

告知用户：
- 创建的文件列表
- 需要完善的业务逻辑
- API 端点列表

## 示例

```
用户: /api-route presets --crud

助手: 我将创建 presets 路由，包含完整 CRUD 接口。

创建的文件：
- backend/src/routes/presets.ts
- backend/src/services/presets.ts

API 端点：
- GET    /api/presets     获取预设列表
- GET    /api/presets/:id 获取单个预设
- POST   /api/presets     创建预设
- PUT    /api/presets/:id 更新预设
- DELETE /api/presets/:id 删除预设

需要在服务层补充：
- 数据库操作逻辑
- 参数校验
- 业务规则
```

## 注意事项

1. **命名规范**：
   - 路由文件：小写复数（`users.ts`）
   - 服务类：PascalCase + Service（`UsersService`）
   - 类型：PascalCase（`User`）

2. **分层原则**：
   - 路由层：只处理请求/响应，不写业务逻辑
   - 服务层：所有业务逻辑都在这里

3. **错误处理**：使用统一的 `error()` 响应函数

4. **日志记录**：服务层使用 `logger` 记录操作