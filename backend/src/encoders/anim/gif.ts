/**
 * 动图编码器
 *
 * 使用 FFmpeg 处理 GIF 和 WebP 动图
 *
 * 功能说明：
 * - 支持视频转 GIF
 * - 支持视频转 WebP 动图
 * - 支持视频转 APNG
 * - 提供帧率、颜色、尺寸等控制参数
 *
 * @module encoders/anim/gif
 */

import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import config from '../../config'
import logger from '../../utils/logger'
import type { AnimTranscodeConfig } from '../../types'

/**
 * 动图编码器信息
 */
export interface AnimEncoderInfo {
  name: string
  format: string
  extension: string
  description: string
  supportsTransparency: boolean
}

/**
 * 动图转码结果
 */
export interface AnimTranscodeResult {
  outputPath: string
  outputSize: number
  width: number
  height: number
  frames: number
  format: string
  duration: number
}

/**
 * 进度回调函数类型
 */
export type AnimProgressCallback = (progress: {
  percent: number
  stage: string
  frame?: number
}) => void

/**
 * 格式信息映射表
 */
const formatInfoMap: Record<string, AnimEncoderInfo> = {
  gif: {
    name: 'gif',
    format: 'gif',
    extension: 'gif',
    description: 'GIF 动图 - 广泛兼容，颜色有限（256色）',
    supportsTransparency: true
  },
  webp: {
    name: 'webp',
    format: 'webp',
    extension: 'webp',
    description: 'WebP 动图 - 高压缩率，支持更多颜色',
    supportsTransparency: true
  },
  apng: {
    name: 'apng',
    format: 'apng',
    extension: 'apng',
    description: 'APNG 动图 - PNG 动画，无损质量',
    supportsTransparency: true
  }
}

/**
 * 动图编码器类
 */
export class AnimEncoder {
  protected ffmpegPath: string
  protected ffprobePath: string

  constructor() {
    this.ffmpegPath = config.ffmpeg.path
    this.ffprobePath = config.ffmpeg.ffprobePath
  }

  /**
   * 获取支持的格式列表
   *
   * @returns 格式信息列表
   */
  getSupportedFormats(): AnimEncoderInfo[] {
    return Object.values(formatInfoMap)
  }

  /**
   * 获取指定格式的信息
   *
   * @param format - 格式名称
   * @returns 格式信息或 undefined
   */
  getFormatInfo(format: string): AnimEncoderInfo | undefined {
    return formatInfoMap[format.toLowerCase()]
  }

  /**
   * 检查格式是否支持
   *
   * @param format - 格式名称
   * @returns 是否支持
   */
  supportsFormat(format: string): boolean {
    return format.toLowerCase() in formatInfoMap
  }

  /**
   * 执行动图转码
   *
   * @param inputPath - 输入文件路径
   * @param outputPath - 输出文件路径
   * @param config - 转码配置
   * @param onProgress - 进度回调
   * @returns 转码结果
   */
  async transcode(
    inputPath: string,
    outputPath: string,
    transcodeConfig: AnimTranscodeConfig,
    onProgress?: AnimProgressCallback
  ): Promise<AnimTranscodeResult> {
    // 验证输入文件
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 获取视频信息
    const videoInfo = await this.getVideoInfo(inputPath)

    if (onProgress) {
      onProgress({ percent: 10, stage: '准备转码' })
    }

    // 根据输出格式选择转码方法
    const format = transcodeConfig.outputFormat.toLowerCase()

    return new Promise((resolve, reject) => {
      let command: ffmpeg.FfmpegCommand

      switch (format) {
        case 'gif':
          command = this.buildGifCommand(inputPath, outputPath, transcodeConfig, videoInfo)
          break
        case 'webp':
          command = this.buildWebPCommand(inputPath, outputPath, transcodeConfig, videoInfo)
          break
        case 'apng':
          command = this.buildApngCommand(inputPath, outputPath, transcodeConfig, videoInfo)
          break
        default:
          command = this.buildGifCommand(inputPath, outputPath, transcodeConfig, videoInfo)
      }

      // 设置进度回调
      if (onProgress) {
        command.on('progress', (progress) => {
          if (progress.frames) {
            const percent = Math.min((progress.frames / (videoInfo.frames || 1)) * 100, 100)
            onProgress({
              percent: Math.max(10, percent * 0.9),
              stage: '编码中',
              frame: progress.frames
            })
          }
        })
      }

      // 处理完成
      command.on('end', () => {
        const stats = fs.statSync(outputPath)
        const result: AnimTranscodeResult = {
          outputPath,
          outputSize: stats.size,
          width: transcodeConfig.width || videoInfo.width,
          height: videoInfo.height,
          frames: videoInfo.frames,
          format,
          duration: videoInfo.duration
        }

        logger.info('动图转码完成', {
          input: inputPath,
          output: outputPath,
          format,
          size: result.outputSize
        })

        if (onProgress) {
          onProgress({ percent: 100, stage: '完成' })
        }

        resolve(result)
      })

      // 处理错误
      command.on('error', (err: Error) => {
        logger.error('动图转码失败', {
          input: inputPath,
          error: err.message
        })
        reject(new Error(`动图转码失败: ${err.message}`))
      })

      // 执行转码
      command.run()
    })
  }

