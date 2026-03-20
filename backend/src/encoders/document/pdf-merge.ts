/**
 * PDF 合并编码器
 *
 * 合并多个 PDF 文件为一个
 *
 * @module encoders/document/pdf-merge
 */

import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { DocumentEncoder, DocumentProgressCallback } from './base'
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types'
import logger from '../../utils/logger'

/**
 * PDF 合并编码器
 */
export class PdfMergeEncoder extends DocumentEncoder {
  readonly name = 'pdf-merge'
  readonly subtype = 'pdf-merge' as const
  readonly inputFormats = ['pdf']
  readonly outputFormat = 'pdf'
  readonly description = '合并多个 PDF 文件'

  protected async doTranscode(
    inputPaths: string | string[],
    outputPath: string,
    config: DocumentTranscodeConfig,
    onProgress?: DocumentProgressCallback
  ): Promise<DocumentTranscodeResult> {
    const pdfPaths = Array.isArray(inputPaths) ? inputPaths : [inputPaths]

    if (pdfPaths.length < 2) {
      throw new Error('PDF 合并至少需要 2 个文件')
    }

    onProgress?.({ percent: 5, stage: '初始化' })

    const mergedPdf = await PDFDocument.create()
    let totalPages = 0

    logger.info('开始 PDF 合并', { fileCount: pdfPaths.length })

    for (let i = 0; i < pdfPaths.length; i++) {
      const pdfPath = pdfPaths[i]

      onProgress?.({
        percent: 5 + Math.round((i / pdfPaths.length) * 80),
        stage: `合并文件 ${i + 1}/${pdfPaths.length}`
      })

      const pdfBytes = fs.readFileSync(pdfPath)
      const pdf = await PDFDocument.load(pdfBytes)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

      pages.forEach(page => mergedPdf.addPage(page))
      totalPages += pages.length

      logger.debug('合并 PDF 文件', {
        file: pdfPath,
        pages: pages.length,
        progress: `${i + 1}/${pdfPaths.length}`
      })
    }

    onProgress?.({ percent: 90, stage: '保存文件' })

    const pdfBytes = await mergedPdf.save()
    fs.writeFileSync(outputPath, pdfBytes)

    onProgress?.({ percent: 100, stage: '完成' })

    logger.info('PDF 合并完成', {
      inputFiles: pdfPaths.length,
      totalPages,
      outputSize: pdfBytes.length
    })

    return {
      outputPath,
      outputSize: pdfBytes.length,
      pageCount: totalPages,
      format: 'pdf'
    }
  }
}

export default new PdfMergeEncoder()