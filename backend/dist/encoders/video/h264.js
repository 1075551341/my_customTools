"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.H264Encoder = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const base_1 = require("./base");
/**
 * H.264 编码器类
 */
class H264Encoder extends base_1.VideoEncoder {
    name = 'h264';
    codec = 'libx264';
    extension = 'mp4';
    description = 'H.264/AVC 编码器 - 高兼容性，适用于大多数场景';
    supportedFormats = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ts'];
    /**
     * 构建 FFmpeg 命令
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param videoInfo - 视频信息
     * @returns FFmpeg 命令实例
     */
    buildCommand(inputPath, outputPath, transcodeConfig, videoInfo) {
        // 确定使用的编码器
        const encoder = this.getEncoder(transcodeConfig);
        let command = (0, fluent_ffmpeg_1.default)(inputPath)
            .setFfmpegPath(this.ffmpegPath)
            .setFfprobePath(this.ffprobePath)
            .output(outputPath);
        // 设置视频编码器
        command = command.videoCodec(encoder);
        // 设置质量控制（CRF 或固定码率）
        if (transcodeConfig.crf !== undefined && !transcodeConfig.bitrate) {
            // CRF 模式（推荐）
            command = command.outputOptions([
                '-crf', String(transcodeConfig.crf),
                '-preset', 'medium'
            ]);
        }
        else if (transcodeConfig.bitrate) {
            // 固定码率模式
            command = command.videoBitrate(transcodeConfig.bitrate);
        }
        else {
            // 默认 CRF 23
            command = command.outputOptions(['-crf', '23', '-preset', 'medium']);
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
        // 快速启动（适用于流媒体）
        command = command.outputOptions('-movflags', '+faststart');
        return command;
    }
    /**
     * 获取编码器名称
     *
     * 根据硬件加速配置选择合适的编码器
     *
     * @param config - 转码配置
     * @returns 编码器名称
     */
    getEncoder(transcodeConfig) {
        // 如果指定 copy，直接复制视频流
        if (transcodeConfig.videoCodec === 'copy') {
            return 'copy';
        }
        // NVIDIA 硬件加速
        if (transcodeConfig.hwAccel === 'nvidia') {
            return 'h264_nvenc';
        }
        // VAAPI 硬件加速（Linux）
        if (transcodeConfig.hwAccel === 'vaapi') {
            return 'h264_vaapi';
        }
        // VideoToolbox 硬件加速（macOS）
        if (transcodeConfig.hwAccel === 'videotoolbox') {
            return 'h264_videotoolbox';
        }
        // 默认使用 libx264
        return 'libx264';
    }
    /**
     * 设置音频编码
     *
     * @param command - FFmpeg 命令实例
     * @param config - 转码配置
     * @returns 更新后的命令实例
     */
    setupAudio(command, transcodeConfig) {
        if (transcodeConfig.audioCodec === 'copy') {
            command = command.audioCodec('copy');
        }
        else if (transcodeConfig.audioCodec) {
            command = command.audioCodec(transcodeConfig.audioCodec);
            if (transcodeConfig.audioBitrate) {
                command = command.audioBitrate(transcodeConfig.audioBitrate);
            }
            else {
                // 默认 128kbps
                command = command.audioBitrate('128k');
            }
        }
        else {
            // 默认使用 AAC
            command = command.audioCodec('aac').audioBitrate('128k');
        }
        return command;
    }
}
exports.H264Encoder = H264Encoder;
// 导出编码器实例
exports.default = new H264Encoder();
//# sourceMappingURL=h264.js.map