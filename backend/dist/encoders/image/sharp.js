"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageEncoder = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * 格式信息映射表
 */
const formatInfoMap = {
    jpg: {
        name: 'jpeg',
        format: 'jpeg',
        extension: 'jpg',
        description: 'JPEG 格式 - 有损压缩，适合照片',
        supportsLossless: false,
        supportsAlpha: false
    },
    jpeg: {
        name: 'jpeg',
        format: 'jpeg',
        extension: 'jpg',
        description: 'JPEG 格式 - 有损压缩，适合照片',
        supportsLossless: false,
        supportsAlpha: false
    },
    png: {
        name: 'png',
        format: 'png',
        extension: 'png',
        description: 'PNG 格式 - 无损压缩，支持透明',
        supportsLossless: true,
        supportsAlpha: true
    },
    webp: {
        name: 'webp',
        format: 'webp',
        extension: 'webp',
        description: 'WebP 格式 - 高压缩率，支持有损/无损和透明',
        supportsLossless: true,
        supportsAlpha: true
    },
    avif: {
        name: 'avif',
        format: 'avif',
        extension: 'avif',
        description: 'AVIF 格式 - 最新一代编码，极高压缩率',
        supportsLossless: true,
        supportsAlpha: true
    },
    bmp: {
        name: 'bmp',
        format: 'bmp',
        extension: 'bmp',
        description: 'BMP 格式 - 无压缩位图',
        supportsLossless: true,
        supportsAlpha: false
    },
    tiff: {
        name: 'tiff',
        format: 'tiff',
        extension: 'tiff',
        description: 'TIFF 格式 - 专业图像格式',
        supportsLossless: true,
        supportsAlpha: true
    },
    ico: {
        name: 'ico',
        format: 'ico',
        extension: 'ico',
        description: 'ICO 格式 - 图标格式',
        supportsLossless: true,
        supportsAlpha: true
    }
};
/**
 * 图片编码器类
 */
