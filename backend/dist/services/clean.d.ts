/**
 * 自动清理服务模块
 *
 * 使用 node-cron 定期清理旧任务和临时文件
 *
 * @module services/clean
 */
/**
 * 清理任务状态
 */
interface CleanStats {
    tasksRemoved: number;
    filesRemoved: number;
    spaceFreed: number;
    lastRun: string | null;
}
/**
 * 清理旧任务
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的任务数量
 */
export declare function cleanOldTasks(maxAgeDays?: number): number;
/**
 * 清理临时文件
 *
 * @param maxAgeHours - 最大存活时间（小时）
 * @returns 清理的文件数量
 */
export declare function cleanTempFiles(maxAgeHours?: number): number;
/**
 * 清理用户输出目录中的旧文件
 *
 * @param maxAgeDays - 最大存活天数
 * @returns 清理的文件数量和释放的空间
 */
export declare function cleanOutputFiles(maxAgeDays?: number): {
    count: number;
    spaceFreed: number;
};
/**
 * 执行完整清理
 *
 * @returns 清理统计
 */
export declare function runFullClean(): CleanStats;
/**
 * 启动定时清理任务
 *
 * 默认每天凌晨 3 点执行
 *
 * @param cronExpression - cron 表达式
 */
export declare function startScheduledClean(cronExpression?: string): void;
/**
 * 停止定时清理任务
 */
export declare function stopScheduledClean(): void;
/**
 * 获取清理统计
 *
 * @returns 清理统计
 */
export declare function getCleanStats(): CleanStats;
/**
 * 获取存储使用情况
 *
 * @returns 存储使用情况
 */
export declare function getStorageUsage(): {
    uploadDir: {
        size: number;
        sizeMB: number;
    };
    outputDir: {
        size: number;
        sizeMB: number;
    };
    dataDir: {
        size: number;
        sizeMB: number;
    };
    total: {
        size: number;
        sizeMB: number;
        sizeGB: number;
    };
};
export {};
//# sourceMappingURL=clean.d.ts.map