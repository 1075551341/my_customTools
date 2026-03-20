/**
 * 文档编码器基类
 *
 * 提供文档格式转换的通用接口和基础功能
 *
 * @module encoders/document/base
 */

import fs from 'fs'
import path from 'path'
import logger from '../../utils/logger'
import type { DocumentTranscodeConfig, DocumentTaskSubtype, DocumentTranscodeResult } from '../../types'

/**
 * 进度回调函数类型
 */
export type DocumentProgressCallback = (progress: {
  percent: number
  stage: string
}) => void

/**
 * 文档编码器抽象基类
 */
export abstract class DocumentEncoder {
  abstract readonly name: string
  abstract readonly subtype: DocumentTaskSubtype
  abstract readonly inputFormats: string[]
  abstract readonly outputFormat: string
  abstract readonly description: string

  /**
   * 执行文档转码
   *
   * @param inputPath - 输入文件路径（单个或多个）
   * @param outputPath - 输出文件路径
   * @param config - 转码配置
   * @param onProgress - 进度回调
   * @returns 转码结果
   */
  async transcode(
    inputPath: string | string[],
    outputPath: string,
    config: DocumentTranscodeConfig,
    onProgress?: DocumentProgressCallback
  ): Promise<DocumentTranscodeResult> {
    // 验证输入文件
    if (Array.isArray(inputPath)) {
      for (const p of inputPath) {
        if (!fs.existsSync(p)) {
          throw new Error(`输入文件不存在: ${p}`)
        }
      }
    } else {
      if (!fs.existsSync(inputPath)) {
        throw new Error(`输入文件不存在: ${inputPath}`)
      }
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 调用子类实现
    return this.doTranscode(inputPath, outputPath, config, onProgress)
  }

  /**
   * 子类实现具体转码逻辑
   */
  protected abstract doTranscode(
    inputPath: string | string[],
    outputPath: string,
    config: DocumentTranscodeConfig,
    onProgress?: DocumentProgressCallback
  ): Promise<DocumentTranscodeResult>

  /**
   * 检查是否支持指定格式
   *
   * @param format - 格式名称
   * @returns 是否支持
   */
  supportsFormat(format: string): boolean {
    return this.inputFormats.includes(format.toLowerCase())
  }

  /**
   * 获取编码器信息
   */
  getInfo(): {
    name: string
    subtype: DocumentTaskSubtype
    inputFormats: string[]
    outputFormat: string
    description: string
  } {
    return {
      name: this.name,
      subtype: this.subtype,
      inputFormats: this.inputFormats,
      outputFormat: this.outputFormat,
      description: this.description
    }
  }
}