  /**
   * 构建 GIF 编码命令
   *
   * @param inputPath - 输入文件路径
   * @param outputPath - 输出文件路径
   * @param config - 转码配置
   * @param videoInfo - 视频信息
   * @returns FFmpeg 命令实例
   */
  protected buildGifCommand(
    inputPath: string,
    outputPath: string,
    transcodeConfig: AnimTranscodeConfig,
    videoInfo: VideoInfo
  ): ffmpeg.FfmpegCommand {
    const fps = transcodeConfig.fps || 10
    const width = transcodeConfig.width || 480
    const colors = transcodeConfig.colors || 256

    let command = ffmpeg(inputPath)
      .setFfmpegPath(this.ffmpegPath)
      .setFfprobePath(this.ffprobePath)
      .fps(fps)
      .size(`${width}x?`)

    // 构建滤镜链
    const filters: string[] = []

    // 使用 palette 滤镜提高 GIF 质量
    if (transcodeConfig.optimize !== false) {
      // 高质量 GIF 转码（两遍）
      const palettePath = path.join(path.dirname(outputPath), `palette_${Date.now()}.png`)

      // 这是简化的单命令方式
      filters.push(
        `fps=${fps}`,
        `scale=${width}:-1:flags=lanczos`,
        'split[s0][s1]',
        '[s0]palettegen=max_colors=' + colors + '[p]',
        '[s1][p]paletteuse=dither=' + (transcodeConfig.dither || 'bayer')
      )
    } else {
      filters.push(`fps=${fps}`, `scale=${width}:-1:flags=lanczos`)
    }

    command = command.videoFilter(filters.join(','))

    // 设置循环次数
    if (transcodeConfig.loop !== undefined) {
      command = command.outputOptions('-loop', String(transcodeConfig.loop))
    }

    return command.output(outputPath)
  }

  /**
   * 构建 WebP 动图编码命令
   *
   * @param inputPath - 输入文件路径
   * @param outputPath - 输出文件路径
   * @param config - 转码配置
   * @param videoInfo - 视频信息
   * @returns FFmpeg 命令实例
   */
  protected buildWebPCommand(
    inputPath: string,
    outputPath: string,
    transcodeConfig: AnimTranscodeConfig,
    videoInfo: VideoInfo
  ): ffmpeg.FfmpegCommand {
    const fps = transcodeConfig.fps || 10
    const width = transcodeConfig.width || 480
    const quality = transcodeConfig.quality || 75

    return ffmpeg(inputPath)
      .setFfmpegPath(this.ffmpegPath)
      .setFfprobePath(this.ffprobePath)
      .fps(fps)
      .size(`${width}x?`)
      .videoCodec('libwebp_anim')
      .outputOptions([
        '-lossless', '0',
        '-q:v', String(quality),
        '-loop', transcodeConfig.loop !== undefined ? String(transcodeConfig.loop) : '0'
      ])
      .output(outputPath)
  }

  /**
   * 构建 APNG 编码命令
   *
   * @param inputPath - 输入文件路径
   * @param outputPath - 输出文件路径
   * @param config - 转码配置
   * @param videoInfo - 视频信息
   * @returns FFmpeg 命令实例
   */
  protected buildApngCommand(
    inputPath: string,
    outputPath: string,
    transcodeConfig: AnimTranscodeConfig,
    videoInfo: VideoInfo
  ): ffmpeg.FfmpegCommand {
    const fps = transcodeConfig.fps || 10
    const width = transcodeConfig.width || 480

    return ffmpeg(inputPath)
      .setFfmpegPath(this.ffmpegPath)
      .setFfprobePath(this.ffprobePath)
      .fps(fps)
      .size(`${width}x?`)
      .videoCodec('apng')
      .outputOptions([
        '-plays', transcodeConfig.loop !== undefined ? String(transcodeConfig.loop) : '0'
      ])
      .output(outputPath)
  }

