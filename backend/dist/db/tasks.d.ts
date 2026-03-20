/**
 * 任务数据持久化模块
 *
 * 使用 JSON 文件存储任务数据
 *
 * @module db/tasks
 */
import type { BaseTask, TaskStatus, TaskType } from '../types';
/**
 * 获取所有任务
 *
 * @returns 任务列表
 */
export declare function findAll(): BaseTask[];
/**
 * 根据ID查找任务
 *
 * @param id - 任务ID
 * @returns 任务对象或undefined
 */
export declare function findById(id: string): BaseTask | undefined;
/**
 * 根据用户ID查找任务
 *
 * @param userId - 用户ID
 * @returns 任务列表
 */
export declare function findByUserId(userId: string): BaseTask[];
/**
 * 根据状态查找任务
 *
 * @param status - 任务状态
 * @returns 任务列表
 */
export declare function findByStatus(status: TaskStatus): BaseTask[];
/**
 * 根据类型查找任务
 *
 * @param type - 任务类型
 * @returns 任务列表
 */
export declare function findByType(type: TaskType): BaseTask[];
/**
 * 创建新任务
 *
 * @param taskData - 任务数据
 * @returns 创建的任务
 */
export declare function create(taskData: Omit<BaseTask, 'id' | 'createdAt' | 'progress' | 'status'>): BaseTask;
/**
 * 更新任务
 *
 * @param id - 任务ID
 * @param updates - 要更新的字段
 * @returns 更新后的任务或undefined
 */
export declare function update(id: string, updates: Partial<BaseTask>): BaseTask | undefined;
/**
 * 更新任务状态
 *
 * @param id - 任务ID
 * @param status - 新状态
 * @param errorMsg - 错误信息（可选）
 * @returns 更新后的任务或undefined
 */
export declare function updateStatus(id: string, status: TaskStatus, errorMsg?: string): BaseTask | undefined;
/**
 * 更新任务进度
 *
 * @param id - 任务ID
 * @param progress - 进度（0-100）
 * @returns 更新后的任务或undefined
 */
export declare function updateProgress(id: string, progress: number): BaseTask | undefined;
/**
 * 删除任务
 *
 * @param id - 任务ID
 * @returns 是否删除成功
 */
export declare function remove(id: string): boolean;
/**
 * 分页查询任务
 *
 * @param params - 查询参数
 * @returns 分页结果
 */
export declare function findPaginated(params: {
    userId?: string;
    status?: TaskStatus;
    type?: TaskType;
    page: number;
    pageSize: number;
}): {
    list: BaseTask[];
    total: number;
};
/**
 * 获取任务统计
 *
 * @param userId - 用户ID（可选）
 * @returns 统计信息
 */
export declare function getStats(userId?: string): Record<TaskStatus, number>;
/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
export declare function cleanOldTasks(maxAgeDays?: number): number;
//# sourceMappingURL=tasks.d.ts.map