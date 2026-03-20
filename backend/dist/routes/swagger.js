"use strict";
/**
 * Swagger API 文档路由
 *
 * @module routes/swagger
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("../config/swagger");
const router = (0, express_1.Router)();
/**
 * Swagger UI 页面
 * GET /api-docs
 */
router.use('/', swagger_ui_express_1.default.serve);
router.get('/', swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, swagger_1.swaggerUiOptions));
/**
 * OpenAPI JSON 规范
 * GET /api-docs.json
 */
router.get('/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.swaggerSpec);
});
exports.default = router;
//# sourceMappingURL=swagger.js.map