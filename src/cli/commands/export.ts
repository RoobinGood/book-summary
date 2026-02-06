import { promises as fs } from "node:fs";
import { extname, parse as parsePath, join } from "node:path";
import { ensureFileReadable, ensureOutputWritable } from "../common/files";
import { logger } from "../../logging/logger";
import { getExportConverter } from "../../formats/export/converterFactory";
import { parseCommaSeparatedList } from "../common/options";

export type ExportCommandOptions = {
  inputPath: string;
  formats?: string | string[];
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
  const normalizeFormats = (value?: string | string[]): string[] => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((format) => format.trim())
        .filter((format) => format.length > 0);
    }

    return parseCommaSeparatedList(value);
  };

  const formats = normalizeFormats(options.formats);
  if (formats.length === 0) {
    throw new Error("At least one export format is required");
  }

  if (extname(options.inputPath).toLowerCase() !== ".md") {
    throw new Error("Input file must be a Markdown file with .md extension");
  }

  await ensureFileReadable(options.inputPath);
  const markdown = await fs.readFile(options.inputPath, "utf-8");

  for (const format of formats) {
    const converter = getExportConverter(format);
    const outputPath = resolveOutputPath(options.inputPath, converter.extension);

    logger.info("Starting export command");
    await ensureOutputWritable(outputPath, options.overwrite);

    const result = await converter.convert(markdown);
    await fs.writeFile(outputPath, result.content);

    logger.info(`Export saved to ${outputPath}`);
  }
};
