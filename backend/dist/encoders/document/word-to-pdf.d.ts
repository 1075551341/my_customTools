/**
 * Word → PDF 编码器
 *
 * 使用 LibreOffice headless 模式转换 Word 文档为 PDF
 *
 * @module encoders/document/word-to-pdf
 */
import { DocumentEncoder, DocumentProgressCallback } from './base';
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types';
/**
 * Word → PDF 编码器
 */
export declare class WordToPdfEncoder extends DocumentEncoder {
    readonly name = "word-to-pdf";
    readonly subtype: "word-to-pdf";
    readonly inputFormats: string[];
    readonly outputFormat = "pdf";
    readonly description = "Word \u6587\u6863\u8F6C PDF";
    private libreOfficePath;
    constructor();
    /**
     * 获取 LibreOffice 路径
     */
    private getLibreOfficePath;
    /**
     * 检查 LibreOffice 是否可用
     */
    isAvailable(): Promise<boolean>;
    protected doTranscode(inputPath: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
}
declare const _default: WordToPdfEncoder;
export default _default;
//# sourceMappingURL=word-to-pdf.d.ts.map