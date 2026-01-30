export type ExportFormat = "html" | "pdf";

export type ExportConversionResult = {
  extension: ExportFormat;
  content: Buffer;
};

export interface ExportConverter {
  format: ExportFormat;
  extension: ExportFormat;
  convert(markdown: string): Promise<ExportConversionResult>;
}
