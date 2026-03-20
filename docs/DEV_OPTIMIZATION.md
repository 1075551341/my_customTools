# 项目优化文档

## 2026-03-20 项目优化记录

### 优化内容

本次优化主要包含以下四个方面：

1. **路由清理** - 删除旧的 `/upload` 路由
2. **数据精度统一** - 统一所有页面的数据格式化逻辑
3. **UI 样式统一** - 确保卡片 margin 和布局一致性
4. **文档更新** - 更新 CLAUDE.md 和开发文档

---

## 一、路由清理

### 背景

之前项目存在一个独立的 `/upload` 路由用于文件上传，但功能已经整合到各个功能划分页面（视频、图片、文档），因此需要删除旧路由。

### 修改内容

#### 删除的文件

1. `frontend/apps/web-antd/src/router/routes/modules/upload.ts` - 上传路由定义
2. `frontend/apps/web-antd/src/views/upload/index.vue` - 上传页面组件

#### 修改的文件

**`frontend/apps/web-antd/src/views/dashboard/index.vue`**

- 删除了 `goToUpload()` 函数
- 删除了快速操作区域的"上传文件"按钮
- 保留了"查看任务"按钮

### 验证步骤

1. 启动开发服务器
2. 访问 `http://localhost:5173/upload` 应该显示 404
3. 菜单中不应再显示"文件上传"选项
4. 登录后应自动跳转到 `/dashboard` 页面

---

## 二、数据精度统一

### 背景

各个页面中存在数据格式化逻辑不一致的问题：
- 文件大小格式化在不同地方重复定义
- 精度不统一（有的 2 位小数，有的没有）
- 时间格式化方式不一致

### 修改内容

#### 新增文件

**`frontend/apps/web-antd/src/utils/format.ts`** - 通用格式化工具

```typescript
// 文件大小格式化（如：1.23 MB）
function formatFileSize(bytes: number): string

// 时间格式化（如：2024-01-01 12:00:00）
function formatTime(dateStr: string): string

// 百分比格式化（如：95%）
function formatPercent(value: number, decimals?: number): string

// 使用率格式化（如：45.3%）
function formatUsageRate(value: number): string
```

**`frontend/apps/web-antd/src/utils/index.ts`** - 导出格式化工具

```typescript
export * from './format'
```

#### 修改的文件

所有页面组件统一导入并使用格式化工具：

1. `views/dashboard/index.vue`
2. `views/tasks/index.vue`
3. `views/video/index.vue`
4. `views/image/index.vue`
5. `views/document/index.vue`

每个页面的修改模式：

```typescript
// 导入工具函数
import { formatFileSize, formatTime } from '#/utils'

// 本地包装函数（保持模板兼容）
function formatFileSizeLocal(bytes: number): string {
  return formatFileSize(bytes)
}

function formatTimeLocal(dateStr: string): string {
  return formatTime(dateStr)
}
```

### 格式化规范

| 数据类型 | 函数 | 精度 | 示例 |
|---------|------|------|------|
| 文件大小 | `formatFileSize` | 2 位小数 | `1.23 MB` |
| 时间 | `formatTime` | - | `2024-01-01 12:00:00` |
| 百分比 | `formatPercent` | 0 位小数（默认） | `95%` |
| 使用率 | `formatUsageRate` | 1 位小数 | `45.3%` |

---

## 三、UI 样式统一

### 背景

各页面的卡片间距、Row gutter 设置不统一，影响视觉一致性。

### 修改内容

所有页面统一使用以下样式规范：

1. **卡片底部间距**: 统一使用 `mb-4` 类
2. **Row gutter**: 统一设置为 `16`
3. **统计卡片**: 统一使用相同的样式结构

### 检查清单

- [x] Dashboard 页面 - 统计卡片、队列状态、系统状态卡片间距统一
- [x] Tasks 页面 - 统计卡片、任务列表卡片间距统一
- [x] Video 页面 - 上传区域、任务列表卡片间距统一
- [x] Image 页面 - 上传区域、快捷配置、任务列表卡片间距统一
- [x] Document 页面 - 上传区域、功能说明、任务列表卡片间距统一

---

## 四、文档更新

### CLAUDE.md 更新

新增了**数据格式化规范**章节：

```markdown
### 数据格式化规范

所有页面统一使用 `#/utils` 中的格式化函数：

```typescript
import { formatFileSize, formatTime, formatPercent, formatUsageRate } from '#/utils';
```

- `formatFileSize(bytes)` - 文件大小格式化（如：1.23 MB）
- `formatTime(dateStr)` - 时间格式化（如：2024-01-01 12:00:00）
- `formatPercent(value, decimals)` - 百分比格式化（如：95%）
- `formatUsageRate(value)` - 使用率格式化（如：45.3%）
```

---

## 测试验证

### 功能测试

1. **登录跳转测试**
   - [ ] 退出登录
   - [ ] 重新登录
   - [ ] 验证自动跳转到 `/dashboard`

2. **路由删除验证**
   - [ ] 访问 `/upload` 应显示 404
   - [ ] 菜单中不显示"文件上传"

3. **数据精度验证**
   - [ ] 检查所有文件大小显示是否为 `X.XX MB/GB` 格式
   - [ ] 检查所有时间显示是否为 `YYYY-MM-DD HH:MM:SS` 格式
   - [ ] 检查 CPU/内存使用率是否为 `XX.X%` 格式

4. **UI 一致性验证**
   - [ ] 使用浏览器 DevTools 检查卡片 margin 值
   - [ ] 检查所有 Row 的 gutter 是否为 16

### 边界情况测试

- [ ] 文件大小为 0 时的显示
- [ ] 时间字符串为空时的显示
- [ ] 极大文件（TB 级别）的显示

---

## 相关文件清单

### 新增文件
- `frontend/apps/web-antd/src/utils/format.ts`
- `docs/DEV_OPTIMIZATION.md` (本文档)

### 删除文件
- `frontend/apps/web-antd/src/router/routes/modules/upload.ts`
- `frontend/apps/web-antd/src/views/upload/index.vue`

### 修改文件
- `frontend/apps/web-antd/src/utils/index.ts`
- `frontend/apps/web-antd/src/views/dashboard/index.vue`
- `frontend/apps/web-antd/src/views/tasks/index.vue`
- `frontend/apps/web-antd/src/views/video/index.vue`
- `frontend/apps/web-antd/src/views/image/index.vue`
- `frontend/apps/web-antd/src/views/document/index.vue`
- `CLAUDE.md`

---

## 注意事项

1. **缓存清理**: 修改后建议清理浏览器缓存和 Vite 缓存
   ```bash
   rm -rf frontend/node_modules/.vite
   ```

2. **类型检查**: 确保 TypeScript 编译无错误
   ```bash
   cd frontend && pnpm type-check
   ```

3. **代码检查**: 运行 ESLint 检查代码规范
   ```bash
   cd frontend && pnpm lint
   ```

---

## 恢复方案

如需恢复旧版本：

```bash
git checkout HEAD -- frontend/apps/web-antd/src/router/routes/modules/upload.ts
git checkout HEAD -- frontend/apps/web-antd/src/views/upload/index.vue
```

然后删除 `frontend/apps/web-antd/src/utils/format.ts` 并恢复其他文件的修改。
