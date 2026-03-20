/**
 * 上传会话数据持久化模块
 *
 * 管理分片上传会话状态
 *
 * @module db/uploadSessions
 */
import type { UploadSession, TaskType } from '../types';
/**
 * 获取所有上传会话
 *
 * @returns 上传会话列表
 */
export declare function findAll(): UploadSession[];
/**
 * 根据上传ID查找会话
 *
 * @param uploadId - 上传ID
 * @returns 上传会话或undefined
 */
export declare function findById(uploadId: string): UploadSession | undefined;
/**
 * 创建新的上传会话
 *
 * @param params - 会话参数
 * @returns 创建的上传会话
 */
export declare function create(params: {
    fileName: string;
    fileSize: number;
    totalChunks: number;
    type: TaskType;
    userId: string;
}): UploadSession;
/**
 * 更新上传会话
 *
 * @param uploadId - 上传ID
 * @param updates - 要更新的字段
 * @returns 更新后的会话或undefined
 */
export declare function update(uploadId: string, updates: Partial<Omit<UploadSession, 'uploadId' | 'createdAt'>>): UploadSession | undefined;
/**
 * 记录已上传的分片
 *
 * @param uploadId - 上传ID
 * @param chunkIndex - 分片索引
 * @returns 更新后的会话或undefined
 */
export declare function addUploadedChunk(uploadId: string, chunkIndex: number): UploadSession | undefined;
/**
 * 删除上传会话
 *
 * @param uploadId - 上传ID
 * @returns 是否删除成功
 */
export declare function remove(uploadId: string): boolean;
/**
 * 清理过期的上传会话
 *
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的会话数量
 */
export declare function cleanExpired(maxAgeHours?: number): number;
/**
 * 获取用户的所有上传会话
 *
 * @param userId - 用户ID
 * @returns 上传会话列表
 */
export declare function findByUserId(userId: string): UploadSession[];
/**
 * 检查上传会话是否完成
 *
 * @param uploadId - 上传ID
 * @returns 是否完成
 */
export declare function isComplete(uploadId: string): boolean;
//# sourceMappingURL=uploadSessions.d.ts.map