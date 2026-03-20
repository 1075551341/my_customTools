"use strict";
/**
 * 用户数据持久化模块
 *
 * 使用 JSON 文件存储用户数据
 *
 * @module db/users
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = findAll;
exports.findById = findById;
exports.findByUsername = findByUsername;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.existsByUsername = existsByUsername;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
/**
 * 用户数据文件路径
 */
const USERS_FILE = path_1.default.join(config_1.default.storage.dataDir, 'users.json');
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
 * 读取用户数据
 *
 * @returns 用户数据对象
 */
function readUsersData() {
    ensureDataDir();
    if (!fs_1.default.existsSync(USERS_FILE)) {
        // 初始化空数据
        const initialData = {
            users: [],
            lastUpdated: new Date().toISOString()
        };
        fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
    try {
        const content = fs_1.default.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        // 文件损坏时返回空数据
        return {
            users: [],
            lastUpdated: new Date().toISOString()
        };
    }
}
/**
 * 写入用户数据
 *
 * @param data - 用户数据对象
 */
function writeUsersData(data) {
    ensureDataDir();
    data.lastUpdated = new Date().toISOString();
    fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
/**
 * 获取所有用户
 *
 * @returns 用户列表
 */
function findAll() {
    return readUsersData().users;
}
/**
 * 根据ID查找用户
 *
 * @param id - 用户ID
 * @returns 用户对象或undefined
 */
function findById(id) {
    return findAll().find(user => user.id === id);
}
/**
 * 根据用户名查找用户
 *
 * @param username - 用户名
 * @returns 用户对象或undefined
 */
function findByUsername(username) {
    return findAll().find(user => user.username === username);
}
/**
 * 创建新用户
 *
 * @param user - 用户对象（不含id和createdAt）
 * @returns 创建的用户对象
 */
function create(user) {
    const data = readUsersData();
    const newUser = {
        ...user,
        id: generateId(),
        createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeUsersData(data);
    return newUser;
}
/**
 * 更新用户信息
 *
 * @param id - 用户ID
 * @param updates - 要更新的字段
 * @returns 更新后的用户对象或undefined
 */
function update(id, updates) {
    const data = readUsersData();
    const index = data.users.findIndex(user => user.id === id);
    if (index === -1) {
        return undefined;
    }
    data.users[index] = {
        ...data.users[index],
        ...updates
    };
    writeUsersData(data);
    return data.users[index];
}
/**
 * 删除用户
 *
 * @param id - 用户ID
 * @returns 是否删除成功
 */
function remove(id) {
    const data = readUsersData();
    const index = data.users.findIndex(user => user.id === id);
    if (index === -1) {
        return false;
    }
    data.users.splice(index, 1);
    writeUsersData(data);
    return true;
}
/**
 * 检查用户名是否存在
 *
 * @param username - 用户名
 * @returns 是否存在
 */
function existsByUsername(username) {
    return findByUsername(username) !== undefined;
}
/**
 * 生成唯一ID
 *
 * @returns 唯一ID字符串
 */
function generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
//# sourceMappingURL=users.js.map