  /**
   * 获取视频信息
   *
   * @param filePath - 视频文件路径
   * @returns 视频元数据
   */
  protected async getVideoInfo(filePath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`无法读取视频信息: ${err.message}`))
          return
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video')

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          fps: this.parseFps(videoStream?.r_frame_rate),
          frames: videoStream?.nb_frames ? parseInt(videoStream.nb_frames, 10) : 0
        })
      })
    })
  }

  /**
   * 解析帧率字符串
   *
   * @param fpsStr - 帧率字符串
   * @returns 帧率数值
   */
  protected parseFps(fpsStr?: string): number {
    if (!fpsStr) return 0
    const parts = fpsStr.split('/')
    if (parts.length === 2) {
      return parseInt(parts[0], 10) / parseInt(parts[1], 10)
    }
    return parseFloat(fpsStr)
  }
}

/**
 * 视频元数据接口
 */
interface VideoInfo {
  duration: number
  width: number
  height: number
  fps: number
  frames: number
}

// 导出编码器实例
export default new AnimEncoder()

/**
 * 图片序列合成动图
 *
 * @param imagePaths - 图片路径数组
 * @param outputPath - 输出文件路径
 * @param transcodeConfig - 转码配置
 * @param onProgress - 进度回调
 * @returns 转码结果
 */
export async function transcodeFromImages(
  imagePaths: string[],
  outputPath: string,
  transcodeConfig: AnimTranscodeConfig,
  onProgress?: AnimProgressCallback
): Promise<AnimTranscodeResult> {
  // 验证输入
  if (!imagePaths || imagePaths.length === 0) {
    throw new Error('图片路径数组不能为空')
  }

  // 验证所有图片存在
  for (const imgPath of imagePaths) {
    if (!fs.existsSync(imgPath)) {
      throw new Error(`图片文件不存在: ${imgPath}`)
    }
  }

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  if (onProgress) {
    onProgress({ percent: 10, stage: '准备合成' })
  }

  const format = transcodeConfig.outputFormat.toLowerCase()
  const fps = transcodeConfig.fps || 10
  const width = transcodeConfig.width || 480

  // 创建临时文件列表
  const tempDir = path.join(path.dirname(outputPath), 'temp_frames_' + Date.now())
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    // 将图片重命名为连续编号格式（ffmpeg 需要）
    const ext = path.extname(imagePaths[0])
    for (let i = 0; i < imagePaths.length; i++) {
      const targetPath = path.join(tempDir, `frame_${String(i).padStart(4, '0')}${ext}`)
      fs.copyFileSync(imagePaths[i], targetPath)
    }

    // 使用 ffmpeg 合成
    const inputPattern = path.join(tempDir, `frame_%04d${ext}`)

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPattern)
        .setFfmpegPath(config.ffmpeg.path)
        .setFfprobePath(config.ffmpeg.ffprobePath)
        .inputOptions(['-framerate', String(fps)])
        .fps(fps)
        .size(`${width}x?`)

      // 根据格式设置编码器
      if (format === 'gif') {
        const colors = transcodeConfig.colors || 256
        const filters = [
          `scale=${width}:-1:flags=lanczos`,
          'split[s0][s1]',
          '[s0]palettegen=max_colors=' + colors + '[p]',
          '[s1][p]paletteuse=dither=' + (transcodeConfig.dither || 'bayer')
        ]
        command = command.videoFilter(filters.join(','))

        if (transcodeConfig.loop !== undefined) {
          command = command.outputOptions('-loop', String(transcodeConfig.loop))
        }
      } else if (format === 'webp') {
        const quality = transcodeConfig.quality || 75
        command = command
          .videoCodec('libwebp_anim')
          .outputOptions([
            '-lossless', '0',
            '-q:v', String(quality),
            '-loop', transcodeConfig.loop !== undefined ? String(transcodeConfig.loop) : '0'
          ])
      } else if (format === 'apng') {
        command = command
          .videoCodec('apng')
          .outputOptions([
            '-plays', transcodeConfig.loop !== undefined ? String(transcodeConfig.loop) : '0'
          ])
      }

      // 设置进度回调
      if (onProgress) {
        command.on('progress', (progress) => {
          const percent = Math.min(10 + progress.percent * 0.85, 95)
          onProgress({
            percent,
            stage: '合成中',
            frame: progress.frames
          })
        })
      }

      command
        .on('end', () => {
          const stats = fs.statSync(outputPath)
          const result: AnimTranscodeResult = {
            outputPath,
            outputSize: stats.size,
            width,
            height: 0, // 需要额外获取
            frames: imagePaths.length,
            format,
            duration: imagePaths.length / fps
          }

          logger.info('图片序列合成动图完成', {
            images: imagePaths.length,
            output: outputPath,
            format,
            size: result.outputSize
          })

          if (onProgress) {
            onProgress({ percent: 100, stage: '完成' })
          }

          resolve(result)
        })
        .on('error', (err: Error) => {
          logger.error('图片序列合成失败', { error: err.message })
          reject(new Error(`图片序列合成失败: ${err.message}`))
        })
        .save(outputPath)
    })
  } finally {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }
}