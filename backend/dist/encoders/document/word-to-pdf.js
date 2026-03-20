"use strict";
/**
 * Word → PDF 编码器
 *
 * 使用 LibreOffice headless 模式转换 Word 文档为 PDF
 *
 * @module encoders/document/word-to-pdf
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordToPdfEncoder = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const logger_1 = __importDefault(require("../../utils/logger"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Word → PDF 编码器
 */
class WordToPdfEncoder extends base_1.DocumentEncoder {
    name = 'word-to-pdf';
    subtype = 'word-to-pdf';
    inputFormats = ['doc', 'docx', 'odt', 'rtf', 'txt'];
    outputFormat = 'pdf';
    description = 'Word 文档转 PDF';
    // LibreOffice 路径
    libreOfficePath;
    constructor() {
        super();
        this.libreOfficePath = this.getLibreOfficePath();
    }
    /**
     * 获取 LibreOffice 路径
     */
    getLibreOfficePath() {
        // 从环境变量获取
        if (process.env.LIBREOFFICE_PATH) {
            return process.env.LIBREOFFICE_PATH;
        }
        // Windows 默认路径
        if (process.platform === 'win32') {
            const defaultPaths = [
                'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
                process.env.LOCALAPPDATA + '\\LibreOffice\\program\\soffice.exe'
            ].filter(Boolean);
            for (const p of defaultPaths) {
                if (p && fs_1.default.existsSync(p)) {
                    return p;
                }
            }
            return 'soffice';
        }
        // Linux/Mac
        return 'libreoffice';
    }
    /**
     * 检查 LibreOffice 是否可用
     */
    async isAvailable() {
        try {
            await execAsync(`"${this.libreOfficePath}" --version`, { timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }
    async doTranscode(inputPath, outputPath, config, onProgress) {
        const inputFile = Array.isArray(inputPath) ? inputPath[0] : inputPath;
        const outputDir = path_1.default.dirname(outputPath);
        onProgress?.({ percent: 5, stage: '检查 LibreOffice' });
        // 检查 LibreOffice 是否可用
        const available = await this.isAvailable();
        if (!available) {
            throw new Error('LibreOffice 未安装或不可用。请安装 LibreOffice 后重试。');
        }
        onProgress?.({ percent: 10, stage: '准备转换' });
        logger_1.default.info('开始 Word → PDF 转换', {
            input: inputFile,
            output: outputPath
        });
        // 构建 LibreOffice 命令
        const pdfType = config.wordToPdf?.format === 'pdfa' ? 'pdfa' : 'pdf';
        const command = `"${this.libreOfficePath}" --headless --convert-to ${pdfType} --outdir "${outputDir}" "${inputFile}"`;
        onProgress?.({ percent: 20, stage: '正在转换' });
        try {
            const { stdout, stderr } = await execAsync(command, {
                timeout: 120000 // 2 分钟超时
            });
            onProgress?.({ percent: 80, stage: '检查输出' });
            // LibreOffice 输出的文件名基于输入文件名
            const inputBasename = path_1.default.parse(inputFile).name;
            const generatedPdf = path_1.default.join(outputDir, `${inputBasename}.pdf`);
            // 重命名为目标文件名
            if (generatedPdf !== outputPath && fs_1.default.existsSync(generatedPdf)) {
                fs_1.default.renameSync(generatedPdf, outputPath);
            }
            if (!fs_1.default.existsSync(outputPath)) {
                throw new Error('PDF 文件生成失败');
            }
            const stats = fs_1.default.statSync(outputPath);
            onProgress?.({ percent: 100, stage: '完成' });
            logger_1.default.info('Word → PDF 转换完成', {
                input: inputFile,
                output: outputPath,
                size: stats.size
            });
            return {
                outputPath,
                outputSize: stats.size,
                format: 'pdf'
            };
        }
        catch (error) {
            const errMsg = error.message;
            logger_1.default.error('Word → PDF 转换失败', { error: errMsg });
            throw new Error(`Word 转 PDF 失败: ${errMsg}`);
        }
    }
}
exports.WordToPdfEncoder = WordToPdfEncoder;
exports.default = new WordToPdfEncoder();
//# sourceMappingURL=word-to-pdf.js.map