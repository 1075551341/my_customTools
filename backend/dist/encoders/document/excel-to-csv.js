"use strict";
/**
 * Excel → CSV 编码器
 *
 * 将 Excel 文件转换为 CSV 格式
 *
 * @module encoders/document/excel-to-csv
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelToCsvEncoder = void 0;
const xlsx_populate_1 = __importDefault(require("xlsx-populate"));
const fs_1 = __importDefault(require("fs"));
const base_1 = require("./base");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Excel → CSV 编码器
 */
class ExcelToCsvEncoder extends base_1.DocumentEncoder {
    name = 'excel-to-csv';
    subtype = 'excel-to-csv';
    inputFormats = ['xlsx', 'xls'];
    outputFormat = 'csv';
    description = 'Excel 转 CSV';
    async doTranscode(inputPath, outputPath, config, onProgress) {
        const excelPath = Array.isArray(inputPath) ? inputPath[0] : inputPath;
        onProgress?.({ percent: 5, stage: '读取 Excel 文件' });
        logger_1.default.info('开始 Excel → CSV 转换', { input: excelPath });
        // 读取 Excel 文件
        const workbook = await xlsx_populate_1.default.fromFileAsync(excelPath);
        onProgress?.({ percent: 20, stage: '获取工作表' });
        // 获取工作表
        const sheetName = config.excelToCsv?.sheet;
        let sheet;
        if (sheetName !== undefined) {
            // 按名称或索引获取
            if (typeof sheetName === 'number') {
                sheet = workbook.sheet(sheetName);
            }
            else {
                sheet = workbook.sheet(sheetName);
            }
        }
        else {
            // 默认使用第一个工作表
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
        const delimiter = config.excelToCsv?.delimiter || ',';
        const encoding = config.excelToCsv?.encoding || 'utf-8';
        onProgress?.({ percent: 60, stage: '转换为 CSV' });
        // 转换为 CSV
        const csvLines = values.map(row => {
            return row.map(cell => {
                if (cell === null || cell === undefined) {
                    return '';
                }
                const cellStr = String(cell);
                // 处理包含逗号、引号或换行的单元格
                if (cellStr.includes(delimiter) || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(delimiter);
        });
        const csvContent = csvLines.join('\n');
        onProgress?.({ percent: 80, stage: '保存文件' });
        // 写入文件
        if (encoding === 'gbk') {
            // GBK 编码需要 iconv-lite
            const iconv = require('iconv-lite');
            const buffer = iconv.encode(csvContent, 'gbk');
            fs_1.default.writeFileSync(outputPath, buffer);
        }
        else {
            fs_1.default.writeFileSync(outputPath, csvContent, 'utf-8');
        }
        const stats = fs_1.default.statSync(outputPath);
        onProgress?.({ percent: 100, stage: '完成' });
        logger_1.default.info('Excel → CSV 转换完成', {
            input: excelPath,
            output: outputPath,
            rows: values.length,
            size: stats.size
        });
        return {
            outputPath,
            outputSize: stats.size,
            format: 'csv'
        };
    }
}
exports.ExcelToCsvEncoder = ExcelToCsvEncoder;
exports.default = new ExcelToCsvEncoder();
//# sourceMappingURL=excel-to-csv.js.map