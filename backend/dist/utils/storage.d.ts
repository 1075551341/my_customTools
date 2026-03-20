/**
 * 文件存储工具模块
 *
 * 提供文件和目录管理功能
 *
 * @module utils/storage
 */
/**
 * 确保目录存在
 *
 * @param dirPath - 目录路径
 */
export declare function ensureDir(dirPath: string): void;
/**
 * 确保所有必要的存储目录存在
 */
export declare function ensureStorageDirs(): void;
/**
 * 获取分片存储目录
 *
 * @returns 分片目录路径
 */
export declare function getChunksDir(): string;
/**
 * 获取用户上传目录
 *
 * @param userId - 用户ID
 * @returns 用户上传目录路径
 */
export declare function getUserUploadDir(userId: string): string;
/**
 * 获取用户输出目录
 *
 * @param userId - 用户ID
 * @returns 用户输出目录路径
 */
export declare function getUserOutputDir(userId: string): string;
/**
 * 获取分片文件路径
 *
 * @param uploadId - 上传ID
 * @param chunkIndex - 分片索引
 * @returns 分片文件路径
 */
export declare function getChunkPath(uploadId: string, chunkIndex: number): string;
/**
 * 获取上传临时文件路径
 *
 * @param uploadId - 上传ID
 * @param fileName - 文件名
 * @returns 临时文件路径
 */
export declare function getTempFilePath(uploadId: string, fileName: string): string;
/**
 * 合并分片文件
 *
 * @param uploadId - 上传ID
 * @param totalChunks - 总分片数
 * @param outputPath - 输出文件路径
 * @returns 合并是否成功
 */
export declare function mergeChunks(uploadId: string, totalChunks: number, outputPath: string): Promise<boolean>;
/**
 * 删除文件
 *
 * @param filePath - 文件路径
 * @returns 是否删除成功
 */
export declare function deleteFile(filePath: string): boolean;
/**
 * 获取文件大小
 *
 * @param filePath - 文件路径
 * @returns 文件大小（字节），不存在返回 -1
 */
export declare function getFileSize(filePath: string): number;
/**
 * 检查文件是否存在
 *
 * @param filePath - 文件路径
 * @returns 是否存在
 */
export declare function fileExists(filePath: string): boolean;
/**
 * 获取文件扩展名
 *
 * @param fileName - 文件名
 * @returns 扩展名（小写，不带点）
 */
export declare function getFileExtension(fileName: string): string;
/**
 * 生成唯一文件名
 *
 * @param originalName - 原始文件名
 * @returns 唯一文件名
 */
export declare function generateUniqueFileName(originalName: string): string;
/**
 * 清理目录中的旧文件
 *
 * @param dirPath - 目录路径
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的文件数量
 */
export declare function cleanOldFiles(dirPath: string, maxAgeHours?: number): number;
/**
 * 获取目录大小
 *
 * @param dirPath - 目录路径
 * @returns 目录大小（字节）
 */
export declare function getDirSize(dirPath: string): number;
//# sourceMappingURL=storage.d.ts.map