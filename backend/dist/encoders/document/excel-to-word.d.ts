/**
 * Excel → Word 编码器
 *
 * 将 Excel 文件转换为 Word 表格文档
 *
 * @module encoders/document/excel-to-word
 */
import { DocumentEncoder, DocumentProgressCallback } from './base';
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types';
/**
 * Excel → Word 编码器
 */
export declare class ExcelToWordEncoder extends DocumentEncoder {
    readonly name = "excel-to-word";
    readonly subtype: "excel-to-word";
    readonly inputFormats: string[];
    readonly outputFormat = "docx";
    readonly description = "Excel \u8F6C Word \u8868\u683C";
    protected doTranscode(inputPath: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
}
declare const _default: ExcelToWordEncoder;
export default _default;
//# sourceMappingURL=excel-to-word.d.ts.map