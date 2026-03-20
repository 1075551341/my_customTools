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

import type { VideoEncoder, EncoderInfo } from './base'
import H264Encoder from './h264'
import H265Encoder from './h265'
import VP9Encoder from './vp9'

/**
 * 编码器映射表
 *
 * key: 编码器名称
 * value: 编码器实例
 */
const encoders: Map<string, VideoEncoder> = new Map()

/**
 * 注册编码器
 *
 * @param encoder - 编码器实例
 */
export function registerEncoder(encoder: VideoEncoder): void {
  encoders.set(encoder.name, encoder)
}

/**
 * 获取编码器
 *
 * @param name - 编码器名称
 * @returns 编码器实例或 undefined
 */
export function getEncoder(name: string): VideoEncoder | undefined {
  return encoders.get(name)
}

/**
 * 检查编码器是否存在
 *
 * @param name - 编码器名称
 * @returns 是否存在
 */
export function hasEncoder(name: string): boolean {
  return encoders.has(name)
}

/**
 * 获取所有编码器信息
 *
 * @returns 编码器信息列表
 */
export function getAllEncoders(): EncoderInfo[] {
  const list: EncoderInfo[] = []
  encoders.forEach(encoder => {
    list.push(encoder.getInfo())
  })
  return list
}

/**
 * 获取所有编码器名称
 *
 * @returns 编码器名称列表
 */
export function getEncoderNames(): string[] {
  return Array.from(encoders.keys())
}

/**
 * 根据输出格式获取推荐的编码器
 *
 * @param format - 输出格式
 * @returns 推荐的编码器名称
 */
export function getRecommendedEncoder(format: string): string {
  const formatEncoderMap: Record<string, string> = {
    mp4: 'h264',
    webm: 'vp9',
    mkv: 'h265'
  }

  return formatEncoderMap[format.toLowerCase()] || 'h264'
}

/**
 * 初始化默认编码器
 *
 * 注册内置的视频编码器
 */
export function initDefaultEncoders(): void {
  registerEncoder(H264Encoder)
  registerEncoder(H265Encoder)
  registerEncoder(VP9Encoder)
}

// 自动初始化默认编码器
initDefaultEncoders()

// 导出各编码器
export { H264Encoder, H265Encoder, VP9Encoder }