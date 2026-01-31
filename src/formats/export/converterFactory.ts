import type { ExportConverter, ExportFormat } from "./types";
import { HtmlExportConverter } from "./htmlConverter";
import { PdfExportConverter } from "./pdfConverter";

const converters: ExportConverter[] = [
  new HtmlExportConverter(),
  new PdfExportConverter()
];

export const getExportConverter = (format: string): ExportConverter => {
  const normalized = format.toLowerCase() as ExportFormat;
  const converter = converters.find((item) => item.format === normalized);
  if (!converter) {
    throw new Error(`Unsupported export format: ${format}`);
  }
  return converter;
};
