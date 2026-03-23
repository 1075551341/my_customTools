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

import sharp from "sharp";
import path from "path";
import fs from "fs";
import { encode as encodeBmp } from "bmp-ts";
import logger from "../../utils/logger";
import type { ImgTranscodeConfig } from "../../types";

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
 * 格式信息映射表
 */
const formatInfoMap: Record<string, ImageEncoderInfo> = {
  jpg: {
    name: "jpeg",
    format: "jpeg",
    extension: "jpg",
    description: "JPEG 格式 - 有损压缩，适合照片",
    supportsLossless: false,
    supportsAlpha: false,
  },
  jpeg: {
    name: "jpeg",
    format: "jpeg",
    extension: "jpg",
    description: "JPEG 格式 - 有损压缩，适合照片",
    supportsLossless: false,
    supportsAlpha: false,
  },
  png: {
    name: "png",
    format: "png",
    extension: "png",
    description: "PNG 格式 - 无损压缩，支持透明",
    supportsLossless: true,
    supportsAlpha: true,
  },
  webp: {
    name: "webp",
    format: "webp",
    extension: "webp",
    description: "WebP 格式 - 高压缩率，支持有损/无损和透明",
    supportsLossless: true,
    supportsAlpha: true,
  },
  avif: {
    name: "avif",
    format: "avif",
    extension: "avif",
    description: "AVIF 格式 - 最新一代编码，极高压缩率",
    supportsLossless: true,
    supportsAlpha: true,
  },
  bmp: {
    name: "bmp",
    format: "bmp",
    extension: "bmp",
    description: "BMP 格式 - 无压缩位图",
    supportsLossless: true,
    supportsAlpha: false,
  },
  tiff: {
    name: "tiff",
    format: "tiff",
    extension: "tiff",
    description: "TIFF 格式 - 专业图像格式",
    supportsLossless: true,
    supportsAlpha: true,
  },
  ico: {
    name: "ico",
    format: "ico",
    extension: "ico",
    description: "ICO 格式 - 图标格式",
    supportsLossless: true,
    supportsAlpha: true,
  },
};

/**
 * 图片编码器类
 */
export class ImageEncoder {
  /**
   * 获取支持的格式列表
   *
   * @returns 格式信息列表
   */
  getSupportedFormats(): ImageEncoderInfo[] {
    return Object.values(formatInfoMap);
  }

  /**
   * 获取指定格式的信息
   *
   * @param format - 格式名称
   * @returns 格式信息或 undefined
   */
  getFormatInfo(format: string): ImageEncoderInfo | undefined {
    return formatInfoMap[format.toLowerCase()];
  }

