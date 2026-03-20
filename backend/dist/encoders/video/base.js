"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoEncoder = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../config"));
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * 视频编码器抽象基类
 *
 * 所有视频编码器必须继承此类并实现抽象方法
 */
class VideoEncoder {
    /**
     * FFmpeg 实例配置
     */
    ffmpegPath;
    ffprobePath;
    constructor() {
        this.ffmpegPath = config_1.default.ffmpeg.path;
        this.ffprobePath = config_1.default.ffmpeg.ffprobePath;
    }
    /**
     * 获取编码器信息
     *
     * @returns 编码器信息对象
     */
    getInfo() {
        return {
            name: this.name,
            codec: this.codec,
            extension: this.extension,
            description: this.description,
            supportedFormats: this.supportedFormats
        };
    }
    /**
     * 检查是否支持指定格式
     *
     * @param format - 输入格式
     * @returns 是否支持
     */
    supportsFormat(format) {
        return this.supportedFormats.includes(format.toLowerCase());
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
    async transcode(inputPath, outputPath, transcodeConfig, onProgress) {
        // 验证输入文件
        if (!fs_1.default.existsSync(inputPath)) {
            throw new Error(`输入文件不存在: ${inputPath}`);
        }
        // 确保输出目录存在
        const outputDir = path_1.default.dirname(outputPath);
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        // 获取视频信息
        const videoInfo = await this.getVideoInfo(inputPath);
        // 构建 FFmpeg 命令
        return new Promise((resolve, reject) => {
            const command = this.buildCommand(inputPath, outputPath, transcodeConfig, videoInfo);
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
                        });
                    }
                });
            }
            // 处理完成
            command.on('end', async () => {
                try {
                    const result = await this.getOutputInfo(outputPath, videoInfo.duration || 0);
                    logger_1.default.info('视频转码完成', {
                        input: inputPath,
                        output: outputPath,
                        size: result.outputSize
                    });
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
            // 处理错误
            command.on('error', (err) => {
                logger_1.default.error('视频转码失败', {
                    input: inputPath,
                    error: err.message
                });
                reject(new Error(`视频转码失败: ${err.message}`));
            });
            // 执行转码
            command.run();
        });
    }
    /**
     * 获取视频信息
     *
     * @param filePath - 视频文件路径
     * @returns 视频元数据
     */
    async getVideoInfo(filePath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(new Error(`无法读取视频信息: ${err.message}`));
                    return;
                }
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
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
                });
            });
        });
    }
    /**
     * 解析帧率字符串
     *
     * @param fpsStr - 帧率字符串（如 "30/1"）
     * @returns 帧率数值
     */
    parseFps(fpsStr) {
        if (!fpsStr)
            return 0;
        const parts = fpsStr.split('/');
        if (parts.length === 2) {
            return parseInt(parts[0], 10) / parseInt(parts[1], 10);
        }
        return parseFloat(fpsStr);
    }
    /**
     * 获取输出文件信息
     *
     * @param outputPath - 输出文件路径
     * @param duration - 视频时长
     * @returns 转码结果
     */
    async getOutputInfo(outputPath, duration) {
        const stats = fs_1.default.statSync(outputPath);
        const info = await this.getVideoInfo(outputPath);
        return {
            outputPath,
            outputSize: stats.size,
            duration: info.duration,
            bitrate: `${Math.round((stats.size * 8 / duration) / 1000)}kbps`,
            resolution: `${info.width}x${info.height}`
        };
    }
    /**
     * 解析分辨率字符串
     *
     * @param resolution - 分辨率字符串（如 "1920x1080"、"1080p"）
     * @returns 宽高对象
     */
    parseResolution(resolution) {
        if (!resolution)
            return null;
        // 处理 "1080p"、"720p" 等格式
        const presetMatch = resolution.match(/^(\d+)p$/);
        if (presetMatch) {
            const height = parseInt(presetMatch[1], 10);
            const presets = {
                2160: 3840,
                1440: 2560,
                1080: 1920,
                720: 1280,
                480: 854,
                360: 640,
                240: 426
            };
            return { width: presets[height] || Math.round(height * 16 / 9), height };
        }
        // 处理 "1920x1080" 格式
        const sizeMatch = resolution.match(/^(\d+)x(\d+)$/i);
        if (sizeMatch) {
            return {
                width: parseInt(sizeMatch[1], 10),
                height: parseInt(sizeMatch[2], 10)
            };
        }
        return null;
    }
    /**
     * 应用视频滤镜
     *
     * @param command - FFmpeg 命令实例
     * @param config - 转码配置
     * @param videoInfo - 视频信息
     */
    applyVideoFilters(command, transcodeConfig, videoInfo) {
        const filters = [];
        // 缩放滤镜
        if (transcodeConfig.resolution) {
            const size = this.parseResolution(transcodeConfig.resolution);
            if (size) {
                filters.push(`scale=${size.width}:${size.height}`);
            }
        }
        // 旋转滤镜
        if (transcodeConfig.rotate) {
            const rotateMap = {
                90: 'transpose=1',
                '-90': 'transpose=2',
                180: 'transpose=1,transpose=1'
            };
            const filter = rotateMap[transcodeConfig.rotate];
            if (filter) {
                filters.push(filter);
            }
        }
        // 应用滤镜链
        if (filters.length > 0) {
            command.videoFilter(filters.join(','));
        }
    }
    /**
     * 设置时间范围
     *
     * @param command - FFmpeg 命令实例
     * @param config - 转码配置
     */
    setTimeRange(command, transcodeConfig) {
        if (transcodeConfig.startTime !== undefined) {
            command.setStartTime(String(transcodeConfig.startTime));
        }
        if (transcodeConfig.endTime !== undefined) {
            command.setDuration(String(transcodeConfig.endTime));
        }
    }
}
exports.VideoEncoder = VideoEncoder;
//# sourceMappingURL=base.js.map