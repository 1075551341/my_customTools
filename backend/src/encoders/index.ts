/**
 * 编码器总入口
 *
 * 统一导出所有编码器模块
 *
 * @module encoders/index
 */

// 视频编码器（显式导出避免命名冲突）
export {
  registerEncoder as registerVideoEncoder,
  getEncoder as getVideoEncoder,
  hasEncoder as hasVideoEncoder,
  getAllEncoders as getAllVideoEncoders,
  getEncoderNames as getVideoEncoderNames,
  getRecommendedEncoder,
  initDefaultEncoders as initDefaultVideoEncoders,
  H264Encoder,
  H265Encoder,
  VP9Encoder,
  AV1Encoder
} from './video'

// 图片编码器
export {
  getImageEncoder,
  getSupportedImageFormats,
  supportsImageFormat
} from './image'

// 动图编码器
export {
  default as animEncoder,
  transcodeFromImages,
  getSupportedAnimFormats
} from './anim'

// 文档编码器（显式导出避免命名冲突）
export {
  registerEncoder as registerDocumentEncoder,
  getEncoder as getDocumentEncoder,
  hasEncoder as hasDocumentEncoder,
  getAllEncoders as getAllDocumentEncoders,
  getEncoderSubtypes as getDocumentEncoderSubtypes,
  getSupportedDocumentFormats,
  getEncoderByFormats as getDocumentEncoderByFormats,
  transcodeDocument,
  initDefaultEncoders as initDefaultDocumentEncoders,
  PdfMergeEncoder,
  PdfSplitEncoder,
  WordToPdfEncoder,
  ExcelToCsvEncoder,
  ExcelToWordEncoder
} from './document'

// 导入各模块
import * as videoEncoders from './video'
import * as imageEncoders from './image'
import * as animEncoders from './anim'
import * as documentEncoders from './document'

/**
 * 获取所有编码器信息
 *
 * @returns 所有编码器信息
 */
export function getAllEncoderInfo(): {
  video: ReturnType<typeof videoEncoders.getAllEncoders>
  image: ReturnType<typeof imageEncoders.getSupportedImageFormats>
  anim: ReturnType<typeof animEncoders.getSupportedAnimFormats>
  document: ReturnType<typeof documentEncoders.getAllEncoders>
} {
  return {
    video: videoEncoders.getAllEncoders(),
    image: imageEncoders.getSupportedImageFormats(),
    anim: animEncoders.getSupportedAnimFormats(),
    document: documentEncoders.getAllEncoders()
  }
}