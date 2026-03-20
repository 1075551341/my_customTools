/**
 * 图片编码器注册中心
 *
 * 管理和注册图片编码器
 *
 * @module encoders/image/index
 */

import imageEncoderInstance, { ImageEncoderInfo, ImageEncoder } from './sharp'

// 重新导出类型
export type { ImageEncoderInfo }
export { ImageEncoder }

/**
 * 获取图片编码器实例
 *
 * @returns 图片编码器实例
 */
export function getImageEncoder(): typeof imageEncoderInstance {
  return imageEncoderInstance
}

/**
 * 获取支持的图片格式列表
 *
 * @returns 格式信息列表
 */
export function getSupportedImageFormats(): ImageEncoderInfo[] {
  return imageEncoderInstance.getSupportedFormats()
}

/**
 * 检查图片格式是否支持
 *
 * @param format - 格式名称
 * @returns 是否支持
 */
export function supportsImageFormat(format: string): boolean {
  return imageEncoderInstance.supportsFormat(format)
}

// 默认导出编码器实例
export default imageEncoderInstance