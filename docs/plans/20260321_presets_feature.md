# 转码预设模板管理功能开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现转码预设模板的 CRUD 管理，支持用户保存和快速应用常用转码配置。

**Architecture:**
- 后端：新增 presets 路由和服务层，SQLite 数据库存储预设
- 前端：预设管理页面组件，预设选择器组件
- 预设类型：video（视频）、image（图片）、document（文档）

**Tech Stack:** Node.js + Express, Better-SQLite3, Vue 3 + TypeScript, Ant Design Vue

**开发顺序：** 数据库迁移 → 后端 API → 前端页面 → 联调测试

---

## 任务列表

### Task 1: 数据库预设表设计

**Files:**
- Create: `backend/src/db/presets.ts`
- Test: `backend/src/__tests__/presets.test.ts`

- [ ] **Step 1: 创建 presets 数据库表**

```typescript
// backend/src/db/presets.ts
import { db } from './sqlite'

/**
 * 预设表结构
 * id: 预设 ID（主键）
 * name: 预设名称
 * type: 预设类型（video/image/document）
 * config: 转码配置（JSON）
 * isSystem: 是否系统预设
 * userId: 创建用户 ID（可选）
 * createdAt: 创建时间
 * updatedAt: 更新时间
 */
export function initPresetsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('video', 'image', 'document')),
      config TEXT NOT NULL,
      isSystem INTEGER DEFAULT 0,
      userId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(name, type, userId)
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_type ON presets(type)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_presets_user ON presets(userId)
  `)
}

/**
 * 预设配置接口
 */
export interface PresetConfig {
  // 视频预设配置
  codec?: string
  resolution?: string
  bitrate?: string
  fps?: number
  // 图片预设配置
  format?: string
  quality?: number
  width?: number
  height?: number
  // 文档预设配置
  targetFormat?: string
  merge?: boolean
}

/**
 * 预设数据接口
 */
export interface Preset {
  id: string
  name: string
  type: 'video' | 'image' | 'document'
  config: PresetConfig
  isSystem: boolean
  userId?: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: 实现预设 CRUD 操作**

```typescript
// 获取所有预设
export function getAllPresets(type?: string): Preset[] {
  let sql = 'SELECT * FROM presets'
  const params: any[] = []

  if (type) {
    sql += ' WHERE type = ?'
    params.push(type)
  }

  sql += ' ORDER BY isSystem DESC, name ASC'

  return db.prepare(sql).all(params) as Preset[]
}

// 获取单个预设
export function getPresetById(id: string): Preset | undefined {
  return db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as Preset | undefined
}

// 创建预设
export function createPreset(preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>): Preset {
  const id = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO presets (id, name, type, config, isSystem, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    preset.name,
    preset.type,
    JSON.stringify(preset.config),
    preset.isSystem ? 1 : 0,
    preset.userId,
    now,
    now
  )

  return { ...preset, id, createdAt: now, updatedAt: now } as Preset
}

// 更新预设
export function updatePreset(id: string, updates: Partial<Preset>): Preset | undefined {
  const preset = getPresetById(id)
  if (!preset) return undefined

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(JSON.stringify(updates.config))
  }

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.prepare(`UPDATE presets SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  return { ...preset, ...updates, updatedAt: now }
}

// 删除预设
export function deletePreset(id: string): boolean {
  const preset = getPresetById(id)
  if (!preset || preset.isSystem) return false

  db.prepare('DELETE FROM presets WHERE id = ?').run(id)
  return true
}

