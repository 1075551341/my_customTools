---
name: vue-component
description: 创建 Vue 3 组件（支持 Composition API、TypeScript、样式），遵循 Vben Admin 规范
---

# 创建 Vue 组件

根据用户需求创建符合项目规范的 Vue 3 组件。

## 使用方式

```
/vue-component <name> [options]
```

**参数说明：**
- `<name>`: 组件名称，PascalCase 格式（如 `UserCard`、`TaskList`）

**可选选项：**
- `--page`: 创建页面组件（放在 `views/`）
- `--props`: 指定 props（如 `--props="title:string,count:number"`）
- `--slots`: 指定 slots（如 `--slots="default,header,footer"`）
- `--emit`: 指定 emits（如 `--emit="update,delete"`）

## 执行步骤

### 1. 确认组件类型

询问用户：
- 组件名称（如未提供）
- 组件类型：通用组件 / 页面组件 / 业务组件
- 是否需要 TypeScript 类型定义
- 是否需要单元测试

### 2. 创建组件文件

#### 通用组件 (components/)

创建文件 `frontend/apps/web-antd/src/components/{Name}/{Name}.vue`：

```vue
<script setup lang="ts">
/**
 * {Name} 组件
 *
 * {description}
 */

import { ref, computed } from 'vue'

// Props 定义
interface Props {
  title?: string
  // TODO: 添加更多 props
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

// Emits 定义
interface Emits {
  (e: 'update', value: string): void
  // TODO: 添加更多 emits
}

const emit = defineEmits<Emits>()

// 响应式状态
const localValue = ref('')

// 计算属性
const displayTitle = computed(() => props.title || '默认标题')

// 方法
const handleClick = () => {
  emit('update', localValue.value)
}
</script>

<template>
  <div class="{kebab-name}">
    <h3>{{ displayTitle }}</h3>
    <slot></slot>
  </div>
</template>

<style scoped>
.{kebab-name} {
  /* TODO: 添加样式 */
}
</style>
```

#### 页面组件 (views/)

创建文件 `frontend/apps/web-antd/src/views/{module}/{Name}.vue`：

```vue
<script setup lang="ts">
/**
 * {Name} 页面
 */

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 路由
const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const dataList = ref<any[]>([])

// 生命周期
onMounted(() => {
  fetchData()
})

// 方法
const fetchData = async () => {
  loading.value = true
  try {
    // TODO: 调用 API
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="{kebab-name}-page">
    <a-card :loading="loading">
      <!-- TODO: 页面内容 -->
    </a-card>
  </div>
</template>

<style scoped>
.{kebab-name}-page {
  padding: 16px;
}
</style>
```

### 3. 创建类型定义（可选）

创建文件 `frontend/apps/web-antd/src/components/{Name}/types.ts`：

```typescript
/**
 * {Name} 组件类型定义
 */

export interface {Name}Props {
  // TODO: 定义 props 类型
}

export interface {Name}Emits {
  // TODO: 定义 emits 类型
}
```

### 4. 创建单元测试（可选）

创建文件 `frontend/apps/web-antd/src/components/{Name}/__tests__/{Name}.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {Name} from '../{Name}.vue'

describe('{Name}', () => {
  it('renders properly', () => {
    const wrapper = mount({Name})
    expect(wrapper.exists()).toBe(true)
  })
})
```

### 5. 创建索引文件

创建文件 `frontend/apps/web-antd/src/components/{Name}/index.ts`：

```typescript
export { default as {Name} } from './{Name}.vue'
export * from './types'
```

## 示例

```
用户: /vue-component TaskCard --props="title:string,status:string" --emit="click,edit"

助手: 我将创建 TaskCard 组件，包含以下特性：
- Props: title, status
- Emits: click, edit
- TypeScript 类型定义

创建文件：
- src/components/TaskCard/TaskCard.vue
- src/components/TaskCard/types.ts
- src/components/TaskCard/index.ts
```

## 注意事项

1. **命名规范**：
   - 组件名：PascalCase（`TaskCard`）
   - 文件名：与组件名一致
   - CSS 类名：kebab-case（`task-card`）

2. **目录结构**：
   ```
   components/TaskCard/
   ├── TaskCard.vue
   ├── types.ts
   ├── index.ts
   └── __tests__/
       └── TaskCard.test.ts
   ```

3. **导入规范**：
   - 使用 `@/` 别名引用 src 目录
   - API 调用使用 `@/api/` 封装