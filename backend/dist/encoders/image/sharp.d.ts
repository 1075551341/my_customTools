/**
 * 图片编码器
 *
 * 使用 Sharp 进行图片处理和转码
 *
 * 功能说明：
 * - 支持多种输出格式：JPEG、PNG、WebP、AVIF、BMP、TIFF、ICO
 * - 支持调整大小、旋转、翻转等操作
 * - 支持质量控制和色彩空间转换
 *
 * @module encoders/image/sharp
 */
import sharp from 'sharp';
import type { ImgTranscodeConfig } from '../../types';
/**
 * 图片编码器信息接口
 */
export interface ImageEncoderInfo {
    name: string;
    format: string;
    extension: string;
    description: string;
    supportsLossless: boolean;
    supportsAlpha: boolean;
}
/**
 * 图片转码结果
 */
export interface ImageTranscodeResult {
    outputPath: string;
    outputSize: number;
    width: number;
    height: number;
    format: string;
    channels: number;
}
/**
 * 进度回调函数类型
 */
export type ImageProgressCallback = (progress: {
    percent: number;
    stage: string;
}) => void;
/**
 * 图片编码器类
 */
export declare class ImageEncoder {
    /**
     * 获取支持的格式列表
     *
     * @returns 格式信息列表
     */
    getSupportedFormats(): ImageEncoderInfo[];
    /**
     * 获取指定格式的信息
     *
     * @param format - 格式名称
     * @returns 格式信息或 undefined
     */
    getFormatInfo(format: string): ImageEncoderInfo | undefined;
    /**
     * 检查格式是否支持
     *
     * @param format - 格式名称
     * @returns 是否支持
     */
    supportsFormat(format: string): boolean;
    /**
     * 执行图片转码
     *
     * @param inputPath - 输入文件路径
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param onProgress - 进度回调
     * @returns 转码结果
     */
    transcode(inputPath: string, outputPath: string, transcodeConfig: ImgTranscodeConfig, onProgress?: ImageProgressCallback): Promise<ImageTranscodeResult>;
    /**
     * 应用尺寸调整
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @param metadata - 图片元数据
     * @returns 更新后的 Sharp 实例
     */
    protected applyResize(image: sharp.Sharp, transcodeConfig: ImgTranscodeConfig, metadata: sharp.Metadata): sharp.Sharp;
    /**
     * 应用色彩空间
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @returns 更新后的 Sharp 实例
     */
    protected applyColorSpace(image: sharp.Sharp, transcodeConfig: ImgTranscodeConfig): sharp.Sharp;
    /**
     * 应用元数据处理
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @returns 更新后的 Sharp 实例
     */
    protected applyMetadata(image: sharp.Sharp, transcodeConfig: ImgTranscodeConfig): sharp.Sharp;
    /**
     * 应用输出格式和质量
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @returns 更新后的 Sharp 实例
     */
    protected applyFormat(image: sharp.Sharp, transcodeConfig: ImgTranscodeConfig): sharp.Sharp;
    /**
     * 检查格式是否支持透明通道
     *
     * @param format - 格式名称
     * @returns 是否支持透明通道
     */
    protected formatSupportsAlpha(format: string): boolean;
}
declare const _default: ImageEncoder;
export default _default;
//# sourceMappingURL=sharp.d.ts.map