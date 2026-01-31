import { promises as fs } from "fs";
import { join, parse as parsePath } from "path";
import { ensureFileReadable, ensureOutputWritable } from "../common/files";
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
  await ensureOutputWritable(resolvedOutputPath, false);

  const converter = getConverterForFile(options.inputPath);
  const result = await converter.convert(options.inputPath);

  await fs.writeFile(resolvedOutputPath, result.markdown, "utf-8");
  logger.info(`Markdown saved to ${resolvedOutputPath}`);
};
