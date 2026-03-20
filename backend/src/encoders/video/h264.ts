/**
 * H.264 (AVC) 编码器
 *
 * 使用 libx264 进行视频编码
 *
 * 功能说明：
 * - 支持软件编码和 NVIDIA 硬件加速
 * - 支持 CRF 和码率两种质量控制模式
 * - 高兼容性，适用于大多数场景
 *
 * @module encoders/video/h264
 */

import ffmpeg from 'fluent-ffmpeg'
import { VideoEncoder, VideoInfo } from './base'
import type { VideoTranscodeConfig } from '../../types'

/**
 * H.264 编码器类
 */
export class H264Encoder extends VideoEncoder {
  readonly name = 'h264'
  readonly codec = 'libx264'
  readonly extension = 'mp4'
  readonly description = 'H.264/AVC 编码器 - 高兼容性，适用于大多数场景'
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

    // 设置质量控制（CRF 或固定码率）
    if (transcodeConfig.crf !== undefined && !transcodeConfig.bitrate) {
      // CRF 模式（推荐）
      command = command.outputOptions([
        '-crf', String(transcodeConfig.crf),
        '-preset', 'medium'
      ])
    } else if (transcodeConfig.bitrate) {
      // 固定码率模式
      command = command.videoBitrate(transcodeConfig.bitrate)
    } else {
      // 默认 CRF 23
      command = command.outputOptions(['-crf', '23', '-preset', 'medium'])
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

    // 快速启动（适用于流媒体）
    command = command.outputOptions('-movflags', '+faststart')

    return command
  }

  /**
   * 获取编码器名称
   *
   * 根据硬件加速配置选择合适的编码器
   *
   * @param config - 转码配置
   * @returns 编码器名称
   */
  protected getEncoder(transcodeConfig: VideoTranscodeConfig): string {
    // 如果指定 copy，直接复制视频流
    if (transcodeConfig.videoCodec === 'copy') {
      return 'copy'
    }

    // NVIDIA 硬件加速
    if (transcodeConfig.hwAccel === 'nvidia') {
      return 'h264_nvenc'
    }

    // VAAPI 硬件加速（Linux）
    if (transcodeConfig.hwAccel === 'vaapi') {
      return 'h264_vaapi'
    }

    // VideoToolbox 硬件加速（macOS）
    if (transcodeConfig.hwAccel === 'videotoolbox') {
      return 'h264_videotoolbox'
    }

    // 默认使用 libx264
    return 'libx264'
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
        // 默认 128kbps
        command = command.audioBitrate('128k')
      }
    } else {
      // 默认使用 AAC
      command = command.audioCodec('aac').audioBitrate('128k')
    }

    return command
  }
}

// 导出编码器实例
export default new H264Encoder()