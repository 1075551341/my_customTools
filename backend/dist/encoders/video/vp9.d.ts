/**
 * VP9 编码器
 *
 * 使用 libvpx-vp9 进行视频编码
 *
 * 功能说明：
 * - Google 开发的开源编码格式
 * - 适用于 WebM 容器和 Web 播放
 * - 高压缩率，编码速度较慢
 *
 * @module encoders/video/vp9
 */
import ffmpeg from 'fluent-ffmpeg';
import { VideoEncoder, VideoInfo } from './base';
import type { VideoTranscodeConfig } from '../../types';
/**
 * VP9 编码器类
 */
export declare class VP9Encoder extends VideoEncoder {
    readonly name = "vp9";
    readonly codec = "libvpx-vp9";
    readonly extension = "webm";
    readonly description = "VP9 \u7F16\u7801\u5668 - \u5F00\u6E90\u514D\u8D39\uFF0C\u9002\u5408 Web \u64AD\u653E";
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
     * 设置音频编码
     *
     * VP9 推荐使用 Opus 音频编码
     *
     * @param command - FFmpeg 命令实例
     * @param config - 转码配置
     * @returns 更新后的命令实例
     */
    protected setupAudio(command: ffmpeg.FfmpegCommand, transcodeConfig: VideoTranscodeConfig): ffmpeg.FfmpegCommand;
}
declare const _default: VP9Encoder;
export default _default;
//# sourceMappingURL=vp9.d.ts.map