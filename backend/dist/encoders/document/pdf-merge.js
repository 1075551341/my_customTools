"use strict";
/**
 * PDF 合并编码器
 *
 * 合并多个 PDF 文件为一个
 *
 * @module encoders/document/pdf-merge
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfMergeEncoder = void 0;
const pdf_lib_1 = require("pdf-lib");
const fs_1 = __importDefault(require("fs"));
const base_1 = require("./base");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * PDF 合并编码器
 */
class PdfMergeEncoder extends base_1.DocumentEncoder {
    name = 'pdf-merge';
    subtype = 'pdf-merge';
    inputFormats = ['pdf'];
    outputFormat = 'pdf';
    description = '合并多个 PDF 文件';
    async doTranscode(inputPaths, outputPath, config, onProgress) {
        const pdfPaths = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
        if (pdfPaths.length < 2) {
            throw new Error('PDF 合并至少需要 2 个文件');
        }
        onProgress?.({ percent: 5, stage: '初始化' });
        const mergedPdf = await pdf_lib_1.PDFDocument.create();
        let totalPages = 0;
        logger_1.default.info('开始 PDF 合并', { fileCount: pdfPaths.length });
        for (let i = 0; i < pdfPaths.length; i++) {
            const pdfPath = pdfPaths[i];
            onProgress?.({
                percent: 5 + Math.round((i / pdfPaths.length) * 80),
                stage: `合并文件 ${i + 1}/${pdfPaths.length}`
            });
            const pdfBytes = fs_1.default.readFileSync(pdfPath);
            const pdf = await pdf_lib_1.PDFDocument.load(pdfBytes);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
            totalPages += pages.length;
            logger_1.default.debug('合并 PDF 文件', {
                file: pdfPath,
                pages: pages.length,
                progress: `${i + 1}/${pdfPaths.length}`
            });
        }
        onProgress?.({ percent: 90, stage: '保存文件' });
        const pdfBytes = await mergedPdf.save();
        fs_1.default.writeFileSync(outputPath, pdfBytes);
        onProgress?.({ percent: 100, stage: '完成' });
        logger_1.default.info('PDF 合并完成', {
            inputFiles: pdfPaths.length,
            totalPages,
            outputSize: pdfBytes.length
        });
        return {
            outputPath,
            outputSize: pdfBytes.length,
            pageCount: totalPages,
            format: 'pdf'
        };
    }
}
exports.PdfMergeEncoder = PdfMergeEncoder;
exports.default = new PdfMergeEncoder();
//# sourceMappingURL=pdf-merge.js.map