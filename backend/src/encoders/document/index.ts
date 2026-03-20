/**
 * 文档编码器注册中心
 *
 * 管理和注册所有可用的文档编码器
 *
 * 功能说明：
 * - 提供编码器注册和查询接口
 * - 根据名称或子类型获取编码器实例
 * - 支持动态添加新编码器
 *
 * @module encoders/document/index
 */

import type { DocumentEncoder, DocumentProgressCallback } from './base'
import type { DocumentTaskSubtype, DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types'
import PdfMergeEncoder from './pdf-merge'
import PdfSplitEncoder from './pdf-split'
import WordToPdfEncoder from './word-to-pdf'
import ExcelToCsvEncoder from './excel-to-csv'
import ExcelToWordEncoder from './excel-to-word'

/**
 * 编码器信息
 */
export interface DocumentEncoderInfo {
  name: string
  subtype: DocumentTaskSubtype
  inputFormats: string[]
  outputFormat: string
  description: string
}

/**
 * 编码器映射表
 *
 * key: 编码器子类型
 * value: 编码器实例
 */
const encoders: Map<DocumentTaskSubtype, DocumentEncoder> = new Map()

/**
 * 注册编码器
 *
 * @param encoder - 编码器实例
 */
export function registerEncoder(encoder: DocumentEncoder): void {
  encoders.set(encoder.subtype, encoder)
}

/**
 * 获取编码器
 *
 * @param subtype - 编码器子类型
 * @returns 编码器实例或 undefined
 */
export function getEncoder(subtype: DocumentTaskSubtype): DocumentEncoder | undefined {
  return encoders.get(subtype)
}

/**
 * 检查编码器是否存在
 *
 * @param subtype - 编码器子类型
 * @returns 是否存在
 */
export function hasEncoder(subtype: DocumentTaskSubtype): boolean {
  return encoders.has(subtype)
}

/**
 * 获取所有编码器信息
 *
 * @returns 编码器信息列表
 */
export function getAllEncoders(): DocumentEncoderInfo[] {
  const list: DocumentEncoderInfo[] = []
  encoders.forEach(encoder => {
    list.push(encoder.getInfo())
  })
  return list
}

/**
 * 获取所有编码器子类型
 *
 * @returns 编码器子类型列表
 */
export function getEncoderSubtypes(): DocumentTaskSubtype[] {
  return Array.from(encoders.keys())
}

/**
 * 获取支持的文档格式
 */
export function getSupportedDocumentFormats() {
  const inputFormats = new Set<string>()
  const outputFormats = new Set<string>()

  encoders.forEach(encoder => {
    encoder.inputFormats.forEach(f => inputFormats.add(f))
    outputFormats.add(encoder.outputFormat)
  })

  return {
    input: Array.from(inputFormats),
    output: Array.from(outputFormats)
  }
}

/**
 * 根据输入输出格式获取编码器
 *
 * @param inputFormat - 输入格式
 * @param outputFormat - 输出格式
 * @returns 编码器实例或 undefined
 */
export function getEncoderByFormats(
  inputFormat: string,
  outputFormat: string
): DocumentEncoder | undefined {
  let matched: DocumentEncoder | undefined

  encoders.forEach(encoder => {
    if (encoder.supportsFormat(inputFormat) && encoder.outputFormat === outputFormat) {
      matched = encoder
    }
  })

  return matched
}

/**
 * 执行文档转码
 *
 * @param subtype - 编码器子类型
 * @param inputPath - 输入路径
 * @param outputPath - 输出路径
 * @param config - 转码配置
 * @param onProgress - 进度回调
 * @returns 转码结果
 */
export async function transcodeDocument(
  subtype: DocumentTaskSubtype,
  inputPath: string | string[],
  outputPath: string,
  config: DocumentTranscodeConfig,
  onProgress?: DocumentProgressCallback
): Promise<DocumentTranscodeResult> {
  const encoder = getEncoder(subtype)

  if (!encoder) {
    throw new Error(`不支持的文档转码类型: ${subtype}`)
  }

  return encoder.transcode(inputPath, outputPath, config, onProgress)
}

/**
 * 初始化默认编码器
 *
 * 注册内置的文档编码器
 */
export function initDefaultEncoders(): void {
  registerEncoder(PdfMergeEncoder)
  registerEncoder(PdfSplitEncoder)
  registerEncoder(WordToPdfEncoder)
  registerEncoder(ExcelToCsvEncoder)
  registerEncoder(ExcelToWordEncoder)
}

// 自动初始化默认编码器
initDefaultEncoders()

// 导出各编码器
export {
  PdfMergeEncoder,
  PdfSplitEncoder,
  WordToPdfEncoder,
  ExcelToCsvEncoder,
  ExcelToWordEncoder
}