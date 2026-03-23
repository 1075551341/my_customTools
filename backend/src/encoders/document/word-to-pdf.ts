/**
 * Word → PDF 编码器
 *
 * 纯 Node.js 方案：使用 mammoth 转 HTML + puppeteer 生成 PDF
 * 无需依赖 LibreOffice
 *
 * @module encoders/document/word-to-pdf
 */

import mammoth from "mammoth";
import puppeteer, { type Browser, type PDFOptions } from "puppeteer";
import fs from "fs";
import path from "path";
import { DocumentEncoder, DocumentProgressCallback } from "./base";
import type {
  DocumentTranscodeConfig,
  DocumentTranscodeResult,
} from "../../types";
import logger from "../../utils/logger";

/**
 * Word → PDF 编码器
 */
export class WordToPdfEncoder extends DocumentEncoder {
  readonly name = "word-to-pdf";
  readonly subtype = "word-to-pdf" as const;
  readonly inputFormats = ["doc", "docx", "odt", "rtf"];
  readonly outputFormat = "pdf";
  readonly description = "Word 文档转 PDF（纯 Node.js 方案）";

  // Puppeteer 浏览器实例缓存
  private browser: Browser | null = null;

  /**
   * 获取或创建 Puppeteer 浏览器实例
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--font-render-hinting=none",
        ],
      });
    }
    return this.browser;
  }

  /**
   * 关闭浏览器实例
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async doTranscode(
    inputPath: string | string[],
    outputPath: string,
    config: DocumentTranscodeConfig,
    onProgress?: DocumentProgressCallback,
  ): Promise<DocumentTranscodeResult> {
    const inputFile = Array.isArray(inputPath) ? inputPath[0] : inputPath;

    onProgress?.({ percent: 5, stage: "读取文档" });

    logger.info("开始 Word → PDF 转换", {
      input: inputFile,
      output: outputPath,
    });

    try {
      // Step 1: 使用 mammoth 将 Word 转为 HTML
      const buffer = fs.readFileSync(inputFile);
      const mammothResult = await mammoth.convertToHtml({ buffer });

      onProgress?.({ percent: 30, stage: "转换格式" });

      const html = mammothResult.value;

      // 如果有警告，记录日志
      if (mammothResult.messages.length > 0) {
        logger.debug("Word 转换警告", {
          messages: mammothResult.messages.map((m) => m.message),
        });
      }

      // Step 2: 构建完整的 HTML 文档
      const fullHtml = this.buildHtmlDocument(html, config);

      onProgress?.({ percent: 50, stage: "生成 PDF" });

      // Step 3: 使用 Puppeteer 生成 PDF
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      try {
        // 设置内容
        await page.setContent(fullHtml, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

        onProgress?.({ percent: 70, stage: "渲染 PDF" });

        // PDF 配置
        const pdfOptions: PDFOptions = {
          path: outputPath,
          format: "A4",
          printBackground: true,
          margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm",
          },
        };

        // 根据 config 调整
        if (config.wordToPdf?.format === "pdfa") {
          // PDF/A 格式需要额外的字体嵌入，这里简化处理
          logger.info("请求 PDF/A 格式，使用标准 PDF 输出");
        }

        // 生成 PDF
        await page.pdf(pdfOptions);

        onProgress?.({ percent: 90, stage: "完成" });
      } finally {
        await page.close();
      }

      // 检查输出
      if (!fs.existsSync(outputPath)) {
        throw new Error("PDF 文件生成失败");
      }

      const stats = fs.statSync(outputPath);

      onProgress?.({ percent: 100, stage: "完成" });

      logger.info("Word → PDF 转换完成", {
        input: inputFile,
        output: outputPath,
        size: stats.size,
      });

      return {
        outputPath,
        outputSize: stats.size,
        format: "pdf",
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      logger.error("Word → PDF 转换失败", { error: errMsg });
      throw new Error(`Word 转 PDF 失败: ${errMsg}`);
    }
  }

  /**
   * 构建完整的 HTML 文档
   *
   * @param content - 文档内容 HTML
   * @param config - 转码配置
   * @returns 完整的 HTML 文档
   */
  private buildHtmlDocument(
    content: string,
    config: DocumentTranscodeConfig,
  ): string {
    // 质量配置对应的样式
    const qualityStyles: Record<string, string> = {
      screen: `
        body { font-size: 12pt; line-height: 1.4; }
        img { max-width: 100%; height: auto; }
      `,
      print: `
        body { font-size: 11pt; line-height: 1.5; }
        img { max-width: 100%; height: auto; page-break-inside: avoid; }
      `,
      high: `
        body { font-size: 10pt; line-height: 1.6; }
        img { max-width: 100%; height: auto; page-break-inside: avoid; }
      `,
    };

    const quality = config.wordToPdf?.quality || "print";

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Microsoft YaHei", "SimSun", "Helvetica Neue", Arial, sans-serif;
      color: #333;
      background: #fff;
      padding: 10mm;
    }

    ${qualityStyles[quality] || qualityStyles.print}

    /* 标题样式 */
    h1 { font-size: 24pt; margin: 20px 0 15px; page-break-after: avoid; }
    h2 { font-size: 18pt; margin: 18px 0 12px; page-break-after: avoid; }
    h3 { font-size: 14pt; margin: 15px 0 10px; page-break-after: avoid; }
    h4, h5, h6 { margin: 12px 0 8px; page-break-after: avoid; }

    /* 段落样式 */
    p { margin: 8px 0; text-align: justify; }

    /* 列表样式 */
    ul, ol { margin: 10px 0; padding-left: 30px; }
    li { margin: 5px 0; }

    /* 表格样式 */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: bold;
    }

    /* 图片样式 */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 10px auto;
    }

    /* 链接样式 */
    a { color: #0066cc; text-decoration: none; }

    /* 代码块样式 */
    pre, code {
      font-family: "Consolas", "Courier New", monospace;
      background: #f8f8f8;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      padding: 10px;
      overflow-x: auto;
      page-break-inside: avoid;
    }

    /* 引用样式 */
    blockquote {
      border-left: 4px solid #ddd;
      margin: 10px 0;
      padding: 10px 15px;
      color: #666;
      background: #f9f9f9;
    }

    /* 分页控制 */
    h1, h2, h3 { page-break-after: avoid; }
    p, ul, ol, table { page-break-inside: avoid; }

    /* 打印样式 */
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;
  }
}

// 导出编码器实例
export default new WordToPdfEncoder();
