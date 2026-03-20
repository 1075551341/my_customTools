/**
 * Excel → CSV 编码器
 *
 * 将 Excel 文件转换为 CSV 格式
 *
 * @module encoders/document/excel-to-csv
 */
import { DocumentEncoder, DocumentProgressCallback } from './base';
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types';
/**
 * Excel → CSV 编码器
 */
export declare class ExcelToCsvEncoder extends DocumentEncoder {
    readonly name = "excel-to-csv";
    readonly subtype: "excel-to-csv";
    readonly inputFormats: string[];
    readonly outputFormat = "csv";
    readonly description = "Excel \u8F6C CSV";
    protected doTranscode(inputPath: string | string[], outputPath: string, config: DocumentTranscodeConfig, onProgress?: DocumentProgressCallback): Promise<DocumentTranscodeResult>;
}
declare const _default: ExcelToCsvEncoder;
export default _default;
//# sourceMappingURL=excel-to-csv.d.ts.map