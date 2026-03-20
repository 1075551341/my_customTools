/**
 * PDF 拆分编码器
 *
 * 将 PDF 文件拆分为多个单页或指定范围的 PDF
 *
 * @module encoders/document/pdf-split
 */

import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { DocumentEncoder, DocumentProgressCallback } from './base'
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types'
import logger from '../../utils/logger'

/**
 * PDF 拆分编码器
 */
export class PdfSplitEncoder extends DocumentEncoder {
  readonly name = 'pdf-split'
  readonly subtype = 'pdf-split' as const
  readonly inputFormats = ['pdf']
  readonly outputFormat = 'pdf'
  readonly description = '拆分 PDF 文件'

  protected async doTranscode(
    inputPath: string | string[],
    outputPath: string,
    config: DocumentTranscodeConfig,
    onProgress?: DocumentProgressCallback
  ): Promise<DocumentTranscodeResult> {
    const pdfPath = Array.isArray(inputPath) ? inputPath[0] : inputPath
    const splitConfig = config.pdfSplit

    onProgress?.({ percent: 5, stage: '读取 PDF' })

    const pdfBytes = fs.readFileSync(pdfPath)
    const sourcePdf = await PDFDocument.load(pdfBytes)
    const totalPages = sourcePdf.getPageCount()

    logger.info('开始 PDF 拆分', {
      file: pdfPath,
      totalPages,
      mode: splitConfig?.mode || 'all'
    })

    onProgress?.({ percent: 10, stage: '解析拆分规则' })

    const outputDir = path.dirname(outputPath)
    const baseName = path.parse(outputPath).name
    const outputPaths: string[] = []

    if (splitConfig?.mode === 'page' && splitConfig.pages) {
      // 按指定页码拆分
      const pages = splitConfig.pages

      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i]

        if (pageNum < 1 || pageNum > totalPages) {
          logger.warn(`页码 ${pageNum} 超出范围，跳过`)
          continue
        }

        onProgress?.({
          percent: 10 + Math.round((i / pages.length) * 80),
          stage: `拆分页面 ${pageNum}`
        })

        const newPdf = await PDFDocument.create()
        const [page] = await newPdf.copyPages(sourcePdf, [pageNum - 1])
        newPdf.addPage(page)

        const outPath = path.join(outputDir, `${baseName}_page_${pageNum}.pdf`)
        fs.writeFileSync(outPath, await newPdf.save())
        outputPaths.push(outPath)
      }
    } else if (splitConfig?.mode === 'range' && splitConfig.ranges) {
      // 按范围拆分
      const ranges = splitConfig.ranges

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i]
        const [startStr, endStr] = range.split('-')
        const start = parseInt(startStr, 10)
        const end = parseInt(endStr, 10)

        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          logger.warn(`范围 ${range} 无效，跳过`)
          continue
        }

        onProgress?.({
          percent: 10 + Math.round((i / ranges.length) * 80),
          stage: `拆分范围 ${range}`
        })

        const newPdf = await PDFDocument.create()
        const pageIndices = Array.from(
          { length: end - start + 1 },
          (_, j) => start - 1 + j
        )
        const pages = await newPdf.copyPages(sourcePdf, pageIndices)
        pages.forEach(page => newPdf.addPage(page))

        const outPath = path.join(outputDir, `${baseName}_pages_${range}.pdf`)
        fs.writeFileSync(outPath, await newPdf.save())
        outputPaths.push(outPath)
      }
    } else {
      // 默认：每页一个文件
      for (let i = 0; i < totalPages; i++) {
        onProgress?.({
          percent: 10 + Math.round((i / totalPages) * 80),
          stage: `拆分页面 ${i + 1}/${totalPages}`
        })

        const newPdf = await PDFDocument.create()
        const [page] = await newPdf.copyPages(sourcePdf, [i])
        newPdf.addPage(page)

        const outPath = path.join(outputDir, `${baseName}_page_${i + 1}.pdf`)
        fs.writeFileSync(outPath, await newPdf.save())
        outputPaths.push(outPath)
      }
    }

    onProgress?.({ percent: 100, stage: '完成' })

    logger.info('PDF 拆分完成', {
      totalPages,
      outputFiles: outputPaths.length
    })

    return {
      outputPath: outputPaths[0] || outputPath,
      outputSize: outputPaths[0] ? fs.statSync(outputPaths[0]).size : 0,
      pageCount: 1,
      format: 'pdf',
      outputPaths
    }
  }
}

export default new PdfSplitEncoder()