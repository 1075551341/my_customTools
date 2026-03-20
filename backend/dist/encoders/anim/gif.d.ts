/**
 * 动图编码器
 *
 * 使用 FFmpeg 处理 GIF 和 WebP 动图
 *
 * 功能说明：
 * - 支持视频转 GIF
 * - 支持视频转 WebP 动图
 * - 支持视频转 APNG
 * - 提供帧率、颜色、尺寸等控制参数
 *
 * @module encoders/anim/gif
 */
import ffmpeg from 'fluent-ffmpeg';
import type { AnimTranscodeConfig } from '../../types';
/**
 * 动图编码器信息
 */
export interface AnimEncoderInfo {
    name: string;
    format: string;
    extension: string;
    description: string;
    supportsTransparency: boolean;
}
/**
 * 动图转码结果
 */
export interface AnimTranscodeResult {
    outputPath: string;
    outputSize: number;
    width: number;
    height: number;
    frames: number;
    format: string;
    duration: number;
}
/**
 * 进度回调函数类型
 */
export type AnimProgressCallback = (progress: {
    percent: number;
    stage: string;
    frame?: number;
}) => void;
/**
 * 动图编码器类
 */
export declare class AnimEncoder {
    protected ffmpegPath: string;
    protected ffprobePath: string;
    constructor();
    /**
     * 获取支持的格式列表
     *
     * @returns 格式信息列表
     */
    getSupportedFormats(): AnimEncoderInfo[];
    /**
     * 获取指定格式的信息
     *
     * @param format - 格式名称
     * @returns 格式信息或 undefined
     */
    getFormatInfo(format: string): AnimEncoderInfo | undefined;
    /**
     * 检查格式是否支持
     *
     * @param format - 格式名称
     * @returns 是否支持
     */
    supportsFormat(format: string): boolean;
    /**
     * 执行动图转码
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param onProgress - 进度回调
     * @returns 转码结果
     */
    transcode(inputPath: string, outputPath: string, transcodeConfig: AnimTranscodeConfig, onProgress?: AnimProgressCallback): Promise<AnimTranscodeResult>;
    /**
     * 构建 GIF 编码命令
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param videoInfo - 视频信息
     * @returns FFmpeg 命令实例
     */
    protected buildGifCommand(inputPath: string, outputPath: string, transcodeConfig: AnimTranscodeConfig, videoInfo: VideoInfo): ffmpeg.FfmpegCommand;
    /**
     * 构建 WebP 动图编码命令
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param videoInfo - 视频信息
     * @returns FFmpeg 命令实例
     */
    protected buildWebPCommand(inputPath: string, outputPath: string, transcodeConfig: AnimTranscodeConfig, videoInfo: VideoInfo): ffmpeg.FfmpegCommand;
    /**
     * 构建 APNG 编码命令
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param videoInfo - 视频信息
     * @returns FFmpeg 命令实例
     */
    protected buildApngCommand(inputPath: string, outputPath: string, transcodeConfig: AnimTranscodeConfig, videoInfo: VideoInfo): ffmpeg.FfmpegCommand;
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
     * @param fpsStr - 帧率字符串
     * @returns 帧率数值
     */
    protected parseFps(fpsStr?: string): number;
}
/**
 * 视频元数据接口
 */
interface VideoInfo {
    duration: number;
    width: number;
    height: number;
    fps: number;
    frames: number;
}
declare const _default: AnimEncoder;
export default _default;
/**
 * 图片序列合成动图
 *
 * @param imagePaths - 图片路径数组
 * @param outputPath - 输出文件路径
 * @param transcodeConfig - 转码配置
 * @param onProgress - 进度回调
 * @returns 转码结果
 */
export declare function transcodeFromImages(imagePaths: string[], outputPath: string, transcodeConfig: AnimTranscodeConfig, onProgress?: AnimProgressCallback): Promise<AnimTranscodeResult>;
//# sourceMappingURL=gif.d.ts.map