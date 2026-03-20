---
name: api-client
description: 创建前端 API 调用封装，自动生成类型安全的 API 客户端
---

# 创建 API 客户端

根据后端 API 接口生成前端调用封装。

## 使用方式

```
/api-client <name> [options]
```

**参数说明：**
- `<name>`: API 模块名称（如 `user`、`task`、`preset`）

**可选选项：**
- `--from-route`: 从后端路由文件自动生成
- `--types`: 同时生成类型定义

## 执行步骤

### 1. 分析需求

询问用户：
- API 模块名称
- 需要封装的接口方法
- 是否需要 TypeScript 类型

### 2. 创建类型定义

创建文件 `frontend/apps/web-antd/src/api/types/{name}.ts`：

```typescript
/**
 * {Name} API 类型定义
 */

/**
 * {Name} 数据结构
 */
export interface {Name} {
  id: string
  // TODO: 添加字段
  createdAt: string
  updatedAt: string
}

/**
 * 创建 {Name} 输入
 */
export interface {Name}CreateInput {
  // TODO: 添加创建字段
}

/**
 * 更新 {Name} 输入
 */
export interface {Name}UpdateInput {
  // TODO: 添加更新字段
}

/**
 * 列表查询参数
 */
export interface {Name}ListParams {
  page?: number
  pageSize?: number
  keyword?: string
}

/**
 * 列表响应
 */
export interface {Name}ListResponse {
  list: {Name}[]
  total: number
  page: number
  pageSize: number
}
```

### 3. 创建 API 封装

创建文件 `frontend/apps/web-antd/src/api/{name}.ts`：

```typescript
/**
 * {Name} API 封装
 */

import { request } from './request'
import type {
  {Name},
  {Name}CreateInput,
  {Name}UpdateInput,
  {Name}ListParams,
  {Name}ListResponse
} from './types/{name}'

/**
 * API 基础路径
 */
const BASE_URL = '/api/{name}'

/**
 * {Name} API
 */
export const {Name}Api = {
  /**
   * 获取列表
   */
  async getList(params?: {Name}ListParams): Promise<{Name}ListResponse> {
    return request.get(BASE_URL, { params })
  },

  /**
   * 获取详情
   */
  async getById(id: string): Promise<{Name}> {
    return request.get(`${BASE_URL}/${id}`)
  },

  /**
   * 创建
   */
  async create(data: {Name}CreateInput): Promise<{Name}> {
    return request.post(BASE_URL, data)
  },

  /**
   * 更新
   */
  async update(id: string, data: {Name}UpdateInput): Promise<{Name}> {
    return request.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * 删除
   */
  async delete(id: string): Promise<void> {
    return request.delete(`${BASE_URL}/${id}`)
  },

  /**
   * 批量删除
   */
  async batchDelete(ids: string[]): Promise<void> {
    return request.post(`${BASE_URL}/batch-delete`, { ids })
  }
}

export default {Name}Api
```

### 4. 创建请求工具（如不存在）

检查 `frontend/apps/web-antd/src/api/request.ts`，如不存在则创建：

```typescript
/**
 * HTTP 请求封装
 *
 * 基于 fetch 封装，支持：
 * - 自动添加认证 Token
 * - 统一错误处理
 * - 请求/响应拦截
 */

import type { AxiosRequestConfig } from 'axios'

interface RequestOptions extends AxiosRequestConfig {
  // 自定义选项
}

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 请求实例
 */
class Request {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || ''
  }

  /**
   * 获取认证 Token
   */
  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  /**
   * 通用请求方法
   */
  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const token = this.getToken()

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<T> = await response.json()

    if (result.code !== 0) {
      throw new Error(result.msg || '请求失败')
    }

    return result.data
  }

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }
}

export const request = new Request()
```

### 5. 创建索引文件

更新 `frontend/apps/web-antd/src/api/index.ts`：

```typescript
export * from './types/{name}'
export * from './{name}'
```

## 示例

```
用户: /api-client task --types

助手: 我将创建 task API 客户端。

创建文件：
- src/api/types/task.ts (类型定义)
- src/api/task.ts (API 封装)

导出接口：
- TaskApi.getList(params)
- TaskApi.getById(id)
- TaskApi.create(data)
- TaskApi.update(id, data)
- TaskApi.delete(id)
```

## 注意事项

1. **命名规范**：
   - 文件名：小写 kebab-case（`task.ts`）
   - API 对象：PascalCase + Api（`TaskApi`）
   - 类型：PascalCase（`Task`、`TaskCreateInput`）

2. **错误处理**：
   - HTTP 错误由 request 统一处理
   - 业务错误通过 code 判断

3. **认证**：
   - Token 自动从 localStorage 读取
   - 自动添加到 Authorization header