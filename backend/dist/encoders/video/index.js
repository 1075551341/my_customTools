"use strict";
/**
 * 视频编码器注册中心
 *
 * 管理和注册所有可用的视频编码器
 *
 * 功能说明：
 * - 提供编码器注册和查询接口
 * - 根据名称或编码器获取编码器实例
 * - 支持动态添加新编码器
 *
 * @module encoders/video/index
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VP9Encoder = exports.H265Encoder = exports.H264Encoder = void 0;
exports.registerEncoder = registerEncoder;
exports.getEncoder = getEncoder;
exports.hasEncoder = hasEncoder;
exports.getAllEncoders = getAllEncoders;
exports.getEncoderNames = getEncoderNames;
exports.getRecommendedEncoder = getRecommendedEncoder;
exports.initDefaultEncoders = initDefaultEncoders;
const h264_1 = __importDefault(require("./h264"));
exports.H264Encoder = h264_1.default;
const h265_1 = __importDefault(require("./h265"));
exports.H265Encoder = h265_1.default;
const vp9_1 = __importDefault(require("./vp9"));
exports.VP9Encoder = vp9_1.default;
/**
 * 编码器映射表
 *
 * key: 编码器名称
 * value: 编码器实例
 */
const encoders = new Map();
/**
 * 注册编码器
 *
 * @param encoder - 编码器实例
 */
function registerEncoder(encoder) {
    encoders.set(encoder.name, encoder);
}
/**
 * 获取编码器
 *
 * @param name - 编码器名称
 * @returns 编码器实例或 undefined
 */
function getEncoder(name) {
    return encoders.get(name);
}
/**
 * 检查编码器是否存在
 *
 * @param name - 编码器名称
 * @returns 是否存在
 */
function hasEncoder(name) {
    return encoders.has(name);
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
 * 获取所有编码器名称
 *
 * @returns 编码器名称列表
 */
function getEncoderNames() {
    return Array.from(encoders.keys());
}
/**
 * 根据输出格式获取推荐的编码器
 *
 * @param format - 输出格式
 * @returns 推荐的编码器名称
 */
function getRecommendedEncoder(format) {
    const formatEncoderMap = {
        mp4: 'h264',
        webm: 'vp9',
        mkv: 'h265'
    };
    return formatEncoderMap[format.toLowerCase()] || 'h264';
}
/**
 * 初始化默认编码器
 *
 * 注册内置的视频编码器
 */
function initDefaultEncoders() {
    registerEncoder(h264_1.default);
    registerEncoder(h265_1.default);
    registerEncoder(vp9_1.default);
}
// 自动初始化默认编码器
initDefaultEncoders();
//# sourceMappingURL=index.js.map