  /**
   * 检查格式是否支持
   *
   * @param format - 格式名称
   * @returns 是否支持
   */
  supportsFormat(format: string): boolean {
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
  async transcode(
    inputPath: string,
    outputPath: string,
    transcodeConfig: ImgTranscodeConfig,
    onProgress?: ImageProgressCallback,
  ): Promise<ImageTranscodeResult> {
    // 验证输入文件
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`);
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (onProgress) {
      onProgress({ percent: 10, stage: "读取图片" });
    }

    // 创建 Sharp 实例
    let image = sharp(inputPath);

    // 获取图片元数据
    const metadata = await image.metadata();

    // 应用旋转
    if (transcodeConfig.rotate && transcodeConfig.rotate !== "auto") {
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
      onProgress({ percent: 30, stage: "处理图片" });
    }

    // 应用尺寸调整
    image = this.applyResize(image, transcodeConfig, metadata);

    // 应用色彩空间
    image = this.applyColorSpace(image, transcodeConfig);

    // 应用元数据处理
    image = this.applyMetadata(image, transcodeConfig);

    if (onProgress) {
      onProgress({ percent: 60, stage: "编码输出" });
    }

    const format = transcodeConfig.outputFormat.toLowerCase();

    // 特殊处理 BMP 格式
    if (format === "bmp") {
      return await this.transcodeToBmp(image, outputPath, metadata, onProgress);
    }

    // 特殊处理 ICO 格式
    if (format === "ico") {
      return await this.transcodeToIco(image, outputPath, metadata, transcodeConfig, onProgress);
    }

    // 应用输出格式和质量
    image = this.applyFormat(image, transcodeConfig);

    // 设置背景色（处理透明通道时）
    if (
      transcodeConfig.background &&
      !this.formatSupportsAlpha(transcodeConfig.outputFormat)
    ) {
      image = image.flatten({
        background: transcodeConfig.background,
      });
    }

    // 执行转码
    await image.toFile(outputPath);

    if (onProgress) {
      onProgress({ percent: 90, stage: "完成" });
    }

    // 获取输出文件信息
    const outputMetadata = await sharp(outputPath).metadata();
    const outputStats = fs.statSync(outputPath);

    const result: ImageTranscodeResult = {
      outputPath,
      outputSize: outputStats.size,
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      format: outputMetadata.format || transcodeConfig.outputFormat,
      channels: outputMetadata.channels || 3,
    };

    logger.info("图片转码完成", {
      input: inputPath,
      output: outputPath,
      inputSize:
        metadata.width && metadata.height
          ? `${metadata.width}x${metadata.height}`
          : "unknown",
      outputSize: `${result.width}x${result.height}`,
      format: result.format,
    });

    if (onProgress) {
      onProgress({ percent: 100, stage: "完成" });
    }

    return result;
  }

  /**
   * 转码为 BMP 格式
   *
   * @param image - Sharp 实例
   * @param outputPath - 输出路径
   * @param metadata - 原始元数据
   * @param onProgress - 进度回调
   * @returns 转码结果
   */
  protected async transcodeToBmp(
    image: sharp.Sharp,
    outputPath: string,
    metadata: sharp.Metadata,
    onProgress?: ImageProgressCallback,
  ): Promise<ImageTranscodeResult> {
    // BMP 不支持透明，需要合并背景
    image = image.flatten({ background: { r: 255, g: 255, b: 255 } });

    // 获取原始像素数据 (RGB)
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    onProgress?.({ percent: 70, stage: "编码 BMP" });

    // 使用 bmp-ts 编码
    const bmpEncoder = encodeBmp({
      width: info.width,
      height: info.height,
      data: data,
    });

    // 写入文件 (bmp-ts 返回的对象有 data 属性包含 buffer)
    fs.writeFileSync(outputPath, Buffer.from(bmpEncoder.data));

    onProgress?.({ percent: 90, stage: "完成" });

    const outputStats = fs.statSync(outputPath);

    const result: ImageTranscodeResult = {
      outputPath,
      outputSize: outputStats.size,
      width: info.width,
      height: info.height,
      format: "bmp",
      channels: info.channels,
    };

    logger.info("BMP 转码完成", {
      output: outputPath,
      size: `${result.width}x${result.height}`,
      fileSize: outputStats.size,
    });

    onProgress?.({ percent: 100, stage: "完成" });

    return result;
  }

  /**
   * 转码为 ICO 格式
   *
   * ICO 格式结构：
   * - ICONDIR: 6 字节头部
   * - ICONDIRENTRY: 每个图标 16 字节目录项
   * - 图标数据: PNG 或 BMP 格式
   *
   * @param image - Sharp 实例
   * @param outputPath - 输出路径
   * @param metadata - 原始元数据
   * @param config - 转码配置
   * @param onProgress - 进度回调
   * @returns 转码结果
   */
  protected async transcodeToIco(
    image: sharp.Sharp,
    outputPath: string,
    metadata: sharp.Metadata,
    transcodeConfig: ImgTranscodeConfig,
    onProgress?: ImageProgressCallback,
  ): Promise<ImageTranscodeResult> {
    // ICO 支持多个尺寸，默认生成常用尺寸
    const sizes = [16, 32, 48, 64, 128, 256];

    // 如果指定了尺寸，使用指定尺寸
    if (transcodeConfig.width && transcodeConfig.width <= 256) {
      sizes.length = 0;
      sizes.push(transcodeConfig.width);
    }

    const quality = transcodeConfig.quality || 80;
    const iconBuffers: Buffer[] = [];
    const iconEntries: Array<{
      width: number;
      height: number;
      size: number;
      offset: number;
    }> = [];

    let currentOffset = 6 + sizes.length * 16; // ICONDIR + ICONDIRENTRY

    onProgress?.({ percent: 65, stage: "生成图标" });

    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];

      // 调整尺寸并转换为 PNG
      const pngBuffer = await image
        .clone()
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ quality, compressionLevel: 6 })
        .toBuffer();

      iconBuffers.push(pngBuffer);
      iconEntries.push({
        width: size === 256 ? 0 : size, // 256 表示为 0
        height: size === 256 ? 0 : size,
        size: pngBuffer.length,
        offset: currentOffset,
      });

      currentOffset += pngBuffer.length;

      onProgress?.({ percent: 65 + Math.round((i / sizes.length) * 20), stage: `生成 ${size}x${size}` });
    }

    onProgress?.({ percent: 85, stage: "组装 ICO" });

    // 构建 ICO 文件
    const icoBuffer = Buffer.alloc(currentOffset);
    let pos = 0;

    // ICONDIR (6 bytes)
    icoBuffer.writeUInt16LE(0, pos); pos += 2; // 保留，必须为 0
    icoBuffer.writeUInt16LE(1, pos); pos += 2; // 类型：1=ICO
    icoBuffer.writeUInt16LE(sizes.length, pos); pos += 2; // 图标数量

    // ICONDIRENTRY (16 bytes each)
    for (const entry of iconEntries) {
      icoBuffer.writeUInt8(entry.width, pos); pos += 1;    // 宽度
      icoBuffer.writeUInt8(entry.height, pos); pos += 1;   // 高度
      icoBuffer.writeUInt8(0, pos); pos += 1;              // 调色板颜色数
      icoBuffer.writeUInt8(0, pos); pos += 1;              // 保留
      icoBuffer.writeUInt16LE(1, pos); pos += 2;           // 颜色平面数
      icoBuffer.writeUInt16LE(32, pos); pos += 2;          // 每像素位数
      icoBuffer.writeUInt32LE(entry.size, pos); pos += 4;  // 图标数据大小
      icoBuffer.writeUInt32LE(entry.offset, pos); pos += 4; // 图标数据偏移
    }

    // 写入图标数据
    for (const buf of iconBuffers) {
      buf.copy(icoBuffer, pos);
      pos += buf.length;
    }

    // 写入文件
    fs.writeFileSync(outputPath, icoBuffer);

    onProgress?.({ percent: 95, stage: "完成" });

    const outputStats = fs.statSync(outputPath);

    const result: ImageTranscodeResult = {
      outputPath,
      outputSize: outputStats.size,
      width: metadata.width || 256,
      height: metadata.height || 256,
      format: "ico",
      channels: 4,
    };

    logger.info("ICO 转码完成", {
      output: outputPath,
      sizes: sizes.join(", "),
      fileSize: outputStats.size,
    });

    onProgress?.({ percent: 100, stage: "完成" });

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
  protected applyResize(
    image: sharp.Sharp,
    transcodeConfig: ImgTranscodeConfig,
    metadata: sharp.Metadata,
  ): sharp.Sharp {
    const mode = transcodeConfig.resizeMode || "none";

    if (
      mode === "none" ||
      (!transcodeConfig.width && !transcodeConfig.height)
    ) {
      return image;
    }

    const options: sharp.ResizeOptions = {
      fit: "inside",
      withoutEnlargement: true,
    };

    switch (mode) {
      case "width":
        // 固定宽度，高度自适应
        if (transcodeConfig.width) {
          image = image.resize(transcodeConfig.width, undefined, options);
        }
        break;

      case "height":
        // 固定高度，宽度自适应
        if (transcodeConfig.height) {
          image = image.resize(undefined, transcodeConfig.height, options);
        }
        break;

      case "scale":
        // 按比例缩放
        if (transcodeConfig.width && transcodeConfig.keepAspect !== false) {
          const scale = transcodeConfig.width / 100;
          const newWidth = Math.round((metadata.width || 1) * scale);
          image = image.resize(newWidth, undefined, options);
        }
        break;

      case "fixed":
        // 固定尺寸（可能变形）
        if (transcodeConfig.width && transcodeConfig.height) {
          options.fit = "fill";
          image = image.resize(
            transcodeConfig.width,
            transcodeConfig.height,
            options,
          );
        }
        break;

      case "crop":
        // 裁剪到指定尺寸
        if (transcodeConfig.width && transcodeConfig.height) {
          options.fit = "cover";
          options.position = "center";
          image = image.resize(
            transcodeConfig.width,
            transcodeConfig.height,
            options,
          );
        }
        break;

      default:
        // 默认：同时指定宽高时保持比例
        if (transcodeConfig.width || transcodeConfig.height) {
          image = image.resize(
            transcodeConfig.width,
            transcodeConfig.height,
            options,
          );
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
  protected applyColorSpace(
    image: sharp.Sharp,
    transcodeConfig: ImgTranscodeConfig,
  ): sharp.Sharp {
    switch (transcodeConfig.colorSpace) {
      case "srgb":
        image = image.toColorspace("srgb");
        break;
      case "rgb":
        image = image.toColorspace("rgb");
        break;
      case "cmyk":
        image = image.toColorspace("cmyk");
        break;
      case "grayscale":
        image = image.grayscale();
        break;
      case "original":
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
  protected applyMetadata(
    image: sharp.Sharp,
    transcodeConfig: ImgTranscodeConfig,
  ): sharp.Sharp {
    if (transcodeConfig.stripMeta) {
      image = image.withExif({});
    }

    if (transcodeConfig.stripICC) {
      image = image.withIccProfile("");
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
  protected applyFormat(
    image: sharp.Sharp,
    transcodeConfig: ImgTranscodeConfig,
  ): sharp.Sharp {
    const format = transcodeConfig.outputFormat.toLowerCase();
    const quality = transcodeConfig.quality || 80;
    const lossless = transcodeConfig.lossless || false;

    switch (format) {
      case "jpg":
      case "jpeg":
        image = image.jpeg({
          quality,
          mozjpeg: true,
        });
        break;

      case "png":
        image = image.png({
          compressionLevel: 6,
          adaptiveFiltering: true,
        });
        break;

      case "webp":
        image = image.webp({
          quality: lossless ? 100 : quality,
          lossless,
        });
        break;

      case "avif":
        image = image.avif({
          quality: lossless ? 100 : quality,
          lossless,
        });
        break;

      case "bmp":
      case "ico":
        // BMP 和 ICO 在 transcode 方法中单独处理
        // 这里不应该到达，但以防万一使用 PNG
        image = image.png();
        break;

      case "tiff":
        image = image.tiff({
          quality,
          compression: "lzw",
        });
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
  protected formatSupportsAlpha(format: string): boolean {
    const info = formatInfoMap[format.toLowerCase()];
    return info?.supportsAlpha || false;
  }
}

// 导出编码器实例
export default new ImageEncoder();
