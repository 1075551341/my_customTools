"use strict";
/**
 * 文档编码器注册中心
 *
 * 管理和注册所有可用的文档编码器
 *
 * 功能说明：
 * - 提供编码器注册和查询接口
 * - 根据名称或子类型获取编码器实例
 * - 支持动态添加新编码器
 *
 * @module encoders/document/index
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelToWordEncoder = exports.ExcelToCsvEncoder = exports.WordToPdfEncoder = exports.PdfSplitEncoder = exports.PdfMergeEncoder = void 0;
exports.registerEncoder = registerEncoder;
exports.getEncoder = getEncoder;
exports.hasEncoder = hasEncoder;
exports.getAllEncoders = getAllEncoders;
exports.getEncoderSubtypes = getEncoderSubtypes;
exports.getSupportedDocumentFormats = getSupportedDocumentFormats;
exports.getEncoderByFormats = getEncoderByFormats;
exports.transcodeDocument = transcodeDocument;
exports.initDefaultEncoders = initDefaultEncoders;
const pdf_merge_1 = __importDefault(require("./pdf-merge"));
exports.PdfMergeEncoder = pdf_merge_1.default;
const pdf_split_1 = __importDefault(require("./pdf-split"));
exports.PdfSplitEncoder = pdf_split_1.default;
const word_to_pdf_1 = __importDefault(require("./word-to-pdf"));
exports.WordToPdfEncoder = word_to_pdf_1.default;
const excel_to_csv_1 = __importDefault(require("./excel-to-csv"));
exports.ExcelToCsvEncoder = excel_to_csv_1.default;
const excel_to_word_1 = __importDefault(require("./excel-to-word"));
exports.ExcelToWordEncoder = excel_to_word_1.default;
/**
 * 编码器映射表
 *
 * key: 编码器子类型
 * value: 编码器实例
 */
const encoders = new Map();
/**
 * 注册编码器
 *
 * @param encoder - 编码器实例
 */
function registerEncoder(encoder) {
    encoders.set(encoder.subtype, encoder);
}
/**
 * 获取编码器
 *
 * @param subtype - 编码器子类型
 * @returns 编码器实例或 undefined
 */
function getEncoder(subtype) {
    return encoders.get(subtype);
}
/**
 * 检查编码器是否存在
 *
 * @param subtype - 编码器子类型
 * @returns 是否存在
 */
function hasEncoder(subtype) {
    return encoders.has(subtype);
}
/**
 * 获取所有编码器信息
 *
 * @returns 编码器信息列表
 */
function getAllEncoders() {
    const list = [];
    encoders.forEach(encoder => {
        list.push(encoder.getInfo());
    });
    return list;
}
/**
 * 获取所有编码器子类型
 *
 * @returns 编码器子类型列表
 */
function getEncoderSubtypes() {
    return Array.from(encoders.keys());
}
/**
 * 获取支持的文档格式
 */
function getSupportedDocumentFormats() {
    const inputFormats = new Set();
    const outputFormats = new Set();
    encoders.forEach(encoder => {
        encoder.inputFormats.forEach(f => inputFormats.add(f));
        outputFormats.add(encoder.outputFormat);
    });
    return {
        input: Array.from(inputFormats),
        output: Array.from(outputFormats)
    };
}
/**
 * 根据输入输出格式获取编码器
 *
 * @param inputFormat - 输入格式
 * @param outputFormat - 输出格式
 * @returns 编码器实例或 undefined
 */
function getEncoderByFormats(inputFormat, outputFormat) {
    let matched;
    encoders.forEach(encoder => {
        if (encoder.supportsFormat(inputFormat) && encoder.outputFormat === outputFormat) {
            matched = encoder;
        }
    });
    return matched;
}
/**
 * 执行文档转码
 *
 * @param subtype - 编码器子类型
 * @param inputPath - 输入路径
 * @param outputPath - 输出路径
 * @param config - 转码配置
 * @param onProgress - 进度回调
 * @returns 转码结果
 */
async function transcodeDocument(subtype, inputPath, outputPath, config, onProgress) {
    const encoder = getEncoder(subtype);
    if (!encoder) {
        throw new Error(`不支持的文档转码类型: ${subtype}`);
    }
    return encoder.transcode(inputPath, outputPath, config, onProgress);
}
/**
 * 初始化默认编码器
 *
 * 注册内置的文档编码器
 */
function initDefaultEncoders() {
    registerEncoder(pdf_merge_1.default);
    registerEncoder(pdf_split_1.default);
    registerEncoder(word_to_pdf_1.default);
    registerEncoder(excel_to_csv_1.default);
    registerEncoder(excel_to_word_1.default);
}
// 自动初始化默认编码器
initDefaultEncoders();
//# sourceMappingURL=index.js.map