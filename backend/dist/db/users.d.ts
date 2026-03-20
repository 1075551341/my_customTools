/**
 * 用户数据持久化模块
 *
 * 使用 JSON 文件存储用户数据
 *
 * @module db/users
 */
import type { User } from '../types';
/**
 * 获取所有用户
 *
 * @returns 用户列表
 */
export declare function findAll(): User[];
/**
 * 根据ID查找用户
 *
 * @param id - 用户ID
 * @returns 用户对象或undefined
 */
export declare function findById(id: string): User | undefined;
/**
 * 根据用户名查找用户
 *
 * @param username - 用户名
 * @returns 用户对象或undefined
 */
export declare function findByUsername(username: string): User | undefined;
/**
 * 创建新用户
 *
 * @param user - 用户对象（不含id和createdAt）
 * @returns 创建的用户对象
 */
export declare function create(user: Omit<User, 'id' | 'createdAt'>): User;
/**
 * 更新用户信息
 *
 * @param id - 用户ID
 * @param updates - 要更新的字段
 * @returns 更新后的用户对象或undefined
 */
export declare function update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined;
/**
 * 删除用户
 *
 * @param id - 用户ID
 * @returns 是否删除成功
 */
export declare function remove(id: string): boolean;
/**
 * 检查用户名是否存在
 *
 * @param username - 用户名
 * @returns 是否存在
 */
export declare function existsByUsername(username: string): boolean;
//# sourceMappingURL=users.d.ts.map