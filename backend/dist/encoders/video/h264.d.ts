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
import ffmpeg from 'fluent-ffmpeg';
import { VideoEncoder, VideoInfo } from './base';
import type { VideoTranscodeConfig } from '../../types';
/**
 * H.264 编码器类
 */
export declare class H264Encoder extends VideoEncoder {
    readonly name = "h264";
    readonly codec = "libx264";
    readonly extension = "mp4";
    readonly description = "H.264/AVC \u7F16\u7801\u5668 - \u9AD8\u517C\u5BB9\u6027\uFF0C\u9002\u7528\u4E8E\u5927\u591A\u6570\u573A\u666F";
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
     * 根据硬件加速配置选择合适的编码器
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
declare const _default: H264Encoder;
export default _default;
//# sourceMappingURL=h264.d.ts.map