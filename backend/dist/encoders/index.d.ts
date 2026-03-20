/**
 * 编码器总入口
 *
 * 统一导出所有编码器模块
 *
 * @module encoders/index
 */
export { registerEncoder as registerVideoEncoder, getEncoder as getVideoEncoder, hasEncoder as hasVideoEncoder, getAllEncoders as getAllVideoEncoders, getEncoderNames as getVideoEncoderNames, getRecommendedEncoder, initDefaultEncoders as initDefaultVideoEncoders, H264Encoder, H265Encoder, VP9Encoder } from './video';
export { getImageEncoder, getSupportedImageFormats, supportsImageFormat } from './image';
export { default as animEncoder, transcodeFromImages, getSupportedAnimFormats } from './anim';
export { registerEncoder as registerDocumentEncoder, getEncoder as getDocumentEncoder, hasEncoder as hasDocumentEncoder, getAllEncoders as getAllDocumentEncoders, getEncoderSubtypes as getDocumentEncoderSubtypes, getSupportedDocumentFormats, getEncoderByFormats as getDocumentEncoderByFormats, transcodeDocument, initDefaultEncoders as initDefaultDocumentEncoders, PdfMergeEncoder, PdfSplitEncoder, WordToPdfEncoder, ExcelToCsvEncoder, ExcelToWordEncoder } from './document';
import * as videoEncoders from './video';
import * as imageEncoders from './image';
import * as animEncoders from './anim';
import * as documentEncoders from './document';
/**
 * 获取所有编码器信息
 *
 * @returns 所有编码器信息
 */
export declare function getAllEncoderInfo(): {
    video: ReturnType<typeof videoEncoders.getAllEncoders>;
    image: ReturnType<typeof imageEncoders.getSupportedImageFormats>;
    anim: ReturnType<typeof animEncoders.getSupportedAnimFormats>;
    document: ReturnType<typeof documentEncoders.getAllEncoders>;
};
//# sourceMappingURL=index.d.ts.map