class ImageEncoder {
    /**
     * 获取支持的格式列表
     *
     * @returns 格式信息列表
     */
    getSupportedFormats() {
        return Object.values(formatInfoMap);
    }
    /**
     * 获取指定格式的信息
     *
     * @param format - 格式名称
     * @returns 格式信息或 undefined
     */
    getFormatInfo(format) {
        return formatInfoMap[format.toLowerCase()];
    }
    /**
     * 检查格式是否支持
     *
     * @param format - 格式名称
     * @returns 是否支持
     */
    supportsFormat(format) {
        return format.toLowerCase() in formatInfoMap;
    }
    /**
     * 执行图片转码
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
        if (onProgress) {
            onProgress({ percent: 10, stage: '读取图片' });
        }
        // 创建 Sharp 实例
        let image = (0, sharp_1.default)(inputPath);
        // 获取图片元数据
        const metadata = await image.metadata();
        // 应用旋转
        if (transcodeConfig.rotate && transcodeConfig.rotate !== 'auto') {
            image = image.rotate(transcodeConfig.rotate);
        }
        // 应用翻转
        if (transcodeConfig.flipH) {
            image = image.flop();
        }
        if (transcodeConfig.flipV) {
            image = image.flip();
        }
        if (onProgress) {
            onProgress({ percent: 30, stage: '处理图片' });
        }
        // 应用尺寸调整
        image = this.applyResize(image, transcodeConfig, metadata);
        // 应用色彩空间
        image = this.applyColorSpace(image, transcodeConfig);
        // 应用元数据处理
        image = this.applyMetadata(image, transcodeConfig);
        if (onProgress) {
            onProgress({ percent: 60, stage: '编码输出' });
        }
        // 应用输出格式和质量
        image = this.applyFormat(image, transcodeConfig);
        // 设置背景色（处理透明通道时）
        if (transcodeConfig.background && !this.formatSupportsAlpha(transcodeConfig.outputFormat)) {
            image = image.flatten({
                background: transcodeConfig.background
            });
        }
        // 执行转码
        await image.toFile(outputPath);
        if (onProgress) {
            onProgress({ percent: 90, stage: '完成' });
        }
        // 获取输出文件信息
        const outputMetadata = await (0, sharp_1.default)(outputPath).metadata();
        const outputStats = fs_1.default.statSync(outputPath);
        const result = {
            outputPath,
            outputSize: outputStats.size,
            width: outputMetadata.width || 0,
            height: outputMetadata.height || 0,
            format: outputMetadata.format || transcodeConfig.outputFormat,
            channels: outputMetadata.channels || 3
        };
        logger_1.default.info('图片转码完成', {
            input: inputPath,
            output: outputPath,
            inputSize: metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : 'unknown',
            outputSize: `${result.width}x${result.height}`,
            format: result.format
        });
        if (onProgress) {
            onProgress({ percent: 100, stage: '完成' });
        }
        return result;
    }
    /**
     * 应用尺寸调整
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @param metadata - 图片元数据
     * @returns 更新后的 Sharp 实例
     */
    applyResize(image, transcodeConfig, metadata) {
        const mode = transcodeConfig.resizeMode || 'none';
        if (mode === 'none' || (!transcodeConfig.width && !transcodeConfig.height)) {
            return image;
        }
        const options = {
            fit: 'inside',
            withoutEnlargement: true
        };
        switch (mode) {
            case 'width':
                // 固定宽度，高度自适应
                if (transcodeConfig.width) {
                    image = image.resize(transcodeConfig.width, undefined, options);
                }
                break;
            case 'height':
                // 固定高度，宽度自适应
                if (transcodeConfig.height) {
                    image = image.resize(undefined, transcodeConfig.height, options);
                }
                break;
            case 'scale':
                // 按比例缩放
                if (transcodeConfig.width && transcodeConfig.keepAspect !== false) {
                    const scale = transcodeConfig.width / 100;
                    const newWidth = Math.round((metadata.width || 1) * scale);
                    image = image.resize(newWidth, undefined, options);
                }
                break;
            case 'fixed':
                // 固定尺寸（可能变形）
                if (transcodeConfig.width && transcodeConfig.height) {
                    options.fit = 'fill';
                    image = image.resize(transcodeConfig.width, transcodeConfig.height, options);
                }
                break;
            case 'crop':
                // 裁剪到指定尺寸
                if (transcodeConfig.width && transcodeConfig.height) {
                    options.fit = 'cover';
                    options.position = 'center';
                    image = image.resize(transcodeConfig.width, transcodeConfig.height, options);
                }
                break;
            default:
                // 默认：同时指定宽高时保持比例
                if (transcodeConfig.width || transcodeConfig.height) {
                    image = image.resize(transcodeConfig.width, transcodeConfig.height, options);
                }
        }
        return image;
    }
    /**
     * 应用色彩空间
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @returns 更新后的 Sharp 实例
     */
    applyColorSpace(image, transcodeConfig) {
        switch (transcodeConfig.colorSpace) {
            case 'srgb':
                image = image.toColorspace('srgb');
                break;
            case 'rgb':
                image = image.toColorspace('rgb');
                break;
            case 'cmyk':
                image = image.toColorspace('cmyk');
                break;
            case 'grayscale':
                image = image.grayscale();
                break;
            case 'original':
            default:
                // 保持原始色彩空间
                break;
        }
        return image;
    }
    /**
     * 应用元数据处理
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @returns 更新后的 Sharp 实例
     */
    applyMetadata(image, transcodeConfig) {
        if (transcodeConfig.stripMeta) {
            image = image.withExif({});
        }
        if (transcodeConfig.stripICC) {
            image = image.withIccProfile('');
        }
        return image;
    }
    /**
     * 应用输出格式和质量
     *
     * @param image - Sharp 实例
     * @param config - 转码配置
     * @returns 更新后的 Sharp 实例
     */
    applyFormat(image, transcodeConfig) {
        const format = transcodeConfig.outputFormat.toLowerCase();
        const quality = transcodeConfig.quality || 80;
        const lossless = transcodeConfig.lossless || false;
        switch (format) {
            case 'jpg':
            case 'jpeg':
                image = image.jpeg({
                    quality,
                    mozjpeg: true
                });
                break;
            case 'png':
                image = image.png({
                    compressionLevel: 6,
                    adaptiveFiltering: true
                });
                break;
            case 'webp':
                image = image.webp({
                    quality: lossless ? 100 : quality,
                    lossless
                });
                break;
            case 'avif':
                image = image.avif({
                    quality: lossless ? 100 : quality,
                    lossless
                });
                break;
            case 'bmp':
                // Sharp 不直接支持 BMP，使用 PNG 替代
                image = image.png();
                break;
            case 'tiff':
                image = image.tiff({
                    quality,
                    compression: 'lzw'
                });
                break;
            case 'ico':
                // Sharp 不直接支持 ICO，使用 PNG 替代
                image = image.png();
                break;
            default:
                // 默认使用原格式或 JPEG
                image = image.jpeg({ quality, mozjpeg: true });
        }
        return image;
    }
    /**
     * 检查格式是否支持透明通道
     *
     * @param format - 格式名称
     * @returns 是否支持透明通道
     */
    formatSupportsAlpha(format) {
        const info = formatInfoMap[format.toLowerCase()];
        return info?.supportsAlpha || false;
    }
}
exports.ImageEncoder = ImageEncoder;
// 导出编码器实例
exports.default = new ImageEncoder();
//# sourceMappingURL=sharp.js.map