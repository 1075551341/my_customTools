"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = void 0;
exports.success = success;
exports.error = error;
exports.paginated = paginated;
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
function success(res, data, msg = "ok", statusCode = 200) {
    return res.status(statusCode).json({
        code: 0,
        msg,
        data,
    });
}
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
function error(res, msg = "请求失败", code = 400, statusCode = 400) {
    return res.status(statusCode).json({
        code,
        msg,
        data: null,
    });
}
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
function paginated(res, list, total, page, pageSize, msg = "ok") {
    const totalPages = Math.ceil(total / pageSize);
    return success(res, {
        list,
        total,
        page,
        pageSize,
        totalPages,
    }, msg);
}
/**
 * 常用错误响应快捷方法
 */
exports.errors = {
    /**
     * 参数错误
     */
    badRequest: (res, msg = "参数错误") => error(res, msg, 400, 400),
    /**
     * 未授权
     */
    unauthorized: (res, msg = "未授权访问") => error(res, msg, 401, 401),
    /**
     * 禁止访问
     */
    forbidden: (res, msg = "禁止访问") => error(res, msg, 403, 403),
    /**
     * 资源未找到
     */
    notFound: (res, msg = "资源未找到") => error(res, msg, 404, 404),
    /**
     * 服务器内部错误
     */
    internal: (res, msg = "服务器内部错误") => error(res, msg, 500, 500),
    /**
     * 服务不可用
     */
    serviceUnavailable: (res, msg = "服务暂时不可用") => error(res, msg, 503, 503),
};
exports.default = {
    success,
    error,
    paginated,
    errors: exports.errors,
};
//# sourceMappingURL=response.js.map