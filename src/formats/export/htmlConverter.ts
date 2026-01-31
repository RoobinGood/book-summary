import type { ExportConversionResult, ExportConverter } from "./types";
import { renderMarkdownDocument } from "./htmlDocument";

export class HtmlExportConverter implements ExportConverter {
  format = "html" as const;
  extension = "html" as const;

  async convert(markdown: string): Promise<ExportConversionResult> {
    const html = renderMarkdownDocument(markdown);
    return {
      extension: this.extension,
      content: Buffer.from(html, "utf-8")
    };
  }
}
