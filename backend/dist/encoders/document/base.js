"use strict";
/**
 * 文档编码器基类
 *
 * 提供文档格式转换的通用接口和基础功能
 *
 * @module encoders/document/base
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentEncoder = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 文档编码器抽象基类
 */
class DocumentEncoder {
    /**
     * 执行文档转码
     *
     * @param inputPath - 输入文件路径（单个或多个）
     * @param outputPath - 输出文件路径
     * @param config - 转码配置
     * @param onProgress - 进度回调
     * @returns 转码结果
     */
    async transcode(inputPath, outputPath, config, onProgress) {
        // 验证输入文件
        if (Array.isArray(inputPath)) {
            for (const p of inputPath) {
                if (!fs_1.default.existsSync(p)) {
                    throw new Error(`输入文件不存在: ${p}`);
                }
            }
        }
        else {
            if (!fs_1.default.existsSync(inputPath)) {
                throw new Error(`输入文件不存在: ${inputPath}`);
            }
        }
        // 确保输出目录存在
        const outputDir = path_1.default.dirname(outputPath);
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        // 调用子类实现
        return this.doTranscode(inputPath, outputPath, config, onProgress);
    }
    /**
     * 检查是否支持指定格式
     *
     * @param format - 格式名称
     * @returns 是否支持
     */
    supportsFormat(format) {
        return this.inputFormats.includes(format.toLowerCase());
    }
    /**
     * 获取编码器信息
     */
    getInfo() {
        return {
            name: this.name,
            subtype: this.subtype,
            inputFormats: this.inputFormats,
            outputFormat: this.outputFormat,
            description: this.description
        };
    }
}
exports.DocumentEncoder = DocumentEncoder;
//# sourceMappingURL=base.js.map