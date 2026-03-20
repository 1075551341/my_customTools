/**
 * 文档编码器基类
 *
 * 提供文档格式转换的通用接口和基础功能
 *
 * @module encoders/document/base
 */
import type { DocumentTranscodeConfig, DocumentTaskSubtype, DocumentTranscodeResult } from '../../types';
/**
 * 进度回调函数类型
 */
export type DocumentProgressCallback = (progress: {
    percent: number;
    stage: string;
}) => void;
/**
 * 文档编码器抽象基类
 */
export declare abstract class DocumentEncoder {
    abstract readonly name: string;
    abstract readonly subtype: DocumentTaskSubtype;
    abstract readonly inputFormats: string[];
    abstract readonly outputFormat: string;
    abstract readonly description: string;
    /**
     * 执行文档转码
     *
     * @param inputPath - 输入文件路径（单个或多个）
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param onProgress - 进度回调
     * @returns 转码结果
     */
    transcode(inputPath: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
    /**
     * 子类实现具体转码逻辑
     */
    protected abstract doTranscode(inputPath: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
    /**
     * 检查是否支持指定格式
     *
     * @param format - 格式名称
     * @returns 是否支持
     */
    supportsFormat(format: string): boolean;
    /**
     * 获取编码器信息
     */
    getInfo(): {
        name: string;
        subtype: DocumentTaskSubtype;
        inputFormats: string[];
        outputFormat: string;
        description: string;
    };
}
//# sourceMappingURL=base.d.ts.map