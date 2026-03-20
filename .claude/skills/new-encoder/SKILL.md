---
name: new-encoder
description: 创建新的视频/图片/动图编码器插件，自动生成模板并注册到编码器索引
---

# 创建新编码器

根据用户指定的编码器类型和名称，创建完整的编码器插件。

## 使用方式

```
/new-encoder <type> <name>
```

**参数说明：**
- `<type>`: 编码器类型 - `video` | `image` | `anim`
- `<name>`: 编码器名称，如 `av1`、`webp`、`apng`

## 执行步骤

### 1. 确认参数

询问用户以下信息（如果未提供）：
- 编码器类型：video / image / anim
- 编码器名称：小写字母，如 `av1`、`hevc`
- 编码器描述：简短描述（可选）

### 2. 根据类型生成文件

#### 视频编码器 (video)

创建文件 `backend/src/encoders/video/{name}.ts`：

```typescript
/**
 * {Name} 编码器
 *
 * {description}
 *
 * @module encoders/video/{name}
 */

import ffmpeg from 'fluent-ffmpeg'
import { VideoEncoder, VideoInfo } from './base'
import type { VideoTranscodeConfig } from '../../types'

/**
 * {Name} 编码器类
 */
export class {Name}Encoder extends VideoEncoder {
  readonly name = '{name}'
  readonly codec = '{ffmpeg_codec}'  // 如 libaom-av1
  readonly extension = '{ext}'        // 如 mp4
  readonly description = '{Name} 编码器 - {desc}'
  readonly supportedFormats = ['mp4', 'webm', 'mkv']

  protected buildCommand(
    inputPath: string,
    outputPath: string,
    transcodeConfig: VideoTranscodeConfig,
    videoInfo: VideoInfo
  ): ffmpeg.FfmpegCommand {
    let command = ffmpeg(inputPath)
      .setFfmpegPath(this.ffmpegPath)
      .setFfprobePath(this.ffprobePath)
      .output(outputPath)
      .videoCodec(this.codec)

    // TODO: 根据编码器特性设置参数
    // CRF/码率、帧率、分辨率等

    return command
  }
}

export default new {Name}Encoder()
```

#### 图片编码器 (image)

创建文件 `backend/src/encoders/image/{name}.ts`：

```typescript
/**
 * {Name} 图片编码器
 *
 * {description}
 *
 * @module encoders/image/{name}
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { ImageEncoder } from './base'
import type { ImageTranscodeConfig } from '../../types'

/**
 * {Name} 图片编码器类
 */
export class {Name}Encoder extends ImageEncoder {
  readonly name = '{name}'
  readonly extension = '{ext}'  // 如 webp
  readonly description = '{Name} 图片编码器'
  readonly supportedFormats = ['jpg', 'png', 'webp']

  async transcode(
    inputPath: string,
    outputPath: string,
    config: ImageTranscodeConfig
  ): Promise<TranscodeResult> {
    // TODO: 实现 Sharp 转码逻辑
  }
}

export default new {Name}Encoder()
```

#### 动图编码器 (anim)

创建文件 `backend/src/encoders/anim/{name}.ts`：

```typescript
/**
 * {Name} 动图编码器
 *
 * {description}
 *
 * @module encoders/anim/{name}
 */

import ffmpeg from 'fluent-ffmpeg'
import { AnimEncoder } from './base'
import type { AnimTranscodeConfig } from '../../types'

/**
 * {Name} 动图编码器类
 */
export class {Name}Encoder extends AnimEncoder {
  readonly name = '{name}'
  readonly extension = '{ext}'
  readonly description = '{Name} 动图编码器'
  readonly supportedFormats = ['gif', 'webm', 'mp4']

  async transcode(
    inputPath: string,
    outputPath: string,
    config: AnimTranscodeConfig
  ): Promise<TranscodeResult> {
    // TODO: 实现 FFmpeg 转码逻辑
  }
}

export default new {Name}Encoder()
```

### 3. 更新索引文件

根据类型更新对应的索引文件：

#### video/index.ts
```typescript
// 添加导入
import { {Name}Encoder } from './{name}'

// 在 getAllEncoders 函数中添加
{Name}Encoder.getInfo(),
```

#### image/index.ts 或 anim/index.ts
类似更新

### 4. 输出摘要

完成后告知用户：
- 创建的文件路径
- 需要补充的实现细节
- 如何测试新编码器

## 示例

```
用户: /new-encoder video av1

助手: 我将创建 AV1 视频编码器。
- 编码器类名: Av1Encoder
- FFmpeg 编码器: libaom-av1
- 输出格式: mp4

请确认或提供更多描述信息。
```

## 注意事项

1. **类名转换**：使用 pascalCase（如 `av1` → `Av1`，`h265` → `H265`）
2. **检查冲突**：创建前检查文件是否已存在
3. **参考现有**：参考 `h264.ts` 或 `sharp.ts` 的实现模式