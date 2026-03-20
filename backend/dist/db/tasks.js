"use strict";
/**
 * 任务数据持久化模块
 *
 * 使用 JSON 文件存储任务数据
 *
 * @module db/tasks
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = findAll;
exports.findById = findById;
exports.findByUserId = findByUserId;
exports.findByStatus = findByStatus;
exports.findByType = findByType;
exports.create = create;
exports.update = update;
exports.updateStatus = updateStatus;
exports.updateProgress = updateProgress;
exports.remove = remove;
exports.findPaginated = findPaginated;
exports.getStats = getStats;
exports.cleanOldTasks = cleanOldTasks;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
/**
 * 任务数据文件路径
 */
const TASKS_FILE = path_1.default.join(config_1.default.storage.dataDir, 'tasks.json');
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
 * 读取任务数据
 *
 * @returns 任务数据对象
 */
function readTasksData() {
    ensureDataDir();
    if (!fs_1.default.existsSync(TASKS_FILE)) {
        const initialData = {
            tasks: [],
            lastUpdated: new Date().toISOString()
        };
        fs_1.default.writeFileSync(TASKS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
    try {
        const content = fs_1.default.readFileSync(TASKS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return {
            tasks: [],
            lastUpdated: new Date().toISOString()
        };
    }
}
/**
 * 写入任务数据
 *
 * @param data - 任务数据对象
 */
function writeTasksData(data) {
    ensureDataDir();
    data.lastUpdated = new Date().toISOString();
    fs_1.default.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
/**
 * 获取所有任务
 *
 * @returns 任务列表
 */
function findAll() {
    return readTasksData().tasks;
}
/**
 * 根据ID查找任务
 *
 * @param id - 任务ID
 * @returns 任务对象或undefined
 */
function findById(id) {
    return findAll().find(task => task.id === id);
}
/**
 * 根据用户ID查找任务
 *
 * @param userId - 用户ID
 * @returns 任务列表
 */
function findByUserId(userId) {
    return findAll().filter(task => task.userId === userId);
}
/**
 * 根据状态查找任务
 *
 * @param status - 任务状态
 * @returns 任务列表
 */
function findByStatus(status) {
    return findAll().filter(task => task.status === status);
}
/**
 * 根据类型查找任务
 *
 * @param type - 任务类型
 * @returns 任务列表
 */
function findByType(type) {
    return findAll().filter(task => task.type === type);
}
/**
 * 创建新任务
 *
 * @param taskData - 任务数据
 * @returns 创建的任务
 */
function create(taskData) {
    const data = readTasksData();
    const task = {
        ...taskData,
        id: generateTaskId(),
        status: 'waiting',
        progress: 0,
        createdAt: new Date().toISOString()
    };
    data.tasks.push(task);
    writeTasksData(data);
    return task;
}
/**
 * 更新任务
 *
 * @param id - 任务ID
 * @param updates - 要更新的字段
 * @returns 更新后的任务或undefined
 */
function update(id, updates) {
    const data = readTasksData();
    const index = data.tasks.findIndex(task => task.id === id);
    if (index === -1) {
        return undefined;
    }
    data.tasks[index] = {
        ...data.tasks[index],
        ...updates
    };
    writeTasksData(data);
    return data.tasks[index];
}
/**
 * 更新任务状态
 *
 * @param id - 任务ID
 * @param status - 新状态
 * @param errorMsg - 错误信息（可选）
 * @returns 更新后的任务或undefined
 */
function updateStatus(id, status, errorMsg) {
    const updates = { status };
    if (status === 'processing') {
        updates.startedAt = new Date().toISOString();
    }
    else if (status === 'completed' || status === 'failed') {
        updates.completedAt = new Date().toISOString();
    }
    if (errorMsg) {
        updates.errorMsg = errorMsg;
    }
    return update(id, updates);
}
/**
 * 更新任务进度
 *
 * @param id - 任务ID
 * @param progress - 进度（0-100）
 * @returns 更新后的任务或undefined
 */
function updateProgress(id, progress) {
    return update(id, { progress: Math.min(100, Math.max(0, progress)) });
}
/**
 * 删除任务
 *
 * @param id - 任务ID
 * @returns 是否删除成功
 */
function remove(id) {
    const data = readTasksData();
    const index = data.tasks.findIndex(task => task.id === id);
    if (index === -1) {
        return false;
    }
    data.tasks.splice(index, 1);
    writeTasksData(data);
    return true;
}
/**
 * 分页查询任务
 *
 * @param params - 查询参数
 * @returns 分页结果
 */
function findPaginated(params) {
    let tasks = findAll();
    // 过滤
    if (params.userId) {
        tasks = tasks.filter(t => t.userId === params.userId);
    }
    if (params.status) {
        tasks = tasks.filter(t => t.status === params.status);
    }
    if (params.type) {
        tasks = tasks.filter(t => t.type === params.type);
    }
    // 按创建时间倒序
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = tasks.length;
    const start = (params.page - 1) * params.pageSize;
    const list = tasks.slice(start, start + params.pageSize);
    return { list, total };
}
/**
 * 获取任务统计
 *
 * @param userId - 用户ID（可选）
 * @returns 统计信息
 */
function getStats(userId) {
    const tasks = userId ? findByUserId(userId) : findAll();
    const stats = {
        waiting: 0,
        uploading: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
    };
    tasks.forEach(task => {
        stats[task.status]++;
    });
    return stats;
}
/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
function cleanOldTasks(maxAgeDays = 7) {
    const data = readTasksData();
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const originalLength = data.tasks.length;
    data.tasks = data.tasks.filter(task => {
        // 只清理已完成、失败或取消的任务
        if (!['completed', 'failed', 'cancelled'].includes(task.status)) {
            return true;
        }
        const age = now - new Date(task.createdAt).getTime();
        return age < maxAgeMs;
    });
    if (data.tasks.length !== originalLength) {
        writeTasksData(data);
    }
    return originalLength - data.tasks.length;
}
/**
 * 生成唯一任务ID
 *
 * @returns 唯一任务ID
 */
function generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
//# sourceMappingURL=tasks.js.map