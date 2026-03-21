"use strict";
/**
 * 消息推送数据持久化模块
 *
 * 使用 JSON 文件存储消息数据
 *
 * @module db/messages
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = createMessage;
exports.findAll = findAll;
exports.findById = findById;
exports.findByUserId = findByUserId;
exports.findPaginated = findPaginated;
exports.getUnreadCount = getUnreadCount;
exports.getLatestMessages = getLatestMessages;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.deleteMessage = deleteMessage;
exports.clearAll = clearAll;
exports.cleanOldMessages = cleanOldMessages;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
/**
 * 消息数据文件路径
 */
const MESSAGES_FILE = path_1.default.join(config_1.default.storage.dataDir, "messages.json");
/**
 * 确保数据目录存在
 */
function ensureDataDir() {
    const dataDir = config_1.default.storage.dataDir;
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
}
/**
 * 读取消息数据
 *
 * @returns 消息数据对象
 */
function readMessagesData() {
    ensureDataDir();
    if (!fs_1.default.existsSync(MESSAGES_FILE)) {
        const initialData = {
            messages: [],
            lastUpdated: new Date().toISOString(),
        };
        fs_1.default.writeFileSync(MESSAGES_FILE, JSON.stringify(initialData, null, 2), "utf-8");
        return initialData;
    }
    try {
        const content = fs_1.default.readFileSync(MESSAGES_FILE, "utf-8");
        return JSON.parse(content);
    }
    catch {
        return {
            messages: [],
            lastUpdated: new Date().toISOString(),
        };
    }
}
/**
 * 写入消息数据
 *
 * @param data - 消息数据对象
 */
function writeMessagesData(data) {
    ensureDataDir();
    data.lastUpdated = new Date().toISOString();
    fs_1.default.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2), "utf-8");
}
/**
 * 生成唯一消息 ID
 *
 * @returns 唯一消息 ID
 */
function generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * 创建消息
 *
 * @param data - 消息数据（不含 ID 和 createdAt）
 * @returns 创建的消息
 */
function createMessage(data) {
    const messagesData = readMessagesData();
    const message = {
        ...data,
        id: generateMessageId(),
        createdAt: new Date().toISOString(),
    };
    messagesData.messages.push(message);
    writeMessagesData(messagesData);
    return message;
}
/**
 * 获取所有消息
 *
 * @returns 消息列表
 */
function findAll() {
    return readMessagesData().messages;
}
/**
 * 根据 ID 查找消息
 *
 * @param id - 消息 ID
 * @returns 消息对象或 undefined
 */
function findById(id) {
    return findAll().find((msg) => msg.id === id);
}
/**
 * 根据用户 ID 查找消息
 *
 * @param userId - 用户 ID
 * @returns 消息列表
 */
function findByUserId(userId) {
    return findAll().filter((msg) => msg.userId === userId);
}
/**
 * 分页查询消息
 *
 * @param params - 查询参数
 * @returns 分页结果
 */
function findPaginated(params) {
    let messages = findByUserId(params.userId);
    // 过滤
    if (params.type !== undefined) {
        messages = messages.filter((m) => m.type === params.type);
    }
    if (params.isRead !== undefined) {
        messages = messages.filter((m) => m.isRead === params.isRead);
    }
    // 按创建时间倒序
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = messages.length;
    const start = (params.page - 1) * params.pageSize;
    const list = messages.slice(start, start + params.pageSize);
    return { list, total };
}
/**
 * 获取用户未读消息数量
 *
 * @param userId - 用户 ID
 * @returns 未读消息数量
 */
function getUnreadCount(userId) {
    return findByUserId(userId).filter((m) => !m.isRead).length;
}
/**
 * 获取用户最新消息
 *
 * @param userId - 用户 ID
 * @param limit - 数量限制
 * @returns 最新消息列表
 */
function getLatestMessages(userId, limit = 5) {
    const messages = findByUserId(userId);
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return messages.slice(0, limit);
}
/**
 * 标记消息为已读
 *
 * @param messageId - 消息 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 是否成功
 */
function markAsRead(messageId, userId) {
    const messagesData = readMessagesData();
    const index = messagesData.messages.findIndex((m) => m.id === messageId && m.userId === userId);
    if (index === -1) {
        return false;
    }
    messagesData.messages[index].isRead = true;
    messagesData.messages[index].readAt = new Date().toISOString();
    writeMessagesData(messagesData);
    return true;
}
/**
 * 标记用户全部消息为已读
 *
 * @param userId - 用户 ID
 * @returns 标记为已读的消息数量
 */
function markAllAsRead(userId) {
    const messagesData = readMessagesData();
    let count = 0;
    messagesData.messages.forEach((msg) => {
        if (msg.userId === userId && !msg.isRead) {
            msg.isRead = true;
            msg.readAt = new Date().toISOString();
            count++;
        }
    });
    if (count > 0) {
        writeMessagesData(messagesData);
    }
    return count;
}
/**
 * 删除消息
 *
 * @param messageId - 消息 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 是否成功
 */
function deleteMessage(messageId, userId) {
    const messagesData = readMessagesData();
    const originalLength = messagesData.messages.length;
    messagesData.messages = messagesData.messages.filter((m) => !(m.id === messageId && m.userId === userId));
    if (messagesData.messages.length !== originalLength) {
        writeMessagesData(messagesData);
        return true;
    }
    return false;
}
/**
 * 清空用户所有消息
 *
 * @param userId - 用户 ID
 * @returns 删除的消息数量
 */
function clearAll(userId) {
    const messagesData = readMessagesData();
    const originalLength = messagesData.messages.length;
    messagesData.messages = messagesData.messages.filter((m) => m.userId !== userId);
    const deleted = originalLength - messagesData.messages.length;
    if (deleted > 0) {
        writeMessagesData(messagesData);
    }
    return deleted;
}
/**
 * 清理旧消息
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的消息数量
 */
function cleanOldMessages(maxAgeDays = 30) {
    const messagesData = readMessagesData();
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const originalLength = messagesData.messages.length;
    messagesData.messages = messagesData.messages.filter((msg) => {
        const age = now - new Date(msg.createdAt).getTime();
        return age < maxAgeMs;
    });
    if (messagesData.messages.length !== originalLength) {
        writeMessagesData(messagesData);
    }
    return originalLength - messagesData.messages.length;
}
//# sourceMappingURL=messages.js.map