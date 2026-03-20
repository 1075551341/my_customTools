"use strict";
/**
 * 文件存储工具模块
 *
 * 提供文件和目录管理功能
 *
 * @module utils/storage
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDir = ensureDir;
exports.ensureStorageDirs = ensureStorageDirs;
exports.getChunksDir = getChunksDir;
exports.getUserUploadDir = getUserUploadDir;
exports.getUserOutputDir = getUserOutputDir;
exports.getChunkPath = getChunkPath;
exports.getTempFilePath = getTempFilePath;
exports.mergeChunks = mergeChunks;
exports.deleteFile = deleteFile;
exports.getFileSize = getFileSize;
exports.fileExists = fileExists;
exports.getFileExtension = getFileExtension;
exports.generateUniqueFileName = generateUniqueFileName;
exports.cleanOldFiles = cleanOldFiles;
exports.getDirSize = getDirSize;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("./logger"));
/**
 * 确保目录存在
 *
 * @param dirPath - 目录路径
 */
function ensureDir(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        logger_1.default.debug('创建目录', { path: dirPath });
    }
}
/**
 * 确保所有必要的存储目录存在
 */
function ensureStorageDirs() {
    ensureDir(config_1.default.storage.uploadDir);
    ensureDir(config_1.default.storage.outputDir);
    ensureDir(config_1.default.storage.dataDir);
    ensureDir(config_1.default.storage.logDir);
    ensureDir(getChunksDir());
    logger_1.default.info('存储目录初始化完成', {
        upload: config_1.default.storage.uploadDir,
        output: config_1.default.storage.outputDir,
        chunks: getChunksDir()
    });
}
/**
 * 获取分片存储目录
 *
 * @returns 分片目录路径
 */
function getChunksDir() {
    return path_1.default.join(config_1.default.storage.uploadDir, 'chunks');
}
/**
 * 获取用户上传目录
 *
 * @param userId - 用户ID
 * @returns 用户上传目录路径
 */
function getUserUploadDir(userId) {
    const userDir = path_1.default.join(config_1.default.storage.uploadDir, userId);
    ensureDir(userDir);
    return userDir;
}
/**
 * 获取用户输出目录
 *
 * @param userId - 用户ID
 * @returns 用户输出目录路径
 */
function getUserOutputDir(userId) {
    const userDir = path_1.default.join(config_1.default.storage.outputDir, userId);
    ensureDir(userDir);
    return userDir;
}
/**
 * 获取分片文件路径
 *
 * @param uploadId - 上传ID
 * @param chunkIndex - 分片索引
 * @returns 分片文件路径
 */
function getChunkPath(uploadId, chunkIndex) {
    const chunksDir = getChunksDir();
    ensureDir(chunksDir);
    return path_1.default.join(chunksDir, `${uploadId}_${chunkIndex}`);
}
/**
 * 获取上传临时文件路径
 *
 * @param uploadId - 上传ID
 * @param fileName - 文件名
 * @returns 临时文件路径
 */
function getTempFilePath(uploadId, fileName) {
    const tempDir = path_1.default.join(config_1.default.storage.uploadDir, 'temp');
    ensureDir(tempDir);
    return path_1.default.join(tempDir, `${uploadId}_${fileName}`);
}
/**
 * 合并分片文件
 *
 * @param uploadId - 上传ID
 * @param totalChunks - 总分片数
 * @param outputPath - 输出文件路径
 * @returns 合并是否成功
 */
async function mergeChunks(uploadId, totalChunks, outputPath) {
    try {
        const chunksDir = getChunksDir();
        // 确保输出目录存在
        const outputDir = path_1.default.dirname(outputPath);
        ensureDir(outputDir);
        // 创建写入流
        const writeStream = fs_1.default.createWriteStream(outputPath);
        // 按顺序合并分片
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path_1.default.join(chunksDir, `${uploadId}_${i}`);
            if (!fs_1.default.existsSync(chunkPath)) {
                logger_1.default.error('分片文件不存在', { uploadId, chunkIndex: i });
                writeStream.close();
                return false;
            }
            const chunkData = fs_1.default.readFileSync(chunkPath);
            writeStream.write(chunkData);
        }
        writeStream.close();
        // 清理分片文件
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path_1.default.join(chunksDir, `${uploadId}_${i}`);
            fs_1.default.unlinkSync(chunkPath);
        }
        logger_1.default.info('分片合并完成', { uploadId, outputPath });
        return true;
    }
    catch (error) {
        logger_1.default.error('分片合并失败', { uploadId, error: error.message });
        return false;
    }
}
/**
 * 删除文件
 *
 * @param filePath - 文件路径
 * @returns 是否删除成功
 */
function deleteFile(filePath) {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (error) {
        logger_1.default.error('删除文件失败', { path: filePath, error: error.message });
        return false;
    }
}
/**
 * 获取文件大小
 *
 * @param filePath - 文件路径
 * @returns 文件大小（字节），不存在返回 -1
 */
function getFileSize(filePath) {
    try {
        const stats = fs_1.default.statSync(filePath);
        return stats.size;
    }
    catch {
        return -1;
    }
}
/**
 * 检查文件是否存在
 *
 * @param filePath - 文件路径
 * @returns 是否存在
 */
function fileExists(filePath) {
    return fs_1.default.existsSync(filePath);
}
/**
 * 获取文件扩展名
 *
 * @param fileName - 文件名
 * @returns 扩展名（小写，不带点）
 */
function getFileExtension(fileName) {
    const ext = path_1.default.extname(fileName).toLowerCase();
    return ext.startsWith('.') ? ext.substring(1) : ext;
}
/**
 * 生成唯一文件名
 *
 * @param originalName - 原始文件名
 * @returns 唯一文件名
 */
function generateUniqueFileName(originalName) {
    const ext = getFileExtension(originalName);
    const baseName = path_1.default.basename(originalName, path_1.default.extname(originalName));
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${baseName}_${timestamp}_${random}.${ext}`;
}
/**
 * 清理目录中的旧文件
 *
 * @param dirPath - 目录路径
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的文件数量
 */
function cleanOldFiles(dirPath, maxAgeHours = 24) {
    if (!fs_1.default.existsSync(dirPath)) {
        return 0;
    }
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let cleanedCount = 0;
    const files = fs_1.default.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path_1.default.join(dirPath, file);
        try {
            const stats = fs_1.default.statSync(filePath);
            const age = now - stats.mtime.getTime();
            if (age > maxAgeMs) {
                if (stats.isDirectory()) {
                    fs_1.default.rmSync(filePath, { recursive: true });
                }
                else {
                    fs_1.default.unlinkSync(filePath);
                }
                cleanedCount++;
            }
        }
        catch (error) {
            logger_1.default.warn('清理文件失败', { path: filePath, error: error.message });
        }
    }
    return cleanedCount;
}
/**
 * 获取目录大小
 *
 * @param dirPath - 目录路径
 * @returns 目录大小（字节）
 */
function getDirSize(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        return 0;
    }
    let totalSize = 0;
    const files = fs_1.default.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path_1.default.join(dirPath, file);
        const stats = fs_1.default.statSync(filePath);
        if (stats.isDirectory()) {
            totalSize += getDirSize(filePath);
        }
        else {
            totalSize += stats.size;
        }
    }
    return totalSize;
}
//# sourceMappingURL=storage.js.map