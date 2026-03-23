/**
 * AV1 编码器
 *
 * 使用 libaom-av1 / librav1e / libsvtav1 进行视频编码
 *
 * 功能说明：
 * - 最新一代编码格式，相比 H.265 节省 30% 码率
 * - 开源免版税，适合未来兼容性
 * - 支持多种编码器后端
 *
 * @module encoders/video/av1
 */

import ffmpeg from "fluent-ffmpeg";
import { VideoEncoder, VideoInfo } from "./base";
import type { VideoTranscodeConfig } from "../../types";

/**
 * AV1 编码器类
 */
export class AV1Encoder extends VideoEncoder {
  readonly name = "av1";
  readonly codec = "libaom-av1";
  readonly extension = "mp4";
  readonly description =
    "AV1 编码器 - 下一代编码格式，开源免版税，超高压缩率";
  readonly supportedFormats = [
    "mp4",
    "mkv",
    "webm",
    "mov",
    "avi",
    "ts",
  ];

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
    videoInfo: VideoInfo,
  ): ffmpeg.FfmpegCommand {
    const encoder = this.getEncoder(transcodeConfig);

    let command = ffmpeg(inputPath)
      .setFfmpegPath(this.ffmpegPath)
      .setFfprobePath(this.ffprobePath)
      .output(outputPath);

    // 设置视频编码器
    command = command.videoCodec(encoder);

    // 根据编码器设置参数
    if (encoder === "libsvtav1") {
      // SVT-AV1 编码器（Intel，最快）
      command = this.setupSvtAv1(command, transcodeConfig);
    } else if (encoder === "librav1e") {
      // Rav1e 编码器（Rust，中等速度）
      command = this.setupRav1e(command, transcodeConfig);
    } else {
      // libaom-av1 默认编码器（参考实现，最慢但质量最高）
      command = this.setupAomAv1(command, transcodeConfig);
    }

    // 设置帧率
    if (transcodeConfig.fps) {
      command = command.fps(transcodeConfig.fps);
    }

    // 设置分辨率和旋转
    this.applyVideoFilters(command, transcodeConfig, videoInfo);

    // 设置时间范围
    this.setTimeRange(command, transcodeConfig);

    // 设置音频编码
    command = this.setupAudio(command, transcodeConfig);

    // 根据输出格式设置容器参数
    const outputExt = outputPath.split(".").pop()?.toLowerCase();
    if (outputExt === "mp4") {
      command = command.outputOptions("-movflags", "+faststart");
    }

    return command;
  }

  /**
   * 设置 libaom-av1 编码参数
   *
   * @param command - FFmpeg 命令实例
   * @param config - 转码配置
   * @returns 更新后的命令实例
   */
  protected setupAomAv1(
    command: ffmpeg.FfmpegCommand,
    transcodeConfig: VideoTranscodeConfig,
  ): ffmpeg.FfmpegCommand {
    // libaom-av1 使用 CRF 模式
    const crf = transcodeConfig.crf ?? 30; // AV1 推荐值比 H.265 高

    // CPU 使用率 (1-8, 越高越快但质量越低)
    const cpuUsed = 4;

    if (transcodeConfig.bitrate) {
      command = command.videoBitrate(transcodeConfig.bitrate);
    } else {
      command = command.outputOptions([
        "-crf",
        String(crf),
        "-b:v",
        "0", // 使用 CRF 模式
      ]);
    }

    // AV1 特定参数
    command = command.outputOptions([
      "-aom-params",
      `cpu-used=${cpuUsed}:lag-in-frames=35:threads=4`,
      "-strict",
      "experimental",
    ]);

    return command;
  }

  /**
   * 设置 librav1e 编码参数
   *
   * @param command - FFmpeg 命令实例
   * @param config - 转码配置
   * @returns 更新后的命令实例
   */
  protected setupRav1e(
    command: ffmpeg.FfmpegCommand,
    transcodeConfig: VideoTranscodeConfig,
  ): ffmpeg.FfmpegCommand {
    const crf = transcodeConfig.crf ?? 30;

    if (transcodeConfig.bitrate) {
      command = command.videoBitrate(transcodeConfig.bitrate);
    } else {
      command = command.outputOptions("-crf", String(crf));
    }

    // Rav1e 特定参数
    command = command.outputOptions([
      "-rav1e-params",
      "speed=6:threads=4",
      "-strict",
      "experimental",
    ]);

    return command;
  }

  /**
   * 设置 SVT-AV1 编码参数
   *
   * @param command - FFmpeg 命令实例
   * @param config - 转码配置
   * @returns 更新后的命令实例
   */
  protected setupSvtAv1(
    command: ffmpeg.FfmpegCommand,
    transcodeConfig: VideoTranscodeConfig,
  ): ffmpeg.FfmpegCommand {
    const crf = transcodeConfig.crf ?? 30;

    if (transcodeConfig.bitrate) {
      command = command.videoBitrate(transcodeConfig.bitrate);
    } else {
      command = command.outputOptions("-crf", String(crf));
    }

    // SVT-AV1 特定参数
    // preset: 0-12 (0 最慢质量最高，12 最快质量最低)
    command = command.outputOptions([
      "-svtav1-params",
      "preset=6:fast-decode=1",
      "-strict",
      "experimental",
    ]);

    return command;
  }

  /**
   * 获取编码器名称
   *
   * @param config - 转码配置
   * @returns 编码器名称
   */
  protected getEncoder(transcodeConfig: VideoTranscodeConfig): string {
    if (transcodeConfig.videoCodec === "copy") {
      return "copy";
    }

    // NVIDIA 硬件加速（需要 NVENC 支持 AV1）
    if (transcodeConfig.hwAccel === "nvidia") {
      // AV1 NVENC 编码器（RTX 40 系列支持）
      return "av1_nvenc";
    }

    // VAAPI 硬件加速
    if (transcodeConfig.hwAccel === "vaapi") {
      return "av1_vaapi";
    }

    // 优先尝试 SVT-AV1（性能最好）
    // 然后是 librav1e（中等性能）
    // 最后是 libaom-av1（最慢但兼容性最好）
    // 默认使用 libaom-av1 保证兼容性
    return "libaom-av1";
  }

  /**
   * 设置音频编码
   *
   * @param command - FFmpeg 命令实例
   * @param config - 转码配置
   * @returns 更新后的命令实例
   */
  protected setupAudio(
    command: ffmpeg.FfmpegCommand,
    transcodeConfig: VideoTranscodeConfig,
  ): ffmpeg.FfmpegCommand {
    if (transcodeConfig.audioCodec === "copy") {
      command = command.audioCodec("copy");
    } else if (transcodeConfig.audioCodec) {
      command = command.audioCodec(transcodeConfig.audioCodec);
      if (transcodeConfig.audioBitrate) {
        command = command.audioBitrate(transcodeConfig.audioBitrate);
      } else {
        command = command.audioBitrate("128k");
      }
    } else {
      // AV1 配合 Opus 音频编码效果最佳
      command = command.audioCodec("libopus").audioBitrate("128k");
    }

    return command;
  }
}

// 导出编码器实例
export default new AV1Encoder();