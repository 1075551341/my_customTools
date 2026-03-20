---
name: test-gen
description: 生成单元测试或 E2E 测试文件，支持 Vitest 和 Playwright
---

# 生成测试文件

根据源文件自动生成对应的测试文件。

## 使用方式

```
/test-gen <target> [options]
```

**参数说明：**
- `<target>`: 目标文件路径或描述（如 `backend/src/services/user.ts` 或 "用户服务"）

**可选选项：**
- `--unit`: 生成单元测试（Vitest）
- `--e2e`: 生成 E2E 测试（Playwright）
- `--coverage`: 生成覆盖率报告配置

## 执行步骤

### 1. 分析目标文件

- 读取源文件
- 识别导出的函数、类、组件
- 分析依赖项

### 2. 根据类型生成测试

#### 后端服务测试 (Vitest)

```typescript
/**
 * {ServiceName} 服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { {ServiceName} } from '../{service-name}'

// Mock 依赖
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

describe('{ServiceName}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('应该返回列表数据', async () => {
      const result = await {ServiceName}.getList({})
      expect(result).toBeDefined()
    })

    it('应该支持分页参数', async () => {
      const result = await {ServiceName}.getList({ page: 1, pageSize: 10 })
      expect(result).toBeDefined()
    })
  })

  describe('getById', () => {
    it('应该返回指定 ID 的数据', async () => {
      const result = await {ServiceName}.getById('test-id')
      expect(result).toBeDefined()
    })

    it('ID 不存在时应该抛出错误', async () => {
      await expect({ServiceName}.getById('invalid-id')).rejects.toThrow()
    })
  })

  describe('create', () => {
    it('应该创建新记录', async () => {
      const data = { name: 'test' }
      const result = await {ServiceName}.create(data)
      expect(result).toMatchObject(data)
    })
  })

  describe('update', () => {
    it('应该更新现有记录', async () => {
      const data = { name: 'updated' }
      const result = await {ServiceName}.update('test-id', data)
      expect(result).toMatchObject(data)
    })
  })

  describe('delete', () => {
    it('应该删除指定记录', async () => {
      await expect({ServiceName}.delete('test-id')).resolves.not.toThrow()
    })
  })
})
```

#### Vue 组件测试 (Vitest + @vue/test-utils)

```typescript
/**
 * {ComponentName} 组件测试
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import {ComponentName} from '../{ComponentName}.vue'

describe('{ComponentName}', () => {
  it('应该正确渲染', () => {
    const wrapper = mount({ComponentName})
    expect(wrapper.exists()).toBe(true)
  })

  it('应该显示传入的 title', () => {
    const title = '测试标题'
    const wrapper = mount({ComponentName}, {
      props: { title }
    })
    expect(wrapper.text()).toContain(title)
  })

  it('点击时应该触发 click 事件', async () => {
    const wrapper = mount({ComponentName})
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('应该渲染 slot 内容', () => {
    const wrapper = mount({ComponentName}, {
      slots: {
        default: '<span>自定义内容</span>'
      }
    })
    expect(wrapper.html()).toContain('自定义内容')
  })
})
```

#### API 路由测试 (Supertest)

```typescript
/**
 * {RouteName} 路由测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'

describe('{RouteName} API', () => {
  describe('GET /api/{route}', () => {
    it('应该返回 200 状态码', async () => {
      const response = await request(app).get('/api/{route}')
      expect(response.status).toBe(200)
    })

    it('应该返回正确的响应格式', async () => {
      const response = await request(app).get('/api/{route}')
      expect(response.body).toHaveProperty('code')
      expect(response.body).toHaveProperty('msg')
      expect(response.body).toHaveProperty('data')
    })
  })

  describe('POST /api/{route}', () => {
    it('应该创建新记录', async () => {
      const response = await request(app)
        .post('/api/{route}')
        .send({ name: 'test' })

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('id')
    })

    it('缺少必填字段时应该返回 400', async () => {
      const response = await request(app)
        .post('/api/{route}')
        .send({})

      expect(response.status).toBe(400)
    })
  })
})
```

#### E2E 测试 (Playwright)

```typescript
/**
 * {PageName} 页面 E2E 测试
 */

import { test, expect } from '@playwright/test'

test.describe('{PageName} 页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/{page-path}')
  })

  test('应该正确加载页面', async ({ page }) => {
    await expect(page).toHaveTitle(/{Title}/)
  })

  test('应该显示数据列表', async ({ page }) => {
    const list = page.locator('.data-list')
    await expect(list).toBeVisible()
  })

  test('点击添加按钮应该打开表单', async ({ page }) => {
    await page.click('button:has-text("添加")')
    const modal = page.locator('.ant-modal')
    await expect(modal).toBeVisible()
  })

  test('提交表单应该创建新记录', async ({ page }) => {
    // 打开表单
    await page.click('button:has-text("添加")')

    // 填写表单
    await page.fill('input[name="name"]', '测试数据')
    await page.click('button:has-text("确定")')

    // 验证结果
    await expect(page.locator('.ant-message-success')).toBeVisible()
  })
})
```

### 3. 输出测试文件

- 后端：`backend/src/__tests__/{name}.test.ts` 或 `backend/tests/{name}.test.ts`
- 前端：`frontend/apps/web-antd/src/components/{Name}/__tests__/{Name}.test.ts`
- E2E：`frontend/e2e/{name}.spec.ts`

## 示例

```
用户: /test-gen backend/src/services/user.ts --unit

助手: 我将分析 user.ts 并生成单元测试。

发现以下可测试项：
- UserService.getList()
- UserService.getById()
- UserService.create()
- UserService.update()
- UserService.delete()

创建文件：backend/src/__tests__/services/user.test.ts
```

## 注意事项

1. **Mock 策略**：
   - 外部依赖（数据库、API）必须 mock
   - 工具函数可选择 mock 或真实调用

2. **测试覆盖**：
   - 正常流程
   - 边界情况
   - 错误处理

3. **命名规范**：
   - 测试文件：`*.test.ts` 或 `*.spec.ts`
   - describe：使用被测试模块名
   - it：使用"应该..."描述