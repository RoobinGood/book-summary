import { promises as fs } from "node:fs";
import { dirname, join, parse as parsePath } from "node:path";
import {
  ensureDirectoryExists,
  ensureFileReadable,
  ensureOutputWritable
} from "../common/files";
import { logger } from "../../logging/logger";
import { getConverterForFile } from "../../formats/converterFactory";

export type ImportCommandOptions = {
  inputPath: string;
  outputPath?: string;
};

const resolveOutputPath = (inputPath: string, outputPath?: string): string => {
  if (outputPath) {
    return outputPath;
  }

  const parsed = parsePath(inputPath);
  return join(parsed.dir, `${parsed.name}.md`);
};

export const runImportCommand = async (
  options: ImportCommandOptions
): Promise<void> => {
  const resolvedOutputPath = resolveOutputPath(
    options.inputPath,
    options.outputPath
  );

  logger.info("Starting markdown conversion");

  await ensureFileReadable(options.inputPath);
  await ensureDirectoryExists(dirname(resolvedOutputPath));
  await ensureOutputWritable(resolvedOutputPath, false);

  const converter = getConverterForFile(options.inputPath);
  const result = await converter.convert(options.inputPath);

  await fs.writeFile(resolvedOutputPath, result.markdown, "utf-8");
  logger.info(`Markdown saved to ${resolvedOutputPath}`);
};
