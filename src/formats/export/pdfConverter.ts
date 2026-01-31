import puppeteer from "puppeteer";
import type { ExportConversionResult, ExportConverter } from "./types";
import { renderMarkdownDocument } from "./htmlDocument";

export class PdfExportConverter implements ExportConverter {
  format = "pdf" as const;
  extension = "pdf" as const;

  async convert(markdown: string): Promise<ExportConversionResult> {
    const html = renderMarkdownDocument(markdown);
    const browser = await puppeteer.launch();

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ format: "A4" });
      return { extension: this.extension, content: Buffer.from(pdf) };
    } finally {
      await browser.close();
    }
  }
}
