/**
 * Excel → Word 编码器
 *
 * 将 Excel 文件转换为 Word 表格文档
 *
 * @module encoders/document/excel-to-word
 */

import XlsxPopulate from 'xlsx-populate'
import { Document, Packer, Table, TableRow, TableCell, WidthType, Paragraph, TextRun, AlignmentType } from 'docx'
import fs from 'fs'
import path from 'path'
import { DocumentEncoder, DocumentProgressCallback } from './base'
import type { DocumentTranscodeConfig, DocumentTranscodeResult } from '../../types'
import logger from '../../utils/logger'

/**
 * Excel → Word 编码器
 */
export class ExcelToWordEncoder extends DocumentEncoder {
  readonly name = 'excel-to-word'
  readonly subtype = 'excel-to-word' as const
  readonly inputFormats = ['xlsx', 'xls']
  readonly outputFormat = 'docx'
  readonly description = 'Excel 转 Word 表格'

  protected async doTranscode(
    inputPath: string | string[],
    outputPath: string,
    config: DocumentTranscodeConfig,
    onProgress?: DocumentProgressCallback
  ): Promise<DocumentTranscodeResult> {
    const excelPath = Array.isArray(inputPath) ? inputPath[0] : inputPath

    onProgress?.({ percent: 5, stage: '读取 Excel 文件' })

    logger.info('开始 Excel → Word 转换', { input: excelPath })

    // 读取 Excel 文件
    const workbook = await XlsxPopulate.fromFileAsync(excelPath)

    onProgress?.({ percent: 20, stage: '获取工作表' })

    // 获取工作表
    const sheetName = config.excelToCsv?.sheet // 复用配置
    let sheet: XlsxPopulate.Sheet

    if (sheetName !== undefined) {
      if (typeof sheetName === 'number') {
        sheet = workbook.sheet(sheetName)
      } else {
        sheet = workbook.sheet(sheetName)
      }
    } else {
      sheet = workbook.sheet(0)
    }

    if (!sheet) {
      throw new Error(`工作表 "${sheetName}" 不存在`)
    }

    onProgress?.({ percent: 40, stage: '提取数据' })

    // 获取数据范围
    const usedRange = sheet.usedRange()
    if (!usedRange) {
      throw new Error('工作表为空')
    }

    const values = usedRange.value() as any[][]

    onProgress?.({ percent: 60, stage: '生成 Word 表格' })

    // 创建 Word 表格行
    const tableRows: TableRow[] = values.map((row, rowIndex) => {
      const cells = (row as any[]).map(cell => {
        const cellText = cell === null || cell === undefined ? '' : String(cell)
        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  bold: rowIndex === 0 // 首行加粗作为表头
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          width: { size: 100 / (row as any[]).length, type: WidthType.PERCENTAGE }
        })
      })
      return new TableRow({ children: cells })
    })

    // 创建 Word 文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: path.parse(excelPath).name,
                bold: true,
                size: 28
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        ]
      }]
    })

    onProgress?.({ percent: 80, stage: '保存文件' })

    // 生成并保存文件
    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(outputPath, buffer)

    const stats = fs.statSync(outputPath)

    onProgress?.({ percent: 100, stage: '完成' })

    logger.info('Excel → Word 转换完成', {
      input: excelPath,
      output: outputPath,
      rows: values.length,
      size: stats.size
    })

    return {
      outputPath,
      outputSize: stats.size,
      format: 'docx'
    }
  }
}

export default new ExcelToWordEncoder()