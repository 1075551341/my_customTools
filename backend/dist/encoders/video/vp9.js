"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VP9Encoder = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const base_1 = require("./base");
/**
 * VP9 编码器类
 */
class VP9Encoder extends base_1.VideoEncoder {
    name = 'vp9';
    codec = 'libvpx-vp9';
    extension = 'webm';
    description = 'VP9 编码器 - 开源免费，适合 Web 播放';
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
        let command = (0, fluent_ffmpeg_1.default)(inputPath)
            .setFfmpegPath(this.ffmpegPath)
            .setFfprobePath(this.ffprobePath)
            .output(outputPath);
        // 设置视频编码器
        command = command.videoCodec('libvpx-vp9');
        // VP9 质量控制
        if (transcodeConfig.crf !== undefined && !transcodeConfig.bitrate) {
            // VP9 使用 -crf 和 -b:v 0 来启用 CRF 模式
            command = command.outputOptions([
                '-crf', String(transcodeConfig.crf),
                '-b:v', '0'
            ]);
        }
        else if (transcodeConfig.bitrate) {
            command = command.videoBitrate(transcodeConfig.bitrate);
        }
        else {
            // 默认 CRF 31
            command = command.outputOptions(['-crf', '31', '-b:v', '0']);
        }
        // 设置帧率
        if (transcodeConfig.fps) {
            command = command.fps(transcodeConfig.fps);
        }
        // 设置分辨率和旋转
        this.applyVideoFilters(command, transcodeConfig, videoInfo);
        // 设置时间范围
        this.setTimeRange(command, transcodeConfig);
        // 设置音频编码（VP9 通常配合 Opus 使用）
        command = this.setupAudio(command, transcodeConfig);
        // VP9 性能优化
        command = command.outputOptions([
            '-deadline', 'good', // good 平衡速度和质量
            '-cpu-used', '2' // 0-5，越小越慢但质量越好
        ]);
        return command;
    }
    /**
     * 设置音频编码
     *
     * VP9 推荐使用 Opus 音频编码
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
        }
        else {
            // 默认使用 Opus
            command = command.audioCodec('libopus').audioBitrate('128k');
        }
        return command;
    }
}
exports.VP9Encoder = VP9Encoder;
// 导出编码器实例
exports.default = new VP9Encoder();
//# sourceMappingURL=vp9.js.map