import { extname } from "node:path";
import type { DocumentConverter } from "./types";
import { EpubConverter } from "./epub/epubConverter";

const converters: DocumentConverter[] = [new EpubConverter()];

export const getConverterForFile = (filePath: string): DocumentConverter => {
  const extension = extname(filePath).toLowerCase();
  const converter = converters.find((item) => item.supports(extension));
  if (!converter) {
    throw new Error(`No converter available for extension: ${extension}`);
  }
  return converter;
};
