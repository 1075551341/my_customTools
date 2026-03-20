/**
 * 视频编码器基类
 *
 * 定义视频编码器的标准接口和公共方法
 *
 * 功能说明：
 * - 提供编码器接口定义
 * - 封装 FFmpeg 公共操作
 * - 提供进度回调机制
 *
 * @module encoders/video/base
 */

import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import config from '../../config'
import logger from '../../utils/logger'
import type { VideoTranscodeConfig } from '../../types'

/**
 * 编码器信息接口
 */
export interface EncoderInfo {
  name: string
  codec: string
  extension: string
  description: string
  supportedFormats: string[]
}

/**
 * 转码结果接口
 */
export interface TranscodeResult {
  outputPath: string
  outputSize: number
  duration: number
  bitrate: string
  resolution: string
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: {
  percent: number
  currentTime: number
  targetTime: number
  fps: number
  speed: string
}) => void

/**
 * 视频编码器抽象基类
 *
 * 所有视频编码器必须继承此类并实现抽象方法
 */
export abstract class VideoEncoder {
  /**
   * 编码器名称
   */
  abstract readonly name: string

  /**
   * FFmpeg 编码器名称
   */
  abstract readonly codec: string

  /**
   * 默认输出扩展名
   */
  abstract readonly extension: string

  /**
   * 编码器描述
   */
  abstract readonly description: string

  /**
   * 支持的输入格式
   */
  abstract readonly supportedFormats: string[]

  /**
   * FFmpeg 实例配置
   */
  protected ffmpegPath: string
  protected ffprobePath: string

  constructor() {
    this.ffmpegPath = config.ffmpeg.path
    this.ffprobePath = config.ffmpeg.ffprobePath
  }

  /**
   * 获取编码器信息
   *
   * @returns 编码器信息对象
   */
  getInfo(): EncoderInfo {
    return {
      name: this.name,
      codec: this.codec,
      extension: this.extension,
      description: this.description,
      supportedFormats: this.supportedFormats
    }
  }

