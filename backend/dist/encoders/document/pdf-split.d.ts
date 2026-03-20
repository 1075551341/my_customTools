/**
 * PDF 拆分编码器
 *
 * 将 PDF 文件拆分为多个单页或指定范围的 PDF
 *
 * @module encoders/document/pdf-split
 */
import { DocumentEncoder, DocumentProgressCallback } from './base';
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types';
/**
 * PDF 拆分编码器
 */
export declare class PdfSplitEncoder extends DocumentEncoder {
    readonly name = "pdf-split";
    readonly subtype: "pdf-split";
    readonly inputFormats: string[];
    readonly outputFormat = "pdf";
    readonly description = "\u62C6\u5206 PDF \u6587\u4EF6";
    protected doTranscode(inputPath: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
}
declare const _default: PdfSplitEncoder;
export default _default;
//# sourceMappingURL=pdf-split.d.ts.map