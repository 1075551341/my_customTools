"use strict";
/**
 * Excel → Word 编码器
 *
 * 将 Excel 文件转换为 Word 表格文档
 *
 * @module encoders/document/excel-to-word
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelToWordEncoder = void 0;
const xlsx_populate_1 = __importDefault(require("xlsx-populate"));
const docx_1 = require("docx");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Excel → Word 编码器
 */
class ExcelToWordEncoder extends base_1.DocumentEncoder {
    name = 'excel-to-word';
    subtype = 'excel-to-word';
    inputFormats = ['xlsx', 'xls'];
    outputFormat = 'docx';
    description = 'Excel 转 Word 表格';
    async doTranscode(inputPath, outputPath, config, onProgress) {
        const excelPath = Array.isArray(inputPath) ? inputPath[0] : inputPath;
        onProgress?.({ percent: 5, stage: '读取 Excel 文件' });
        logger_1.default.info('开始 Excel → Word 转换', { input: excelPath });
        // 读取 Excel 文件
        const workbook = await xlsx_populate_1.default.fromFileAsync(excelPath);
        onProgress?.({ percent: 20, stage: '获取工作表' });
        // 获取工作表
        const sheetName = config.excelToCsv?.sheet; // 复用配置
        let sheet;
        if (sheetName !== undefined) {
            if (typeof sheetName === 'number') {
                sheet = workbook.sheet(sheetName);
            }
            else {
                sheet = workbook.sheet(sheetName);
            }
        }
        else {
            sheet = workbook.sheet(0);
        }
        if (!sheet) {
            throw new Error(`工作表 "${sheetName}" 不存在`);
        }
        onProgress?.({ percent: 40, stage: '提取数据' });
        // 获取数据范围
        const usedRange = sheet.usedRange();
        if (!usedRange) {
            throw new Error('工作表为空');
        }
        const values = usedRange.value();
        onProgress?.({ percent: 60, stage: '生成 Word 表格' });
        // 创建 Word 表格行
        const tableRows = values.map((row, rowIndex) => {
            const cells = row.map(cell => {
                const cellText = cell === null || cell === undefined ? '' : String(cell);
                return new docx_1.TableCell({
                    children: [
                        new docx_1.Paragraph({
                            children: [
                                new docx_1.TextRun({
                                    text: cellText,
                                    bold: rowIndex === 0 // 首行加粗作为表头
                                })
                            ],
                            alignment: docx_1.AlignmentType.CENTER
                        })
                    ],
                    width: { size: 100 / row.length, type: docx_1.WidthType.PERCENTAGE }
                });
            });
            return new docx_1.TableRow({ children: cells });
        });
        // 创建 Word 文档
        const doc = new docx_1.Document({
            sections: [{
                    properties: {},
                    children: [
                        new docx_1.Paragraph({
                            children: [
                                new docx_1.TextRun({
                                    text: path_1.default.parse(excelPath).name,
                                    bold: true,
                                    size: 28
                                })
                            ],
                            alignment: docx_1.AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        new docx_1.Table({
                            rows: tableRows,
                            width: { size: 100, type: docx_1.WidthType.PERCENTAGE }
                        })
                    ]
                }]
        });
        onProgress?.({ percent: 80, stage: '保存文件' });
        // 生成并保存文件
        const buffer = await docx_1.Packer.toBuffer(doc);
        fs_1.default.writeFileSync(outputPath, buffer);
        const stats = fs_1.default.statSync(outputPath);
        onProgress?.({ percent: 100, stage: '完成' });
        logger_1.default.info('Excel → Word 转换完成', {
            input: excelPath,
            output: outputPath,
            rows: values.length,
            size: stats.size
        });
        return {
            outputPath,
            outputSize: stats.size,
            format: 'docx'
        };
    }
}
exports.ExcelToWordEncoder = ExcelToWordEncoder;
exports.default = new ExcelToWordEncoder();
//# sourceMappingURL=excel-to-word.js.map