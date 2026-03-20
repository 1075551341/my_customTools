/**
 * 文档编码器注册中心
 *
 * 管理和注册所有可用的文档编码器
 *
 * 功能说明：
 * - 提供编码器注册和查询接口
 * - 根据名称或子类型获取编码器实例
 * - 支持动态添加新编码器
 *
 * @module encoders/document/index
 */
import type { DocumentEncoder, DocumentProgressCallback } from './base';
import type { DocumentTaskSubtype, DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types';
import PdfMergeEncoder from './pdf-merge';
import PdfSplitEncoder from './pdf-split';
import WordToPdfEncoder from './word-to-pdf';
import ExcelToCsvEncoder from './excel-to-csv';
import ExcelToWordEncoder from './excel-to-word';
/**
 * 编码器信息
 */
export interface DocumentEncoderInfo {
    name: string;
    subtype: DocumentTaskSubtype;
    inputFormats: string[];
    outputFormat: string;
    description: string;
}
/**
 * 注册编码器
 *
 * @param encoder - 编码器实例
 */
export declare function registerEncoder(encoder: DocumentEncoder): void;
/**
 * 获取编码器
 *
 * @param subtype - 编码器子类型
 * @returns 编码器实例或 undefined
 */
export declare function getEncoder(subtype: DocumentTaskSubtype): DocumentEncoder | undefined;
/**
 * 检查编码器是否存在
 *
 * @param subtype - 编码器子类型
 * @returns 是否存在
 */
export declare function hasEncoder(subtype: DocumentTaskSubtype): boolean;
/**
 * 获取所有编码器信息
 *
 * @returns 编码器信息列表
 */
export declare function getAllEncoders(): DocumentEncoderInfo[];
/**
 * 获取所有编码器子类型
 *
 * @returns 编码器子类型列表
 */
export declare function getEncoderSubtypes(): DocumentTaskSubtype[];
/**
 * 获取支持的文档格式
 */
export declare function getSupportedDocumentFormats(): {
    input: string[];
    output: string[];
};
/**
 * 根据输入输出格式获取编码器
 *
 * @param inputFormat - 输入格式
 * @param outputFormat - 输出格式
 * @returns 编码器实例或 undefined
 */
export declare function getEncoderByFormats(inputFormat: string, outputFormat: string): DocumentEncoder | undefined;
/**
 * 执行文档转码
 *
 * @param subtype - 编码器子类型
 * @param inputPath - 输入路径
 * @param outputPath - 输出路径
 * @param config - 转码配置
 * @param onProgress - 进度回调
 * @returns 转码结果
 */
export declare function transcodeDocument(subtype: DocumentTaskSubtype, inputPath: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
/**
 * 初始化默认编码器
 *
 * 注册内置的文档编码器
 */
export declare function initDefaultEncoders(): void;
export { PdfMergeEncoder, PdfSplitEncoder, WordToPdfEncoder, ExcelToCsvEncoder, ExcelToWordEncoder };
//# sourceMappingURL=index.d.ts.map