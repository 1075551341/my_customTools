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
import ffmpeg from 'fluent-ffmpeg';
import { VideoEncoder, VideoInfo } from './base';
import type { VideoTranscodeConfig } from '../../types';
/**
 * H.265 编码器类
 */
export declare class H265Encoder extends VideoEncoder {
    readonly name = "h265";
    readonly codec = "libx265";
    readonly extension = "mp4";
    readonly description = "H.265/HEVC \u7F16\u7801\u5668 - \u9AD8\u538B\u7F29\u7387\uFF0C\u9002\u5408\u5B58\u50A8\u548C\u5E26\u5BBD\u53D7\u9650\u573A\u666F";
    readonly supportedFormats: string[];
    /**
     * 构建 FFmpeg 命令
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param videoInfo - 视频信息
     * @returns FFmpeg 命令实例
     */
    protected buildCommand(inputPath: string, outputPath: string, transcodeConfig: VideoTranscodeConfig, videoInfo: VideoInfo): ffmpeg.FfmpegCommand;
    /**
     * 获取编码器名称
     *
     * @param config - 转码配置
     * @returns 编码器名称
     */
    protected getEncoder(transcodeConfig: VideoTranscodeConfig): string;
    /**
     * 设置音频编码
     *
     * @param command - FFmpeg 命令实例
     * @param config - 转码配置
     * @returns 更新后的命令实例
     */
    protected setupAudio(command: ffmpeg.FfmpegCommand, transcodeConfig: VideoTranscodeConfig): ffmpeg.FfmpegCommand;
}
declare const _default: H265Encoder;
export default _default;
//# sourceMappingURL=h265.d.ts.map