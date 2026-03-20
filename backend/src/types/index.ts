/**
 * 全局类型定义
 *
 * 定义项目中使用的所有类型和接口
 *
 * @module types
 */

import { Request } from "express";

/**
 * 扩展 Express Request 类型，添加用户信息
 */
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: "super" | "admin" | "user";
    }
    interface Request {
      user?: User;
    }
  }
}

export {};

/**
 * API 响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 分页数据格式
 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 用户信息
 */
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: "super" | "admin" | "user";
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * 任务状态枚举
 */
export type TaskStatus =
  | "waiting"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * 任务类型枚举
 */
export type TaskType = "video" | "img" | "anim" | "document";

/**
 * 文档任务子类型
 */
export type DocumentTaskSubtype =
  | "word-to-pdf"
  | "excel-to-csv"
  | "excel-to-word"
  | "pdf-merge"
  | "pdf-split";

/**
 * GIF 合成任务类型（图片序列合成）
 */
export type GifComposeTask = {
  id: string;
  type: "gif-compose";
  userId: string;
  imagePaths: string[];
  outputPath: string;
  outputFormat: "gif" | "webp" | "apng";
  config: AnimTranscodeConfig;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  completedAt?: string;
  errorMsg?: string;
};

/**
 * 基础任务信息
 */
export interface BaseTask {
  id: string;
  type: TaskType;
  userId: string;
  fileName: string;
  fileSize: number;
  inputPath: string;
  outputPath: string;
  inputFormat: string;
  outputFormat: string;
  status: TaskStatus;
  progress: number;
  config: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMsg?: string;
}

/**
 * 视频转码配置
 */
export interface VideoTranscodeConfig {
  videoCodec?: "h264" | "h265" | "vp9" | "av1" | "copy";
  resolution?: string;
  bitrate?: string;
  crf?: number;
  fps?: number;
  audioCodec?: "aac" | "mp3" | "opus" | "copy";
  audioBitrate?: string;
  startTime?: number | string;
  endTime?: number | string;
  rotate?: 90 | -90 | 180;
  hwAccel?: "nvidia" | "vaapi" | "videotoolbox";
}

/**
 * 图片转码配置
 */
export interface ImgTranscodeConfig {
  outputFormat:
    | "jpg"
    | "jpeg"
    | "png"
    | "webp"
    | "avif"
    | "bmp"
    | "tiff"
    | "ico"
    | "heic";
  quality?: number;
  lossless?: boolean;
  resizeMode?: "none" | "width" | "height" | "scale" | "fixed" | "crop";
  width?: number;
  height?: number;
  keepAspect?: boolean;
  colorSpace?: "original" | "srgb" | "rgb" | "cmyk" | "grayscale";
  stripMeta?: boolean;
  stripICC?: boolean;
  rotate?: 0 | 90 | 180 | 270 | "auto";
  flipH?: boolean;
  flipV?: boolean;
  background?: string;
  /** 压缩配置 */
  compression?: ImageCompressionConfig;
}

/**
 * 动图转码配置
 */
export interface AnimTranscodeConfig {
  outputFormat: "gif" | "webp" | "apng";
  fps?: number;
  width?: number;
  height?: number;
  colors?: number;
  quality?: number;
  loop?: number;
  dither?: "bayer" | "floyd" | "none";
  optimize?: boolean;
  delay?: number;
  /** 视频截取开始时间（秒），用于视频转GIF */
  startTime?: number;
  /** 视频截取时长（秒），用于视频转GIF */
  duration?: number;
  /** 图片序列路径（合成GIF用） */
  imagePaths?: string[];
}

/**
 * 队列状态
 */
export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

/**
 * 系统状态
 */
export interface SystemStatus {
  cpu: {
    usage: string;
    cores?: number;
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usage?: string;
  };
  disk:
    | {
        fs: string;
        total: string;
        used: string;
        usage: string;
      }
    | string;
  queue?: {
    video: QueueStatus;
    image: QueueStatus;
    anim: QueueStatus;
  };
  timestamp: string;
}

/**
 * 系统配置
 */
export interface SystemConfig {
  video: {
    parallelLimit: number;
    maxFileSize: number;
    allowedInputFormats: string[];
  };
  img: {
    parallelLimit: number;
    maxFileSize: number;
    allowedInputFormats: string[];
  };
  upload: {
    chunkSize: number;
    maxParallelUploads: number;
  };
  storage: {
    type: "local" | "s3";
    uploadDir: string;
    outputDir: string;
    autoClean: boolean;
    cleanDays: number;
  };
  updatedAt?: string;
}

/**
 * 上传会话信息
 */
export interface UploadSession {
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  type: TaskType;
  userId: string;
  createdAt: string;
}

/**
 * JWT Token 载荷
 */
export interface JwtPayload {
  id: string;
  username: string;
  role: "super" | "admin" | "user";
  iat?: number;
  exp?: number;
}

/**
 * 文档转码配置
 */
export interface DocumentTranscodeConfig {
  subtype: DocumentTaskSubtype;
  /** Word → PDF 配置 */
  wordToPdf?: {
    format?: "pdf" | "pdfa";
    quality?: "screen" | "print" | "high";
  };
  /** Excel → CSV 配置 */
  excelToCsv?: {
    sheet?: string | number;
    delimiter?: "," | ";" | "\t";
    encoding?: "utf-8" | "gbk";
  };
  /** Excel → Word 配置 */
  excelToWord?: {
    sheet?: string | number;
    template?: string;
  };
  /** PDF 合并配置 */
  pdfMerge?: {
    inputPaths: string[];
    outputName?: string;
  };
  /** PDF 拆分配置 */
  pdfSplit?: {
    mode: "page" | "range" | "all";
    pages?: number[];
    ranges?: string[];
  };
}

/**
 * 图片压缩配置
 */
export interface ImageCompressionConfig {
  mode: "quality" | "size" | "percent";
  /** 目标大小（字节） */
  targetSize?: number;
  /** 压缩百分比 (1-100) */
  targetPercent?: number;
  /** 最低质量 (1-100) */
  minQuality?: number;
}

/**
 * 文档转码结果
 */
export interface DocumentTranscodeResult {
  outputPath: string;
  outputSize: number;
  pageCount?: number;
  format: string;
  /** PDF 拆分时的多个输出文件 */
  outputPaths?: string[];
}
