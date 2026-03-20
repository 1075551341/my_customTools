/**
 * 上传服务模块
 *
 * 提供文件分片上传、合并、进度查询等功能
 *
 * @module services/upload
 */
import type { UploadSession, TaskType } from '../types';
/**
 * 创建上传会话请求
 */
export interface CreateSessionParams {
    fileName: string;
    fileSize: number;
    type: TaskType;
    userId: string;
}
/**
 * 上传分片请求
 */
export interface UploadChunkParams {
    uploadId: string;
    chunkIndex: number;
    chunkData: Buffer;
    userId: string;
}
/**
 * 上传进度信息
 */
export interface UploadProgress {
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedSize: number;
    uploadedChunks: number;
    totalChunks: number;
    progress: number;
    isComplete: boolean;
}
/**
 * 创建上传会话
 *
 * @param params - 创建参数
 * @returns 上传会话
 * @throws 文件大小超出限制
 * @throws 文件格式不支持
 */
export declare function createSession(params: CreateSessionParams): UploadSession;
/**
 * 上传分片
 *
 * @param params - 上传参数
 * @returns 上传进度
 * @throws 上传会话不存在
 * @throws 无权限
 * @throws 分片索引无效
 */
export declare function uploadChunk(params: UploadChunkParams): UploadProgress;
/**
 * 完成上传（合并分片）
 *
 * @param uploadId - 上传ID
 * @param userId - 用户ID
 * @returns 合并后的文件路径
 * @throws 上传会话不存在
 * @throws 无权限
 * @throws 分片未上传完成
 */
export declare function completeUpload(uploadId: string, userId: string): Promise<string>;
/**
 * 获取上传进度
 *
 * @param uploadId - 上传ID
 * @returns 上传进度或null
 */
export declare function getProgress(uploadId: string): UploadProgress | null;
/**
 * 取消上传
 *
 * @param uploadId - 上传ID
 * @param userId - 用户ID
 * @throws 上传会话不存在
 * @throws 无权限
 */
export declare function cancelUpload(uploadId: string, userId: string): void;
/**
 * 获取用户的所有上传会话进度
 *
 * @param userId - 用户ID
 * @returns 上传进度列表
 */
export declare function getUserUploads(userId: string): UploadProgress[];
/**
 * 清理过期的上传会话
 *
 * @returns 清理的会话数量
 */
export declare function cleanExpiredSessions(): number;
/**
 * 验证文件是否已上传完成
 *
 * @param uploadId - 上传ID
 * @returns 是否完成
 */
export declare function isUploadComplete(uploadId: string): boolean;
//# sourceMappingURL=upload.d.ts.map