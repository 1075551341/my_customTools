/**
 * 图片编码器注册中心
 *
 * 管理和注册图片编码器
 *
 * @module encoders/image/index
 */
import imageEncoderInstance, { ImageEncoderInfo, ImageEncoder } from './sharp';
export type { ImageEncoderInfo };
export { ImageEncoder };
/**
 * 获取图片编码器实例
 *
 * @returns 图片编码器实例
 */
export declare function getImageEncoder(): typeof imageEncoderInstance;
/**
 * 获取支持的图片格式列表
 *
 * @returns 格式信息列表
 */
export declare function getSupportedImageFormats(): ImageEncoderInfo[];
/**
 * 检查图片格式是否支持
 *
 * @param format - 格式名称
 * @returns 是否支持
 */
export declare function supportsImageFormat(format: string): boolean;
export default imageEncoderInstance;
//# sourceMappingURL=index.d.ts.map