// 初始化系统预设
export function initSystemPresets() {
  const systemPresets = [
    {
      name: '视频 - 通用 H.264',
      type: 'video' as const,
      config: { codec: 'h264', resolution: '1080p', bitrate: '5000k', fps: 30 },
      isSystem: true,
    },
    {
      name: '视频 - 高清 H.265',
      type: 'video' as const,
      config: { codec: 'h265', resolution: '1080p', bitrate: '3000k', fps: 30 },
      isSystem: true,
    },
    {
      name: '图片 - WebP 高质量',
      type: 'image' as const,
      config: { format: 'webp', quality: 90 },
      isSystem: true,
    },
    {
      name: '图片 - JPEG 压缩',
      type: 'image' as const,
      config: { format: 'jpeg', quality: 80 },
      isSystem: true,
    },
    {
      name: '文档 - PDF 标准',
      type: 'document' as const,
      config: { targetFormat: 'pdf' },
      isSystem: true,
    },
  ]

  for (const preset of systemPresets) {
    try {
      createPreset({ ...preset, config: preset.config as PresetConfig, userId: undefined })
    } catch (e) {
      // 已存在则跳过
    }
  }
}
```

- [ ] **Step 3: 编写数据库迁移测试**

```typescript
// backend/src/__tests__/presets.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '../db/sqlite'
import {
  initPresetsTable,
  createPreset,
  getPresetById,
  getAllPresets,
  updatePreset,
  deletePreset
} from '../db/presets'

describe('Presets 数据库操作', () => {
  beforeAll(() => {
    initPresetsTable()
  })

  it('创建视频预设', () => {
    const preset = createPreset({
      name: '测试预设',
      type: 'video',
      config: { codec: 'h264', resolution: '1080p' },
      isSystem: false,
    })

    expect(preset.id).toBeDefined()
    expect(preset.name).toBe('测试预设')
    expect(preset.type).toBe('video')
  })

  it('获取预设列表', () => {
    const presets = getAllPresets()
    expect(presets.length).toBeGreaterThan(0)
  })

  it('按类型过滤预设', () => {
    const videoPresets = getAllPresets('video')
    expect(videoPresets.every(p => p.type === 'video')).toBe(true)
  })

  it('更新预设', () => {
    const preset = createPreset({
      name: '更新测试',
      type: 'image',
      config: { format: 'png' },
      isSystem: false,
    })

    const updated = updatePreset(preset.id, { name: '新名称' })
    expect(updated?.name).toBe('新名称')
  })

  it('删除预设', () => {
    const preset = createPreset({
      name: '删除测试',
      type: 'document',
      config: { targetFormat: 'pdf' },
      isSystem: false,
    })

    expect(deletePreset(preset.id)).toBe(true)
    expect(getPresetById(preset.id)).toBeUndefined()
  })

  it('系统预设不可删除', () => {
    const systemPresets = getAllPresets().filter(p => p.isSystem)
    if (systemPresets.length > 0) {
      expect(deletePreset(systemPresets[0].id)).toBe(false)
    }
  })
})
```

- [ ] **Step 4: 运行测试验证**

```bash
cd backend && pnpm vitest run src/__tests__/presets.test.ts
```

预期输出：6 个测试全部通过

- [ ] **Step 5: 提交代码**

```bash
git add backend/src/db/presets.ts backend/src/__tests__/presets.test.ts
git commit -m "feat(db): 创建 presets 数据库表和 CRUD 操作"
```

---

### Task 2: 预设 API 路由开发

**Files:**
- Create: `backend/src/routes/presets.ts`
- Create: `backend/src/services/presets.ts`
- Modify: `backend/src/routes/index.ts`

- [ ] **Step 1: 创建预设服务层**

```typescript
// backend/src/services/presets.ts
import {
  getAllPresets,
  getPresetById,
  createPreset,
  updatePreset,
  deletePreset,
  type Preset,
  type PresetConfig
} from '../db/presets'
import logger from '../utils/logger'

export class PresetsService {
  /**
   * 获取预设列表
   */
  static getList(type?: string): Preset[] {
    logger.info('获取预设列表', { type })
    return getAllPresets(type)
  }

  /**
   * 获取单个预设
   */
  static getById(id: string): Preset | null {
    const preset = getPresetById(id)
    if (!preset) {
      logger.warn('预设不存在', { id })
      return null
    }
    return preset
  }

