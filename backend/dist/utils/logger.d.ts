/**
 * 日志工具模块
 *
 * 基于 Winston 实现的统一日志系统
 *
 * 功能说明：
 * - 支持多级别日志：error / warn / info / debug
 * - 开发环境：控制台彩色输出
 * - 生产环境：控制台 JSON 格式 + 文件输出
 * - 自动创建日志目录
 *
 * @module utils/logger
 */
import winston from 'winston';
/**
 * Winston Logger 实例
 *
 * 使用示例：
 * ```typescript
 * import logger from './utils/logger'
 *
 * logger.info('服务启动', { port: 3001 })
 * logger.error('数据库连接失败', { error: err.message })
 * logger.warn('配置项缺失，使用默认值', { key: 'maxConnections' })
 * logger.debug('调试信息', { data: someObject })
 * ```
 */
declare const logger: winston.Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map