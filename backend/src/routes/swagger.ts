/**
 * Swagger API 文档路由
 *
 * @module routes/swagger
 */

import { Router, Request, Response, IRouter } from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec, swaggerUiOptions } from '../config/swagger'

const router: IRouter = Router()

/**
 * Swagger UI 页面
 * GET /api-docs
 */
router.use('/', swaggerUi.serve)
router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions))

/**
 * OpenAPI JSON 规范
 * GET /api-docs.json
 */
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

export default router