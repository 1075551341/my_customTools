"use strict";
/**
 * 编码器总入口
 *
 * 统一导出所有编码器模块
 *
 * @module encoders/index
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelToWordEncoder = exports.ExcelToCsvEncoder = exports.WordToPdfEncoder = exports.PdfSplitEncoder = exports.PdfMergeEncoder = exports.initDefaultDocumentEncoders = exports.transcodeDocument = exports.getDocumentEncoderByFormats = exports.getSupportedDocumentFormats = exports.getDocumentEncoderSubtypes = exports.getAllDocumentEncoders = exports.hasDocumentEncoder = exports.getDocumentEncoder = exports.registerDocumentEncoder = exports.getSupportedAnimFormats = exports.transcodeFromImages = exports.animEncoder = exports.supportsImageFormat = exports.getSupportedImageFormats = exports.getImageEncoder = exports.VP9Encoder = exports.H265Encoder = exports.H264Encoder = exports.initDefaultVideoEncoders = exports.getRecommendedEncoder = exports.getVideoEncoderNames = exports.getAllVideoEncoders = exports.hasVideoEncoder = exports.getVideoEncoder = exports.registerVideoEncoder = void 0;
exports.getAllEncoderInfo = getAllEncoderInfo;
// 视频编码器（显式导出避免命名冲突）
var video_1 = require("./video");
Object.defineProperty(exports, "registerVideoEncoder", { enumerable: true, get: function () { return video_1.registerEncoder; } });
Object.defineProperty(exports, "getVideoEncoder", { enumerable: true, get: function () { return video_1.getEncoder; } });
Object.defineProperty(exports, "hasVideoEncoder", { enumerable: true, get: function () { return video_1.hasEncoder; } });
Object.defineProperty(exports, "getAllVideoEncoders", { enumerable: true, get: function () { return video_1.getAllEncoders; } });
Object.defineProperty(exports, "getVideoEncoderNames", { enumerable: true, get: function () { return video_1.getEncoderNames; } });
Object.defineProperty(exports, "getRecommendedEncoder", { enumerable: true, get: function () { return video_1.getRecommendedEncoder; } });
Object.defineProperty(exports, "initDefaultVideoEncoders", { enumerable: true, get: function () { return video_1.initDefaultEncoders; } });
Object.defineProperty(exports, "H264Encoder", { enumerable: true, get: function () { return video_1.H264Encoder; } });
Object.defineProperty(exports, "H265Encoder", { enumerable: true, get: function () { return video_1.H265Encoder; } });
Object.defineProperty(exports, "VP9Encoder", { enumerable: true, get: function () { return video_1.VP9Encoder; } });
// 图片编码器
var image_1 = require("./image");
Object.defineProperty(exports, "getImageEncoder", { enumerable: true, get: function () { return image_1.getImageEncoder; } });
Object.defineProperty(exports, "getSupportedImageFormats", { enumerable: true, get: function () { return image_1.getSupportedImageFormats; } });
Object.defineProperty(exports, "supportsImageFormat", { enumerable: true, get: function () { return image_1.supportsImageFormat; } });
// 动图编码器
var anim_1 = require("./anim");
Object.defineProperty(exports, "animEncoder", { enumerable: true, get: function () { return __importDefault(anim_1).default; } });
Object.defineProperty(exports, "transcodeFromImages", { enumerable: true, get: function () { return anim_1.transcodeFromImages; } });
Object.defineProperty(exports, "getSupportedAnimFormats", { enumerable: true, get: function () { return anim_1.getSupportedAnimFormats; } });
// 文档编码器（显式导出避免命名冲突）
var document_1 = require("./document");
Object.defineProperty(exports, "registerDocumentEncoder", { enumerable: true, get: function () { return document_1.registerEncoder; } });
Object.defineProperty(exports, "getDocumentEncoder", { enumerable: true, get: function () { return document_1.getEncoder; } });
Object.defineProperty(exports, "hasDocumentEncoder", { enumerable: true, get: function () { return document_1.hasEncoder; } });
Object.defineProperty(exports, "getAllDocumentEncoders", { enumerable: true, get: function () { return document_1.getAllEncoders; } });
Object.defineProperty(exports, "getDocumentEncoderSubtypes", { enumerable: true, get: function () { return document_1.getEncoderSubtypes; } });
Object.defineProperty(exports, "getSupportedDocumentFormats", { enumerable: true, get: function () { return document_1.getSupportedDocumentFormats; } });
Object.defineProperty(exports, "getDocumentEncoderByFormats", { enumerable: true, get: function () { return document_1.getEncoderByFormats; } });
Object.defineProperty(exports, "transcodeDocument", { enumerable: true, get: function () { return document_1.transcodeDocument; } });
Object.defineProperty(exports, "initDefaultDocumentEncoders", { enumerable: true, get: function () { return document_1.initDefaultEncoders; } });
Object.defineProperty(exports, "PdfMergeEncoder", { enumerable: true, get: function () { return document_1.PdfMergeEncoder; } });
Object.defineProperty(exports, "PdfSplitEncoder", { enumerable: true, get: function () { return document_1.PdfSplitEncoder; } });
Object.defineProperty(exports, "WordToPdfEncoder", { enumerable: true, get: function () { return document_1.WordToPdfEncoder; } });
Object.defineProperty(exports, "ExcelToCsvEncoder", { enumerable: true, get: function () { return document_1.ExcelToCsvEncoder; } });
Object.defineProperty(exports, "ExcelToWordEncoder", { enumerable: true, get: function () { return document_1.ExcelToWordEncoder; } });
// 导入各模块
const videoEncoders = __importStar(require("./video"));
const imageEncoders = __importStar(require("./image"));
const animEncoders = __importStar(require("./anim"));
const documentEncoders = __importStar(require("./document"));
/**
 * 获取所有编码器信息
 *
 * @returns 所有编码器信息
 */
function getAllEncoderInfo() {
    return {
        video: videoEncoders.getAllEncoders(),
        image: imageEncoders.getSupportedImageFormats(),
        anim: animEncoders.getSupportedAnimFormats(),
        document: documentEncoders.getAllEncoders()
    };
}
//# sourceMappingURL=index.js.map