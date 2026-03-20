/**
 * Word → PDF 编码器
 *
 * 使用 LibreOffice headless 模式转换 Word 文档为 PDF
 *
 * @module encoders/document/word-to-pdf
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { DocumentEncoder, DocumentProgressCallback } from './base'
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types'
import logger from '../../utils/logger'

const execAsync = promisify(exec)

/**
 * Word → PDF 编码器
 */
export class WordToPdfEncoder extends DocumentEncoder {
  readonly name = 'word-to-pdf'
  readonly subtype = 'word-to-pdf' as const
  readonly inputFormats = ['doc', 'docx', 'odt', 'rtf', 'txt']
  readonly outputFormat = 'pdf'
  readonly description = 'Word 文档转 PDF'

  // LibreOffice 路径
  private libreOfficePath: string

  constructor() {
    super()
    this.libreOfficePath = this.getLibreOfficePath()
  }

  /**
   * 获取 LibreOffice 路径
   */
  private getLibreOfficePath(): string {
    // 从环境变量获取
    if (process.env.LIBREOFFICE_PATH) {
      return process.env.LIBREOFFICE_PATH
    }

    // Windows 默认路径
    if (process.platform === 'win32') {
      const defaultPaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        process.env.LOCALAPPDATA + '\\LibreOffice\\program\\soffice.exe'
      ].filter(Boolean)

      for (const p of defaultPaths) {
        if (p && fs.existsSync(p)) {
          return p
        }
      }
      return 'soffice'
    }

    // Linux/Mac
    return 'libreoffice'
  }

  /**
   * 检查 LibreOffice 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync(`"${this.libreOfficePath}" --version`, { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  protected async doTranscode(
    inputPath: string | string[],
    outputPath: string,
    config: DocumentTranscodeConfig,
    onProgress?: DocumentProgressCallback
  ): Promise<DocumentTranscodeResult> {
    const inputFile = Array.isArray(inputPath) ? inputPath[0] : inputPath
    const outputDir = path.dirname(outputPath)

    onProgress?.({ percent: 5, stage: '检查 LibreOffice' })

    // 检查 LibreOffice 是否可用
    const available = await this.isAvailable()
    if (!available) {
      throw new Error('LibreOffice 未安装或不可用。请安装 LibreOffice 后重试。')
    }

    onProgress?.({ percent: 10, stage: '准备转换' })

    logger.info('开始 Word → PDF 转换', {
      input: inputFile,
      output: outputPath
    })

    // 构建 LibreOffice 命令
    const pdfType = config.wordToPdf?.format === 'pdfa' ? 'pdfa' : 'pdf'
    const command = `"${this.libreOfficePath}" --headless --convert-to ${pdfType} --outdir "${outputDir}" "${inputFile}"`

    onProgress?.({ percent: 20, stage: '正在转换' })

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000 // 2 分钟超时
      })

      onProgress?.({ percent: 80, stage: '检查输出' })

      // LibreOffice 输出的文件名基于输入文件名
      const inputBasename = path.parse(inputFile).name
      const generatedPdf = path.join(outputDir, `${inputBasename}.pdf`)

      // 重命名为目标文件名
      if (generatedPdf !== outputPath && fs.existsSync(generatedPdf)) {
        fs.renameSync(generatedPdf, outputPath)
      }

      if (!fs.existsSync(outputPath)) {
        throw new Error('PDF 文件生成失败')
      }

      const stats = fs.statSync(outputPath)

      onProgress?.({ percent: 100, stage: '完成' })

      logger.info('Word → PDF 转换完成', {
        input: inputFile,
        output: outputPath,
        size: stats.size
      })

      return {
        outputPath,
        outputSize: stats.size,
        format: 'pdf'
      }
    } catch (error) {
      const errMsg = (error as Error).message
      logger.error('Word → PDF 转换失败', { error: errMsg })
      throw new Error(`Word 转 PDF 失败: ${errMsg}`)
    }
  }
}

export default new WordToPdfEncoder()