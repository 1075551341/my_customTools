/**
 * H.265 (HEVC) 编码器
 *
 * 使用 libx265 进行视频编码
 *
 * 功能说明：
 * - 相比 H.264 节省 30-50% 码率
 * - 支持软件编码和 NVIDIA 硬件加速
 * - 适用于存储和带宽受限场景
 *
 * @module encoders/video/h265
 */

import ffmpeg from 'fluent-ffmpeg'
import { VideoEncoder, VideoInfo } from './base'
import type { VideoTranscodeConfig } from '../../types'

/**
 * H.265 编码器类
 */
export class H265Encoder extends VideoEncoder {
  readonly name = 'h265'
  readonly codec = 'libx265'
  readonly extension = 'mp4'
  readonly description = 'H.265/HEVC 编码器 - 高压缩率，适合存储和带宽受限场景'
  readonly supportedFormats = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ts']

  /**
   * 构建 FFmpeg 命令
   *
   * @param inputPath - 输入文件路径
   * @param outputPath - 输出文件路径
   * @param config - 转码配置
   * @param videoInfo - 视频信息
   * @returns FFmpeg 命令实例
   */
  protected buildCommand(
    inputPath: string,
    outputPath: string,
    transcodeConfig: VideoTranscodeConfig,
    videoInfo: VideoInfo
  ): ffmpeg.FfmpegCommand {
    // 确定使用的编码器
    const encoder = this.getEncoder(transcodeConfig)

    let command = ffmpeg(inputPath)
      .setFfmpegPath(this.ffmpegPath)
      .setFfprobePath(this.ffprobePath)
      .output(outputPath)

    // 设置视频编码器
    command = command.videoCodec(encoder)

    // 设置质量控制
    if (transcodeConfig.crf !== undefined && !transcodeConfig.bitrate) {
      // CRF 模式（H.265 推荐值比 H.264 高 2-4）
      const crf = transcodeConfig.crf
      command = command.outputOptions([
        '-crf', String(crf),
        '-preset', 'medium'
      ])
    } else if (transcodeConfig.bitrate) {
      command = command.videoBitrate(transcodeConfig.bitrate)
    } else {
      // 默认 CRF 28（H.265 默认值比 H.264 高）
      command = command.outputOptions(['-crf', '28', '-preset', 'medium'])
    }

    // 设置帧率
    if (transcodeConfig.fps) {
      command = command.fps(transcodeConfig.fps)
    }

    // 设置分辨率和旋转
    this.applyVideoFilters(command, transcodeConfig, videoInfo)

    // 设置时间范围
    this.setTimeRange(command, transcodeConfig)

    // 设置音频编码
    command = this.setupAudio(command, transcodeConfig)

    // 快速启动
    command = command.outputOptions('-movflags', '+faststart')

    // H.265 特定参数
    if (encoder === 'libx265') {
      command = command.outputOptions([
        '-tag:v', 'hvc1',  // 兼容性标签
        '-x265-params', 'log-level=warning'
      ])
    }

    return command
  }

  /**
   * 获取编码器名称
   *
   * @param config - 转码配置
   * @returns 编码器名称
   */
  protected getEncoder(transcodeConfig: VideoTranscodeConfig): string {
    if (transcodeConfig.videoCodec === 'copy') {
      return 'copy'
    }

    // NVIDIA 硬件加速
    if (transcodeConfig.hwAccel === 'nvidia') {
      return 'hevc_nvenc'
    }

    // VAAPI 硬件加速
    if (transcodeConfig.hwAccel === 'vaapi') {
      return 'hevc_vaapi'
    }

    // VideoToolbox 硬件加速
    if (transcodeConfig.hwAccel === 'videotoolbox') {
      return 'hevc_videotoolbox'
    }

    return 'libx265'
  }

  /**
   * 设置音频编码
   *
   * @param command - FFmpeg 命令实例
   * @param config - 转码配置
   * @returns 更新后的命令实例
   */
  protected setupAudio(command: ffmpeg.FfmpegCommand, transcodeConfig: VideoTranscodeConfig): ffmpeg.FfmpegCommand {
    if (transcodeConfig.audioCodec === 'copy') {
      command = command.audioCodec('copy')
    } else if (transcodeConfig.audioCodec) {
      command = command.audioCodec(transcodeConfig.audioCodec)
      if (transcodeConfig.audioBitrate) {
        command = command.audioBitrate(transcodeConfig.audioBitrate)
      } else {
        command = command.audioBitrate('128k')
      }
    } else {
      command = command.audioCodec('aac').audioBitrate('128k')
    }

    return command
  }
}

// 导出编码器实例
export default new H265Encoder()