  /**
   * 检查是否支持指定格式
   *
   * @param format - 输入格式
   * @returns 是否支持
   */
  supportsFormat(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase())
  }

  /**
   * 执行视频转码
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
    transcodeConfig: VideoTranscodeConfig,
    onProgress?: ProgressCallback
  ): Promise<TranscodeResult> {
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

    // 构建 FFmpeg 命令
    return new Promise((resolve, reject) => {
      const command = this.buildCommand(inputPath, outputPath, transcodeConfig, videoInfo)

      // 设置进度回调
      if (onProgress) {
        command.on('progress', (progress) => {
          if (progress.percent !== undefined) {
            onProgress({
              percent: Math.min(progress.percent, 100),
              currentTime: progress.currentTime || 0,
              targetTime: videoInfo.duration || 0,
              fps: progress.currentFps || 0,
              speed: progress.currentSpeed || '0x'
            })
          }
        })
      }

      // 处理完成
      command.on('end', async () => {
        try {
          const result = await this.getOutputInfo(outputPath, videoInfo.duration || 0)
          logger.info('视频转码完成', {
            input: inputPath,
            output: outputPath,
            size: result.outputSize
          })
          resolve(result)
        } catch (err) {
          reject(err)
        }
      })

      // 处理错误
      command.on('error', (err: Error) => {
        logger.error('视频转码失败', {
          input: inputPath,
          error: err.message
        })
        reject(new Error(`视频转码失败: ${err.message}`))
      })

      // 执行转码
      command.run()
    })
  }

  /**
   * 构建 FFmpeg 命令
   *
   * 子类必须实现此方法以定义具体的编码参数
   *
   * @param inputPath - 输入文件路径
   * @param outputPath - 输出文件路径
   * @param config - 转码配置
   * @param videoInfo - 视频信息
   * @returns FFmpeg 命令实例
   */
  protected abstract buildCommand(
    inputPath: string,
    outputPath: string,
    config: VideoTranscodeConfig,
    videoInfo: VideoInfo
  ): ffmpeg.FfmpegCommand

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
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio')

        resolve({
          duration: metadata.format.duration || 0,
          bitrate: metadata.format.bit_rate || 0,
          videoCodec: videoStream?.codec_name || '',
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          fps: this.parseFps(videoStream?.r_frame_rate),
          audioCodec: audioStream?.codec_name || '',
          audioSampleRate: audioStream?.sample_rate || 0,
          audioChannels: audioStream?.channels || 0
        })
      })
    })
  }

  /**
   * 解析帧率字符串
   *
   * @param fpsStr - 帧率字符串（如 "30/1"）
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

  /**
   * 获取输出文件信息
   *
   * @param outputPath - 输出文件路径
   * @param duration - 视频时长
   * @returns 转码结果
   */
  protected async getOutputInfo(outputPath: string, duration: number): Promise<TranscodeResult> {
    const stats = fs.statSync(outputPath)
    const info = await this.getVideoInfo(outputPath)

    return {
      outputPath,
      outputSize: stats.size,
      duration: info.duration,
      bitrate: `${Math.round((stats.size * 8 / duration) / 1000)}kbps`,
      resolution: `${info.width}x${info.height}`
    }
  }

  /**
   * 解析分辨率字符串
   *
   * @param resolution - 分辨率字符串（如 "1920x1080"、"1080p"）
   * @returns 宽高对象
   */
  protected parseResolution(resolution?: string): { width: number; height: number } | null {
    if (!resolution) return null

    // 处理 "1080p"、"720p" 等格式
    const presetMatch = resolution.match(/^(\d+)p$/)
    if (presetMatch) {
      const height = parseInt(presetMatch[1], 10)
      const presets: Record<number, number> = {
        2160: 3840,
        1440: 2560,
        1080: 1920,
        720: 1280,
        480: 854,
        360: 640,
        240: 426
      }
      return { width: presets[height] || Math.round(height * 16 / 9), height }
    }

    // 处理 "1920x1080" 格式
    const sizeMatch = resolution.match(/^(\d+)x(\d+)$/i)
    if (sizeMatch) {
      return {
        width: parseInt(sizeMatch[1], 10),
        height: parseInt(sizeMatch[2], 10)
      }
    }

    return null
  }

  /**
   * 应用视频滤镜
   *
   * @param command - FFmpeg 命令实例
   * @param config - 转码配置
   * @param videoInfo - 视频信息
   */
  protected applyVideoFilters(
    command: ffmpeg.FfmpegCommand,
    transcodeConfig: VideoTranscodeConfig,
    videoInfo: VideoInfo
  ): void {
    const filters: string[] = []

    // 缩放滤镜
    if (transcodeConfig.resolution) {
      const size = this.parseResolution(transcodeConfig.resolution)
      if (size) {
        filters.push(`scale=${size.width}:${size.height}`)
      }
    }

    // 旋转滤镜
    if (transcodeConfig.rotate) {
      const rotateMap: Record<number, string> = {
        90: 'transpose=1',
        '-90': 'transpose=2',
        180: 'transpose=1,transpose=1'
      }
      const filter = rotateMap[transcodeConfig.rotate]
      if (filter) {
        filters.push(filter)
      }
    }

    // 应用滤镜链
    if (filters.length > 0) {
      command.videoFilter(filters.join(','))
    }
  }

  /**
   * 设置时间范围
   *
   * @param command - FFmpeg 命令实例
   * @param config - 转码配置
   */
  protected setTimeRange(command: ffmpeg.FfmpegCommand, transcodeConfig: VideoTranscodeConfig): void {
    if (transcodeConfig.startTime !== undefined) {
      command.setStartTime(String(transcodeConfig.startTime))
    }
    if (transcodeConfig.endTime !== undefined) {
      command.setDuration(String(transcodeConfig.endTime))
    }
  }
}

/**
 * 视频元数据接口
 */
export interface VideoInfo {
  duration: number
  bitrate: number
  videoCodec: string
  width: number
  height: number
  fps: number
  audioCodec: string
  audioSampleRate: number
  audioChannels: number
}