  /**
   * 创建预设
   */
  static create(
    name: string,
    type: 'video' | 'image' | 'document',
    config: PresetConfig,
    userId?: string
  ): Preset {
    logger.info('创建预设', { name, type })

    return createPreset({
      name,
      type,
      config,
      isSystem: false,
      userId,
    })
  }

  /**
   * 更新预设
   */
  static update(
    id: string,
    updates: { name?: string; config?: PresetConfig },
    userId?: string
  ): Preset | null {
    logger.info('更新预设', { id, updates })

    const preset = getPresetById(id)
    if (!preset) return null

    // 系统预设只能修改 config，不能修改 name
    if (preset.isSystem && updates.name) {
      logger.warn('系统预设不可修改名称', { id })
      return null
    }

    // 检查权限：只能修改自己的预设
    if (preset.userId && preset.userId !== userId) {
      logger.warn('无权修改他人预设', { id, userId })
      return null
    }

    return updatePreset(id, updates) || null
  }

  /**
   * 删除预设
   */
  static delete(id: string, userId?: string): boolean {
    logger.info('删除预设', { id })

    const preset = getPresetById(id)
    if (!preset) return false

    // 系统预设不可删除
    if (preset.isSystem) {
      logger.warn('系统预设不可删除', { id })
      return false
    }

    // 检查权限
    if (preset.userId && preset.userId !== userId) {
      logger.warn('无权删除他人预设', { id, userId })
      return false
    }

    return deletePreset(id)
  }
}
```

- [ ] **Step 2: 创建预设路由**

```typescript
// backend/src/routes/presets.ts
import { Router, Request, Response } from 'express'
import { success, error } from '../utils/response'
import { authenticate } from '../middlewares/auth'
import { PresetsService } from '../services/presets'

const router = Router()

/**
 * GET /api/presets
 * 获取预设列表
 * Query: type - 按类型过滤 (video|image|document)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query
    const presets = PresetsService.getList(type as string)
    return success(res, presets)
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * GET /api/presets/:id
 * 获取单个预设详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const preset = PresetsService.getById(id)

    if (!preset) {
      return error(res, '预设不存在', 404)
    }

    return success(res, preset)
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * POST /api/presets
 * 创建新预设（需要认证）
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, type, config } = req.body

    if (!name || !type || !config) {
      return error(res, '缺少必要参数：name, type, config', 400)
    }

    if (!['video', 'image', 'document'].includes(type)) {
      return error(res, '无效的预设类型', 400)
    }

    const userId = (req as any).user?.id
    const preset = PresetsService.create(name, type, config, userId)

    return success(res, preset, '预设创建成功', 201)
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * PUT /api/presets/:id
 * 更新预设（需要认证）
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, config } = req.body
    const userId = (req as any).user?.id

    const preset = PresetsService.getById(id)
    if (!preset) {
      return error(res, '预设不存在', 404)
    }

    const updated = PresetsService.update(id, { name, config }, userId)
    if (!updated) {
      return error(res, '更新失败或无权限', 403)
    }

    return success(res, updated, '预设更新成功')
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

/**
 * DELETE /api/presets/:id
 * 删除预设（需要认证）
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).user?.id

    const success = PresetsService.delete(id, userId)
    if (!success) {
      return error(res, '删除失败：可能是系统预设或无权限', 403)
    }

    return success(res, null, '预设删除成功')
  } catch (err) {
    return error(res, (err as Error).message)
  }
})

export default router
```

- [ ] **Step 3: 注册路由**

```typescript
// backend/src/routes/index.ts 中添加
import presetsRoutes from './presets'

// 在 router 注册处添加
router.use('/presets', presetsRoutes)
```

- [ ] **Step 4: 使用 curl 测试 API**

```bash
# 获取预设列表
curl http://localhost:3001/api/presets | jq

# 创建预设（需要登录后获取 token）
TOKEN="your-jwt-token"
curl -X POST http://localhost:3001/api/presets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的预设",
    "type": "video",
    "config": {"codec": "h264", "resolution": "720p"}
  }' | jq
```

- [ ] **Step 5: 提交代码**

```bash
git add backend/src/services/presets.ts backend/src/routes/presets.ts backend/src/routes/index.ts
git commit -m "feat(api): 创建 presets API 路由和服务"
```

---

### Task 3: 前端预设管理页面开发

**Files:**
- Create: `frontend/apps/web-antd/src/views/settings/presets/index.vue`
- Create: `frontend/apps/web-antd/src/api/presets.ts`
- Create: `frontend/apps/web-antd/src/components/common/PresetSelector.vue`

- [ ] **Step 1: 创建 API 封装**

```typescript
// frontend/apps/web-antd/src/api/presets.ts
import { defHttp } from '@vben/core/requests'

export interface PresetConfig {
  codec?: string
  resolution?: string
  bitrate?: string
  fps?: number
  format?: string
  quality?: number
  width?: number
  height?: number
  targetFormat?: string
  merge?: boolean
}

export interface Preset {
  id: string
  name: string
  type: 'video' | 'image' | 'document'
  config: PresetConfig
  isSystem: boolean
  userId?: string
  createdAt: string
  updatedAt: string
}

/**
 * 获取预设列表
 */
