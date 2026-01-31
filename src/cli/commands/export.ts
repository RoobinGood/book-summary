import { promises as fs } from "fs";
import { extname, parse as parsePath, join } from "path";
import { ensureFileReadable, ensureOutputWritable } from "../common/files";
import { logger } from "../../logging/logger";
import { getExportConverter } from "../../formats/export/converterFactory";

export type ExportCommandOptions = {
  inputPath: string;
  format: string;
  overwrite: boolean;
};

const resolveOutputPath = (
  inputPath: string,
  extension: string
): string => {
  const parsed = parsePath(inputPath);
  return join(parsed.dir, `${parsed.name}.${extension}`);
};

export const runExportCommand = async (
  options: ExportCommandOptions
): Promise<void> => {
  const format = options.format.toLowerCase();

  if (extname(options.inputPath).toLowerCase() !== ".md") {
    throw new Error("Input file must be a Markdown file with .md extension");
  }

  const converter = getExportConverter(format);
  const outputPath = resolveOutputPath(options.inputPath, converter.extension);

  logger.info("Starting export command");

  await ensureFileReadable(options.inputPath);
  await ensureOutputWritable(outputPath, options.overwrite);

  const markdown = await fs.readFile(options.inputPath, "utf-8");
  const result = await converter.convert(markdown);
  await fs.writeFile(outputPath, result.content);

  logger.info(`Export saved to ${outputPath}`);
};
