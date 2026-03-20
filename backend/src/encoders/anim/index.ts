/**
 * 动图编码器注册中心
 *
 * 管理和注册动图编码器
 *
 * @module encoders/anim/index
 */

import animEncoderInstance, {
  AnimEncoderInfo,
  AnimEncoder,
  AnimTranscodeResult,
  AnimProgressCallback,
  transcodeFromImages
} from './gif'

// 重新导出类型
export type { AnimEncoderInfo, AnimTranscodeResult, AnimProgressCallback }
export { AnimEncoder, transcodeFromImages }

/**
 * 获取动图编码器实例
 *
 * @returns 动图编码器实例
 */
export function getAnimEncoder(): typeof animEncoderInstance {
  return animEncoderInstance
}

/**
 * 获取支持的动图格式列表
 *
 * @returns 格式信息列表
 */
export function getSupportedAnimFormats(): AnimEncoderInfo[] {
  return animEncoderInstance.getSupportedFormats()
}

/**
 * 检查动图格式是否支持
 *
 * @param format - 格式名称
 * @returns 是否支持
 */
export function supportsAnimFormat(format: string): boolean {
  return animEncoderInstance.supportsFormat(format)
}

// 默认导出编码器实例
export default animEncoderInstance