export function getPresetsApi(type?: string) {
  return defHttp.get<Preset[]>({
    url: '/api/presets',
    params: type ? { type } : {},
  })
}

/**
 * 获取单个预设
 */
export function getPresetByIdApi(id: string) {
  return defHttp.get<Preset>({
    url: `/api/presets/${id}`,
  })
}

/**
 * 创建预设
 */
export function createPresetApi(data: {
  name: string
  type: 'video' | 'image' | 'document'
  config: PresetConfig
}) {
  return defHttp.post<Preset>({
    url: '/api/presets',
    data,
  })
}

/**
 * 更新预设
 */
export function updatePresetApi(
  id: string,
  data: { name?: string; config?: PresetConfig }
) {
  return defHttp.put<Preset>({
    url: `/api/presets/${id}`,
    data,
  })
}

/**
 * 删除预设
 */
export function deletePresetApi(id: string) {
  return defHttp.delete({
    url: `/api/presets/${id}`,
  })
}
```

- [ ] **Step 2: 创建预设管理页面**

```vue
<!-- frontend/apps/web-antd/src/views/settings/presets/index.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  getPresetsApi,
  createPresetApi,
  updatePresetApi,
  deletePresetApi,
  type Preset,
  type PresetConfig,
} from '@/api/presets'

// 状态
const loading = ref(false)
const presets = ref<Preset[]>([])
const visible = ref(false)
const editingPreset = ref<Preset | null>(null)
const typeFilter = ref<string>('')

// 表单
const formModel = reactive({
  name: '',
  type: 'video' as 'video' | 'image' | 'document',
  config: {} as PresetConfig,
})

// 过滤后的预设列表
const filteredPresets = computed(() => {
  if (!typeFilter.value) return presets.value
  return presets.value.filter(p => p.type === typeFilter.value)
})

// 加载预设列表
const fetchPresets = async () => {
  loading.value = true
  try {
    const result = await getPresetsApi(typeFilter.value)
    presets.value = result
  } catch (err) {
    message.error('加载预设失败')
  } finally {
    loading.value = false
  }
}

// 打开新建对话框
const handleCreate = () => {
  editingPreset.value = null
  formModel.name = ''
  formModel.type = 'video'
  formModel.config = {}
  visible.value = true
}

// 打开编辑对话框
const handleEdit = (record: Preset) => {
  if (record.isSystem) {
    message.warning('系统预设仅可查看，不可编辑')
    return
  }
  editingPreset.value = record
  formModel.name = record.name
  formModel.type = record.type
  formModel.config = { ...record.config }
  visible.value = true
}

// 保存预设
const handleSave = async () => {
  if (!formModel.name.trim()) {
    message.warning('请输入预设名称')
    return
  }

  try {
    if (editingPreset.value) {
      await updatePresetApi(editingPreset.value.id, {
        name: formModel.name,
        config: formModel.config,
      })
      message.success('预设更新成功')
    } else {
      await createPresetApi({
        name: formModel.name,
        type: formModel.type,
        config: formModel.config,
      })
      message.success('预设创建成功')
    }
    visible.value = false
    fetchPresets()
  } catch (err: any) {
    message.error(err.message || '操作失败')
  }
}

