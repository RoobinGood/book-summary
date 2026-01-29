export type DocumentConversionResult = {
  markdown: string;
};

export interface DocumentConverter {
  supports(extension: string): boolean;
  convert(inputPath: string): Promise<DocumentConversionResult>;
}
