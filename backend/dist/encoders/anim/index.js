"use strict";
/**
 * 动图编码器注册中心
 *
 * 管理和注册动图编码器
 *
 * @module encoders/anim/index
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
exports.transcodeFromImages = exports.AnimEncoder = void 0;
exports.getAnimEncoder = getAnimEncoder;
exports.getSupportedAnimFormats = getSupportedAnimFormats;
exports.supportsAnimFormat = supportsAnimFormat;
const gif_1 = __importStar(require("./gif"));
Object.defineProperty(exports, "AnimEncoder", { enumerable: true, get: function () { return gif_1.AnimEncoder; } });
Object.defineProperty(exports, "transcodeFromImages", { enumerable: true, get: function () { return gif_1.transcodeFromImages; } });
/**
 * 获取动图编码器实例
 *
 * @returns 动图编码器实例
 */
function getAnimEncoder() {
    return gif_1.default;
}
/**
 * 获取支持的动图格式列表
 *
 * @returns 格式信息列表
 */
function getSupportedAnimFormats() {
    return gif_1.default.getSupportedFormats();
}
/**
 * 检查动图格式是否支持
 *
 * @param format - 格式名称
 * @returns 是否支持
 */
function supportsAnimFormat(format) {
    return gif_1.default.supportsFormat(format);
}
// 默认导出编码器实例
exports.default = gif_1.default;
//# sourceMappingURL=index.js.map