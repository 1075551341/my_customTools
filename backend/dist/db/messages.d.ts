/**
 * 消息推送数据持久化模块
 *
 * 使用 JSON 文件存储消息数据
 *
 * @module db/messages
 */
import type { Message } from "../types";
/**
 * 创建消息
 *
 * @param data - 消息数据（不含 ID 和 createdAt）
 * @returns 创建的消息
 */
export declare function createMessage(data: Omit<Message, "id" | "createdAt">): Message;
/**
 * 获取所有消息
 *
 * @returns 消息列表
 */
export declare function findAll(): Message[];
/**
 * 根据 ID 查找消息
 *
 * @param id - 消息 ID
 * @returns 消息对象或 undefined
 */
export declare function findById(id: string): Message | undefined;
/**
 * 根据用户 ID 查找消息
 *
 * @param userId - 用户 ID
 * @returns 消息列表
 */
export declare function findByUserId(userId: string): Message[];
/**
 * 分页查询消息
 *
 * @param params - 查询参数
 * @returns 分页结果
 */
export declare function findPaginated(params: {
    userId: string;
    type?: "normal" | "todo";
    isRead?: boolean;
    page: number;
    pageSize: number;
}): {
    list: Message[];
    total: number;
};
/**
 * 获取用户未读消息数量
 *
 * @param userId - 用户 ID
 * @returns 未读消息数量
 */
export declare function getUnreadCount(userId: string): number;
/**
 * 获取用户最新消息
 *
 * @param userId - 用户 ID
 * @param limit - 数量限制
 * @returns 最新消息列表
 */
export declare function getLatestMessages(userId: string, limit?: number): Message[];
/**
 * 标记消息为已读
 *
 * @param messageId - 消息 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 是否成功
 */
export declare function markAsRead(messageId: string, userId: string): boolean;
/**
 * 标记用户全部消息为已读
 *
 * @param userId - 用户 ID
 * @returns 标记为已读的消息数量
 */
export declare function markAllAsRead(userId: string): number;
/**
 * 删除消息
 *
 * @param messageId - 消息 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 是否成功
 */
export declare function deleteMessage(messageId: string, userId: string): boolean;
/**
 * 清空用户所有消息
 *
 * @param userId - 用户 ID
 * @returns 删除的消息数量
 */
export declare function clearAll(userId: string): number;
/**
 * 清理旧消息
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的消息数量
 */
export declare function cleanOldMessages(maxAgeDays?: number): number;
//# sourceMappingURL=messages.d.ts.map