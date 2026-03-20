/**
 * 视频编码器注册中心
 *
 * 管理和注册所有可用的视频编码器
 *
 * 功能说明：
 * - 提供编码器注册和查询接口
 * - 根据名称或编码器获取编码器实例
 * - 支持动态添加新编码器
 *
 * @module encoders/video/index
 */
import type { VideoEncoder, EncoderInfo } from './base';
import H264Encoder from './h264';
import H265Encoder from './h265';
import VP9Encoder from './vp9';
/**
 * 注册编码器
 *
 * @param encoder - 编码器实例
 */
export declare function registerEncoder(encoder: VideoEncoder): void;
/**
 * 获取编码器
 *
 * @param name - 编码器名称
 * @returns 编码器实例或 undefined
 */
export declare function getEncoder(name: string): VideoEncoder | undefined;
/**
 * 检查编码器是否存在
 *
 * @param name - 编码器名称
 * @returns 是否存在
 */
export declare function hasEncoder(name: string): boolean;
/**
 * 获取所有编码器信息
 *
 * @returns 编码器信息列表
 */
export declare function getAllEncoders(): EncoderInfo[];
/**
 * 获取所有编码器名称
 *
 * @returns 编码器名称列表
 */
export declare function getEncoderNames(): string[];
/**
 * 根据输出格式获取推荐的编码器
 *
 * @param format - 输出格式
 * @returns 推荐的编码器名称
 */
export declare function getRecommendedEncoder(format: string): string;
/**
 * 初始化默认编码器
 *
 * 注册内置的视频编码器
 */
export declare function initDefaultEncoders(): void;
export { H264Encoder, H265Encoder, VP9Encoder };
//# sourceMappingURL=index.d.ts.map