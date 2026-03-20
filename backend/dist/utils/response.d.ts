/**
 * 统一响应格式工具
 *
 * 所有 API 接口使用统一的响应格式
 *
 * 成功响应格式：
 * {
 *   "code": 0,
 *   "msg": "ok",
 *   "data": { ... }
 * }
 *
 * 错误响应格式：
 * {
 *   "code": 400,
 *   "msg": "错误描述",
 *   "data": null
 * }
 *
 * @module utils/response
 */
import { Response } from 'express';
/**
 * 成功响应
 *
 * @param res - Express 响应对象
 * @param data - 返回的数据
 * @param msg - 成功消息
 * @param statusCode - HTTP 状态码
 * @returns Express 响应
 *
 * @example
 * // 基本用法
 * success(res, { id: 1, name: 'test' });
 * // 返回: { code: 0, msg: 'ok', data: { id: 1, name: 'test' } }
 *
 * @example
 * // 自定义消息
 * success(res, { token: 'xxx' }, '登录成功');
 */
export declare function success<T>(res: Response, data: T, msg?: string, statusCode?: number): Response;
/**
 * 错误响应
 *
 * @param res - Express 响应对象
 * @param msg - 错误消息
 * @param code - 业务错误码
 * @param statusCode - HTTP 状态码
 * @returns Express 响应
 *
 * @example
 * // 基本用法
 * error(res, '用户名或密码错误');
 * // 返回: { code: 400, msg: '用户名或密码错误', data: null }
 *
 * @example
 * // 自定义错误码
 * error(res, '未授权访问', 401, 401);
 */
export declare function error(res: Response, msg?: string, code?: number, statusCode?: number): Response;
/**
 * 分页数据响应
 *
 * @param res - Express 响应对象
 * @param list - 数据列表
 * @param total - 总数量
 * @param page - 当前页码
 * @param pageSize - 每页数量
 * @param msg - 成功消息
 * @returns Express 响应
 *
 * @example
 * // 分页查询结果
 * paginated(res, tasks, 100, 1, 10);
 * // 返回: {
 * //   code: 0,
 * //   msg: 'ok',
 * //   data: {
 * //     list: [...],
 * //     pagination: { total: 100, page: 1, pageSize: 10, totalPages: 10 }
 * //   }
 * // }
 */
export declare function paginated<T>(res: Response, list: T[], total: number, page: number, pageSize: number, msg?: string): Response;
/**
 * 常用错误响应快捷方法
 */
export declare const errors: {
    /**
     * 参数错误
     */
    badRequest: (res: Response, msg?: string) => Response;
    /**
     * 未授权
     */
    unauthorized: (res: Response, msg?: string) => Response;
    /**
     * 禁止访问
     */
    forbidden: (res: Response, msg?: string) => Response;
    /**
     * 资源未找到
     */
    notFound: (res: Response, msg?: string) => Response;
    /**
     * 服务器内部错误
     */
    internal: (res: Response, msg?: string) => Response;
    /**
     * 服务不可用
     */
    serviceUnavailable: (res: Response, msg?: string) => Response;
};
declare const _default: {
    success: typeof success;
    error: typeof error;
    paginated: typeof paginated;
    errors: {
        /**
         * 参数错误
         */
        badRequest: (res: Response, msg?: string) => Response;
        /**
         * 未授权
         */
        unauthorized: (res: Response, msg?: string) => Response;
        /**
         * 禁止访问
         */
        forbidden: (res: Response, msg?: string) => Response;
        /**
         * 资源未找到
         */
        notFound: (res: Response, msg?: string) => Response;
        /**
         * 服务器内部错误
         */
        internal: (res: Response, msg?: string) => Response;
        /**
         * 服务不可用
         */
        serviceUnavailable: (res: Response, msg?: string) => Response;
    };
};
export default _default;
//# sourceMappingURL=response.d.ts.map