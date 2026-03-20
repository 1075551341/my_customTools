"use strict";
/**
 * 文档转换路由模块
 *
 * 提供文档格式转换相关接口（PDF合并/拆分、Word转PDF、Excel转CSV/Word）
 *
 * @module routes/document
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
const tasksService = __importStar(require("../services/tasks"));
const document_1 = require("../encoders/document");
const router = (0, express_1.Router)();
// 所有文档接口需要认证
router.use(auth_1.authMiddleware);
/**
 * GET /api/document/encoders
 *
 * 获取支持的文档转换类型
 *
 * @returns 编码器列表
 */
router.get('/encoders', (_req, res) => {
    const encoders = (0, document_1.getAllEncoders)();
    const formats = (0, document_1.getSupportedDocumentFormats)();
    return (0, response_1.success)(res, {
        encoders,
        supportedFormats: formats
    });
});
/**
 * POST /api/document/create
 *
 * 创建文档转换任务
 *
 * @body {subtype, fileName, inputPath, inputFormat, config}
 * @returns 任务信息
 */
router.post('/create', (req, res) => {
    const { subtype, fileName, inputPath, inputPaths, inputFormat, config } = req.body;
    // 参数验证
    if (!subtype) {
        return (0, response_1.error)(res, 'subtype 不能为空', 400);
    }
    const validSubtypes = [
        'word-to-pdf',
        'excel-to-csv',
        'excel-to-word',
        'pdf-merge',
        'pdf-split'
    ];
    if (!validSubtypes.includes(subtype)) {
        return (0, response_1.error)(res, `subtype 必须是: ${validSubtypes.join(', ')}`, 400);
    }
    // PDF 合并需要多个输入文件
    if (subtype === 'pdf-merge') {
        if (!inputPaths || !Array.isArray(inputPaths) || inputPaths.length < 2) {
            return (0, response_1.error)(res, 'PDF 合并至少需要 2 个输入文件', 400);
        }
    }
    else {
        if (!inputPath) {
            return (0, response_1.error)(res, 'inputPath 不能为空', 400);
        }
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        // 根据子类型确定输出格式
        const outputFormatMap = {
            'word-to-pdf': 'pdf',
            'excel-to-csv': 'csv',
            'excel-to-word': 'docx',
            'pdf-merge': 'pdf',
            'pdf-split': 'pdf'
        };
        const task = tasksService.createTask({
            type: 'document',
            fileName: fileName || (subtype === 'pdf-merge' ? 'merged.pdf' : 'document'),
            fileSize: 0,
            inputPath: subtype === 'pdf-merge' ? inputPaths.join(',') : inputPath,
            inputFormat: inputFormat || '',
            outputFormat: outputFormatMap[subtype],
            config: {
                subtype,
                ...config
            },
            userId
        });
        return (0, response_1.success)(res, task, '文档转换任务创建成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '创建任务失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/document/merge-pdf
 *
 * 快捷接口：合并 PDF
 *
 * @body {inputPaths, outputName}
 * @returns 任务信息
 */
router.post('/merge-pdf', (req, res) => {
    const { inputPaths, outputName } = req.body;
    if (!inputPaths || !Array.isArray(inputPaths) || inputPaths.length < 2) {
        return (0, response_1.error)(res, 'inputPaths 必须是至少 2 个文件路径的数组', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.createTask({
            type: 'document',
            fileName: outputName || 'merged.pdf',
            fileSize: 0,
            inputPath: inputPaths.join(','),
            inputFormat: 'pdf',
            outputFormat: 'pdf',
            config: {
                subtype: 'pdf-merge',
                pdfMerge: { inputPaths }
            },
            userId
        });
        return (0, response_1.success)(res, task, 'PDF 合并任务创建成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '创建任务失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/document/split-pdf
 *
 * 快捷接口：拆分 PDF
 *
 * @body {inputPath, mode, pages, ranges}
 * @returns 任务信息
 */
router.post('/split-pdf', (req, res) => {
    const { inputPath, mode, pages, ranges } = req.body;
    if (!inputPath) {
        return (0, response_1.error)(res, 'inputPath 不能为空', 400);
    }
    if (!mode || !['page', 'range', 'all'].includes(mode)) {
        return (0, response_1.error)(res, 'mode 必须是 page、range 或 all', 400);
    }
    if (mode === 'page' && (!pages || !Array.isArray(pages))) {
        return (0, response_1.error)(res, 'page 模式需要提供 pages 数组', 400);
    }
    if (mode === 'range' && (!ranges || !Array.isArray(ranges))) {
        return (0, response_1.error)(res, 'range 模式需要提供 ranges 数组', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.createTask({
            type: 'document',
            fileName: 'split.pdf',
            fileSize: 0,
            inputPath,
            inputFormat: 'pdf',
            outputFormat: 'pdf',
            config: {
                subtype: 'pdf-split',
                pdfSplit: { mode, pages, ranges }
            },
            userId
        });
        return (0, response_1.success)(res, task, 'PDF 拆分任务创建成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '创建任务失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/document/word-to-pdf
 *
 * 快捷接口：Word 转 PDF
 *
 * @body {inputPath, format}
 * @returns 任务信息
 */
router.post('/word-to-pdf', (req, res) => {
    const { inputPath, format } = req.body;
    if (!inputPath) {
        return (0, response_1.error)(res, 'inputPath 不能为空', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.createTask({
            type: 'document',
            fileName: inputPath.split('/').pop() || 'document.pdf',
            fileSize: 0,
            inputPath,
            inputFormat: inputPath.split('.').pop() || 'docx',
            outputFormat: 'pdf',
            config: {
                subtype: 'word-to-pdf',
                wordToPdf: { format: format || 'pdf' }
            },
            userId
        });
        return (0, response_1.success)(res, task, 'Word 转 PDF 任务创建成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '创建任务失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/document/excel-to-csv
 *
 * 快捷接口：Excel 转 CSV
 *
 * @body {inputPath, sheet, delimiter, encoding}
 * @returns 任务信息
 */
router.post('/excel-to-csv', (req, res) => {
    const { inputPath, sheet, delimiter, encoding } = req.body;
    if (!inputPath) {
        return (0, response_1.error)(res, 'inputPath 不能为空', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.createTask({
            type: 'document',
            fileName: inputPath.split('/').pop()?.replace(/\.(xlsx|xls)$/, '.csv') || 'output.csv',
            fileSize: 0,
            inputPath,
            inputFormat: inputPath.split('.').pop() || 'xlsx',
            outputFormat: 'csv',
            config: {
                subtype: 'excel-to-csv',
                excelToCsv: { sheet, delimiter: delimiter || ',', encoding: encoding || 'utf-8' }
            },
            userId
        });
        return (0, response_1.success)(res, task, 'Excel 转 CSV 任务创建成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '创建任务失败';
        return (0, response_1.error)(res, message, 400);
    }
});
/**
 * POST /api/document/excel-to-word
 *
 * 快捷接口：Excel 转 Word
 *
 * @body {inputPath, sheet}
 * @returns 任务信息
 */
router.post('/excel-to-word', (req, res) => {
    const { inputPath, sheet } = req.body;
    if (!inputPath) {
        return (0, response_1.error)(res, 'inputPath 不能为空', 400);
    }
    try {
        const userId = (0, auth_1.requireUserId)(req);
        const task = tasksService.createTask({
            type: 'document',
            fileName: inputPath.split('/').pop()?.replace(/\.(xlsx|xls)$/, '.docx') || 'output.docx',
            fileSize: 0,
            inputPath,
            inputFormat: inputPath.split('.').pop() || 'xlsx',
            outputFormat: 'docx',
            config: {
                subtype: 'excel-to-word',
                excelToCsv: { sheet } // 复用 sheet 配置
            },
            userId
        });
        return (0, response_1.success)(res, task, 'Excel 转 Word 任务创建成功');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '创建任务失败';
        return (0, response_1.error)(res, message, 400);
    }
});
exports.default = router;
//# sourceMappingURL=document.js.map