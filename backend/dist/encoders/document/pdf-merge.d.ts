/**
 * PDF 合并编码器
 *
 * 合并多个 PDF 文件为一个
 *
 * @module encoders/document/pdf-merge
 */
import { DocumentEncoder, DocumentProgressCallback } from './base';
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types';
/**
 * PDF 合并编码器
 */
export declare class PdfMergeEncoder extends DocumentEncoder {
    readonly name = "pdf-merge";
    readonly subtype: "pdf-merge";
    readonly inputFormats: string[];
    readonly outputFormat = "pdf";
    readonly description = "\u5408\u5E76\u591A\u4E2A PDF \u6587\u4EF6";
    protected doTranscode(inputPaths: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
}
declare const _default: PdfMergeEncoder;
export default _default;
//# sourceMappingURL=pdf-merge.d.ts.map