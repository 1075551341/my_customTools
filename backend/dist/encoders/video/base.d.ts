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
import ffmpeg from 'fluent-ffmpeg';
import type { VideoTranscodeConfig } from '../../types';
/**
 * 编码器信息接口
 */
export interface EncoderInfo {
    name: string;
    codec: string;
    extension: string;
    description: string;
    supportedFormats: string[];
}
/**
 * 转码结果接口
 */
export interface TranscodeResult {
    outputPath: string;
    outputSize: number;
    duration: number;
    bitrate: string;
    resolution: string;
}
/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: {
    percent: number;
    currentTime: number;
    targetTime: number;
    fps: number;
    speed: string;
}) => void;
/**
 * 视频编码器抽象基类
 *
 * 所有视频编码器必须继承此类并实现抽象方法
 */
export declare abstract class VideoEncoder {
    /**
     * 编码器名称
     */
    abstract readonly name: string;
    /**
     * FFmpeg 编码器名称
     */
    abstract readonly codec: string;
    /**
     * 默认输出扩展名
     */
    abstract readonly extension: string;
    /**
     * 编码器描述
     */
    abstract readonly description: string;
    /**
     * 支持的输入格式
     */
    abstract readonly supportedFormats: string[];
    /**
     * FFmpeg 实例配置
     */
    protected ffmpegPath: string;
    protected ffprobePath: string;
    constructor();
    /**
     * 获取编码器信息
     *
     * @returns 编码器信息对象
     */
    getInfo(): EncoderInfo;
    /**
     * 检查是否支持指定格式
     *
     * @param format - 输入格式
     * @returns 是否支持
     */
    supportsFormat(format: string): boolean;
    /**
     * 执行视频转码
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param onProgress - 进度回调
     * @returns 转码结果
     */
    transcode(inputPath: string, outputPath: string, transcodeConfig: VideoTranscodeConfig, onProgress?: ProgressCallback): Promise<TranscodeResult>;
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
    protected abstract buildCommand(inputPath: string, outputPath: string, config: VideoTranscodeConfig, videoInfo: VideoInfo): ffmpeg.FfmpegCommand;
    /**
     * 获取视频信息
     *
     * @param filePath - 视频文件路径
     * @returns 视频元数据
     */
    protected getVideoInfo(filePath: string): Promise<VideoInfo>;
    /**
     * 解析帧率字符串
     *
     * @param fpsStr - 帧率字符串（如 "30/1"）
     * @returns 帧率数值
     */
    protected parseFps(fpsStr?: string): number;
    /**
     * 获取输出文件信息
     *
     * @param outputPath - 输出文件路径
     * @param duration - 视频时长
     * @returns 转码结果
     */
    protected getOutputInfo(outputPath: string, duration: number): Promise<TranscodeResult>;
    /**
     * 解析分辨率字符串
     *
     * @param resolution - 分辨率字符串（如 "1920x1080"、"1080p"）
     * @returns 宽高对象
     */
    protected parseResolution(resolution?: string): {
        width: number;
        height: number;
    } | null;
    /**
     * 应用视频滤镜
     *
     * @param command - FFmpeg 命令实例
     * @param config - 转码配置
     * @param videoInfo - 视频信息
     */
    protected applyVideoFilters(command: ffmpeg.FfmpegCommand, transcodeConfig: VideoTranscodeConfig, videoInfo: VideoInfo): void;
    /**
     * 设置时间范围
     *
     * @param command - FFmpeg 命令实例
     * @param config - 转码配置
     */
    protected setTimeRange(command: ffmpeg.FfmpegCommand, transcodeConfig: VideoTranscodeConfig): void;
}
/**
 * 视频元数据接口
 */
export interface VideoInfo {
    duration: number;
    bitrate: number;
    videoCodec: string;
    width: number;
    height: number;
    fps: number;
    audioCodec: string;
    audioSampleRate: number;
    audioChannels: number;
}
//# sourceMappingURL=base.d.ts.map