// 删除预设
const handleDelete = (record: Preset) => {
  if (record.isSystem) {
    message.warning('系统预设不可删除')
    return
  }

  Modal.confirm({
    title: '确认删除',
    content: `确定要删除预设 "${record.name}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deletePresetApi(record.id)
        message.success('预设删除成功')
        fetchPresets()
      } catch (err: any) {
        message.error(err.message || '删除失败')
      }
    },
  })
}

// 类型标签
const typeLabels: Record<string, string> = {
  video: '视频',
  image: '图片',
  document: '文档',
}

onMounted(() => {
  fetchPresets()
})
</script>

<template>
  <div class="presets-page">
    <a-card title="转码预设管理">
      <template #extra>
        <a-space>
          <a-select
            v-model:value="typeFilter"
            placeholder="全部类型"
            style="width: 120px"
            allow-clear
            @change="fetchPresets"
          >
            <a-select-option value="video">视频</a-select-option>
            <a-select-option value="image">图片</a-select-option>
            <a-select-option value="document">文档</a-select-option>
          </a-select>
          <a-button type="primary" @click="handleCreate">新建预设</a-button>
        </a-space>
      </template>

      <a-table
        :loading="loading"
        :columns="[
          { title: '名称', dataIndex: 'name', key: 'name' },
          { title: '类型', dataIndex: 'type', key: 'type', slots: { customRender: 'type' } },
          { title: '配置', dataIndex: 'config', key: 'config', slots: { customRender: 'config' } },
          { title: '操作', key: 'action', slots: { customRender: 'action' }, width: 200 },
        ]"
        :data-source="filteredPresets"
        :pagination="false"
      >
        <template #type="{ text }">
          <a-tag :color="text === 'video' ? 'blue' : text === 'image' ? 'green' : 'orange'">
            {{ typeLabels[text] }}
          </a-tag>
        </template>

        <template #config="{ text }">
          <a-typography-paragraph :copyable="false">
            <template #copyable>{{ false }}</template>
            {{ JSON.stringify(text) }}
          </a-typography-paragraph>
        </template>

        <template #action="{ record }">
          <a-space>
            <a @click="handleEdit(record)">编辑</a>
            <a v-if="!record.isSystem" @click="handleDelete(record)" class="text-danger">删除</a>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 新建/编辑对话框 -->
    <a-modal
      v-model:open="visible"
      :title="editingPreset ? '编辑预设' : '新建预设'"
      width="600px"
      @ok="handleSave"
    >
      <a-form :model="formModel" layout="vertical">
        <a-form-item label="预设名称" required>
          <a-input
            v-model:value="formModel.name"
            placeholder="例如：视频 - 高清 H.264"
            maxlength="50"
          />
        </a-form-item>

        <a-form-item label="预设类型" v-if="!editingPreset" required>
          <a-radio-group v-model:value="formModel.type">
            <a-radio value="video">视频</a-radio>
            <a-radio value="image">图片</a-radio>
            <a-radio value="document">文档</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="转码配置" required>
          <a-collapse>
            <a-collapse-panel key="video" v-if="formModel.type === 'video'">
              <a-form-item label="编码器">
                <a-select v-model:value="formModel.config.codec">
                  <a-select-option value="h264">H.264</a-select-option>
                  <a-select-option value="h265">H.265</a-select-option>
                  <a-select-option value="vp9">VP9</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="分辨率">
                <a-select v-model:value="formModel.config.resolution">
                  <a-select-option value="480p">480p</a-select-option>
                  <a-select-option value="720p">720p</a-select-option>
                  <a-select-option value="1080p">1080p</a-select-option>
                  <a-select-option value="4k">4K</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="码率">
                <a-input v-model:value="formModel.config.bitrate" placeholder="例如：5000k" />
              </a-form-item>
              <a-form-item label="帧率">
                <a-input-number v-model:value="formModel.config.fps" :min="1" :max="60" />
              </a-form-item>
            </a-collapse-panel>

            <a-collapse-panel key="image" v-if="formModel.type === 'image'">
              <a-form-item label="输出格式">
                <a-select v-model:value="formModel.config.format">
                  <a-select-option value="jpeg">JPEG</a-select-option>
                  <a-select-option value="png">PNG</a-select-option>
                  <a-select-option value="webp">WebP</a-select-option>
                  <a-select-option value="avif">AVIF</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="质量 (0-100)">
                <a-slider v-model:value="formModel.config.quality" :min="1" :max="100" />
              </a-form-item>
            </a-collapse-panel>

            <a-collapse-panel key="document" v-if="formModel.type === 'document'">
              <a-form-item label="目标格式">
                <a-select v-model:value="formModel.config.targetFormat">
                  <a-select-option value="pdf">PDF</a-select-option>
                  <a-select-option value="csv">CSV</a-select-option>
                  <a-select-option value="word">Word</a-select-option>
                </a-select>
              </a-form-item>
            </a-collapse-panel>
          </a-collapse>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.presets-page {
  padding: 16px;
}

.text-danger {
  color: #ff4d4f;
}
</style>
```

- [ ] **Step 3: 创建预设选择器组件**

```vue
<!-- frontend/apps/web-antd/src/components/common/PresetSelector.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getPresetsApi, type Preset } from '@/api/presets'

const props = defineProps<{
  type: 'video' | 'image' | 'document'
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', preset: Preset): void
}>()

const loading = ref(false)
const presets = ref<Preset[]>([])
const selectedPresetId = ref<string>(props.modelValue || '')

const fetchPresets = async () => {
  loading.value = true
  try {
    presets.value = await getPresetsApi(props.type)
  } catch (err) {
    console.error('加载预设失败', err)
  } finally {
    loading.value = false
  }
}

const handlePresetChange = (id: string) => {
  const preset = presets.value.find(p => p.id === id)
  if (preset) {
    emit('update:modelValue', id)
    emit('change', preset)
  }
}

watch(() => props.type, fetchPresets)
watch(() => props.modelValue, val => {
  if (val) selectedPresetId.value = val
})

onMounted(() => {
  fetchPresets()
})
</script>

<template>
  <a-select
    v-model:value="selectedPresetId"
    :loading="loading"
    placeholder="选择预设"
    allow-clear
    @change="handlePresetChange"
  >
    <a-select-option-group label="系统预设">
      <a-select-option
        v-for="p in presets.filter(p => p.isSystem)"
        :key="p.id"
        :value="p.id"
      >
        {{ p.name }}
      </a-select-option>
    </a-select-option-group>
    <a-select-option-group label="我的预设" v-if="presets.some(p => !p.isSystem)">
      <a-select-option
        v-for="p in presets.filter(p => !p.isSystem)"
        :key="p.id"
        :value="p.id"
      >
        {{ p.name }}
      </a-select-option>
    </a-select-option-group>
  </a-select>
</template>
```

- [ ] **Step 4: 添加路由**

```typescript
// frontend/apps/web-antd/src/router/routes/modules/settings.ts
// 在 settings 路由下添加 presets 子路由
{
  name: 'SettingsPresets',
  path: '/settings/presets',
  component: () => import('@/views/settings/presets/index.vue'),
  meta: {
    title: '转码预设',
    icon: 'preset',
  },
}
```

- [ ] **Step 5: 提交代码**

```bash
git add frontend/apps/web-antd/src/views/settings/presets/ frontend/apps/web-antd/src/api/presets.ts frontend/apps/web-antd/src/components/common/PresetSelector.vue
git commit -m "feat(frontend): 创建预设管理页面和选择器组件"
```

---

### Task 4: 在转码页面集成预设功能

**Files:**
- Modify: `frontend/apps/web-antd/src/views/video/index.vue`
- Modify: `frontend/apps/web-antd/src/views/image/index.vue`
- Modify: `frontend/apps/web-antd/src/views/document/index.vue`

- [ ] **Step 1: 在视频转码页面集成预设选择器**

```vue
<!-- frontend/apps/web-antd/src/views/video/index.vue -->
<script setup lang="ts">
// 在现有的 script 中添加
import PresetSelector from '@/components/common/PresetSelector.vue'

const selectedPresetId = ref('')

// 预设变更处理
const handlePresetChange = (preset: Preset) => {
  // 根据预设填充表单
  if (preset.config.codec) formModel.codec = preset.config.codec
  if (preset.config.resolution) formModel.resolution = preset.config.resolution
  if (preset.config.bitrate) formModel.bitrate = preset.config.bitrate
  if (preset.config.fps) formModel.fps = preset.config.fps
  message.success(`已应用预设 "${preset.name}"`)
}
</script>

<template>
  <!-- 在转码配置卡片中添加 -->
  <a-card title="转码配置">
    <a-form>
      <a-form-item label="预设模板">
        <PresetSelector
          type="video"
          v-model="selectedPresetId"
          @change="handlePresetChange"
        />
      </a-form-item>
      <!-- 其他配置项... -->
    </a-form>
  </a-card>
</template>
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/apps/web-antd/src/views/video/index.vue frontend/apps/web-antd/src/views/image/index.vue frontend/apps/web-antd/src/views/document/index.vue
git commit -m "feat: 在转码页面集成预设选择器"
```

---

### Task 5: 后端初始化系统预设和联调测试

**Files:**
- Modify: `backend/src/db/config.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: 应用启动时初始化系统预设**

```typescript
// backend/src/db/config.ts 中添加
import { initSystemPresets } from './presets'

// 在数据库初始化后调用
export async function initDatabase() {
  // 现有初始化代码...

  // 初始化系统预设
  initSystemPresets()
  console.log('✅ 系统预设初始化完成')
}
```

- [ ] **Step 2: 完整功能测试**

```bash
# 1. 启动后端
pnpm --prefix backend dev

# 2. 测试 API
curl http://localhost:3001/api/presets | jq .

# 3. 启动前端
cd frontend/apps/web-antd && pnpm dev

# 4. 浏览器访问 http://localhost:5173/settings/presets
# 5. 测试新建、编辑、删除预设
# 6. 测试在转码页面应用预设
```

- [ ] **Step 3: 提交代码**

```bash
git add backend/src/db/config.ts
git commit -m "feat: 应用启动时初始化系统预设"
```

---

### Task 6: 文档更新和最终验证

**Files:**
- Modify: `backend/README.md`
- Modify: `frontend/apps/web-antd/README.md`

- [ ] **Step 1: 更新 API 文档**

在 `backend/README.md` 中添加 presets API 说明

- [ ] **Step 2: 更新用户文档**

在 `README.md` 中添加预设功能使用说明

- [ ] **Step 3: 运行完整测试**

```bash
# 后端测试
cd backend && pnpm test

# 前端类型检查
cd frontend/apps/web-antd && pnpm exec vue-tsc --noEmit

# 提交最终代码
git add .
git commit -m "docs: 更新预设功能文档"
```

---

## 验收标准

1. ✅ 用户可以创建自定义转码预设
2. ✅ 系统预设（H.264、H.265、WebP 等）自动初始化
3. ✅ 预设管理页面支持 CRUD 操作
4. ✅ 转码页面可以选择预设快速配置
5. ✅ 系统预设不可删除，只能修改配置
6. ✅ 用户预设可以删除和修改

## 预计完成时间

- Task 1: 数据库层 - 约 30 分钟
- Task 2: API 层 - 约 30 分钟
- Task 3: 前端页面 - 约 60 分钟
- Task 4: 集成联调 - 约 30 分钟
- Task 5: 测试验收 - 约 30 分钟

**总计：约 3 小时**
