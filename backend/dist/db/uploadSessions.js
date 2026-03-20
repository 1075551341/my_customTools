"use strict";
/**
 * 上传会话数据持久化模块
 *
 * 管理分片上传会话状态
 *
 * @module db/uploadSessions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = findAll;
exports.findById = findById;
exports.create = create;
exports.update = update;
exports.addUploadedChunk = addUploadedChunk;
exports.remove = remove;
exports.cleanExpired = cleanExpired;
exports.findByUserId = findByUserId;
exports.isComplete = isComplete;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
/**
 * 上传会话数据文件路径
 */
const SESSIONS_FILE = path_1.default.join(config_1.default.storage.dataDir, 'upload-sessions.json');
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
 * 读取上传会话数据
 *
 * @returns 上传会话数据对象
 */
function readSessionsData() {
    ensureDataDir();
    if (!fs_1.default.existsSync(SESSIONS_FILE)) {
        const initialData = {
            sessions: [],
            lastUpdated: new Date().toISOString()
        };
        fs_1.default.writeFileSync(SESSIONS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
    try {
        const content = fs_1.default.readFileSync(SESSIONS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return {
            sessions: [],
            lastUpdated: new Date().toISOString()
        };
    }
}
/**
 * 写入上传会话数据
 *
 * @param data - 上传会话数据对象
 */
function writeSessionsData(data) {
    ensureDataDir();
    data.lastUpdated = new Date().toISOString();
    fs_1.default.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
/**
 * 获取所有上传会话
 *
 * @returns 上传会话列表
 */
function findAll() {
    return readSessionsData().sessions;
}
/**
 * 根据上传ID查找会话
 *
 * @param uploadId - 上传ID
 * @returns 上传会话或undefined
 */
function findById(uploadId) {
    return findAll().find(session => session.uploadId === uploadId);
}
/**
 * 创建新的上传会话
 *
 * @param params - 会话参数
 * @returns 创建的上传会话
 */
function create(params) {
    const data = readSessionsData();
    const session = {
        uploadId: generateUploadId(),
        fileName: params.fileName,
        fileSize: params.fileSize,
        totalChunks: params.totalChunks,
        uploadedChunks: [],
        type: params.type,
        userId: params.userId,
        createdAt: new Date().toISOString()
    };
    data.sessions.push(session);
    writeSessionsData(data);
    return session;
}
/**
 * 更新上传会话
 *
 * @param uploadId - 上传ID
 * @param updates - 要更新的字段
 * @returns 更新后的会话或undefined
 */
function update(uploadId, updates) {
    const data = readSessionsData();
    const index = data.sessions.findIndex(s => s.uploadId === uploadId);
    if (index === -1) {
        return undefined;
    }
    data.sessions[index] = {
        ...data.sessions[index],
        ...updates
    };
    writeSessionsData(data);
    return data.sessions[index];
}
/**
 * 记录已上传的分片
 *
 * @param uploadId - 上传ID
 * @param chunkIndex - 分片索引
 * @returns 更新后的会话或undefined
 */
function addUploadedChunk(uploadId, chunkIndex) {
    const session = findById(uploadId);
    if (!session) {
        return undefined;
    }
    if (!session.uploadedChunks.includes(chunkIndex)) {
        session.uploadedChunks.push(chunkIndex);
        session.uploadedChunks.sort((a, b) => a - b);
        return update(uploadId, { uploadedChunks: session.uploadedChunks });
    }
    return session;
}
/**
 * 删除上传会话
 *
 * @param uploadId - 上传ID
 * @returns 是否删除成功
 */
function remove(uploadId) {
    const data = readSessionsData();
    const index = data.sessions.findIndex(s => s.uploadId === uploadId);
    if (index === -1) {
        return false;
    }
    data.sessions.splice(index, 1);
    writeSessionsData(data);
    return true;
}
/**
 * 清理过期的上传会话
 *
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的会话数量
 */
function cleanExpired(maxAgeHours = 24) {
    const data = readSessionsData();
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const originalLength = data.sessions.length;
    data.sessions = data.sessions.filter(session => {
        const age = now - new Date(session.createdAt).getTime();
        return age < maxAgeMs;
    });
    if (data.sessions.length !== originalLength) {
        writeSessionsData(data);
    }
    return originalLength - data.sessions.length;
}
/**
 * 获取用户的所有上传会话
 *
 * @param userId - 用户ID
 * @returns 上传会话列表
 */
function findByUserId(userId) {
    return findAll().filter(session => session.userId === userId);
}
/**
 * 检查上传会话是否完成
 *
 * @param uploadId - 上传ID
 * @returns 是否完成
 */
function isComplete(uploadId) {
    const session = findById(uploadId);
    if (!session) {
        return false;
    }
    return session.uploadedChunks.length === session.totalChunks;
}
/**
 * 生成唯一上传ID
 *
 * @returns 唯一上传ID
 */
function generateUploadId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
//# sourceMappingURL=uploadSessions.js.map