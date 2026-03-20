/**
 * 任务导出服务模块
 *
 * 提供任务报告导出功能（JSON/CSV）
 *
 * @module services/export
 */
import type { TaskStatus, TaskType } from '../types';
/**
 * 导出选项
 */
export interface ExportOptions {
    userId?: string;
    status?: TaskStatus;
    type?: TaskType;
    format: 'json' | 'csv';
    startDate?: string;
    endDate?: string;
}
/**
 * 导出结果
 */
export interface ExportResult {
    content: string;
    fileName: string;
    mimeType: string;
    count: number;
}
/**
 * 导出任务报告
 *
 * @param options - 导出选项
 * @returns 导出结果
 */
export declare function exportTasks(options: ExportOptions): ExportResult;
/**
 * 获取导出统计
 *
 * @param userId - 用户ID
 * @returns 统计信息
 */
export declare function getExportStats(userId?: string): {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byType: Record<TaskType, number>;
};
//# sourceMappingURL=export.d.ts.map