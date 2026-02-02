import { promises as fs } from "node:fs";
import { dirname, extname, join, sep } from "node:path";
import {
  ensureDirectoryExists,
  ensureFileReadable,
  ensureOutputWritable
} from "../common/files";
import { loadConfig } from "../../config/config";
import { logger } from "../../logging/logger";
import { buildHeadingTree, parseHeadings } from "../../markdown/headings";
import { extractSection } from "../../markdown/section";
import { promptForSection } from "../../tui/menu";
import { runExportCommand } from "./export";
import {
  resolveSummaryMethod,
  summarizeWithMethod,
  type SummaryMethod
} from "../../summary/methods";
import { countTokens } from "../../llm/tokenizer";

export type SummarizeCommandOptions = {
  inputPath: string;
  outputPath: string;
  overwrite: boolean;
  method?: string;
  exportFormats?: string;
};

const resolveOutputPath = async (
  outputPath: string,
  method: SummaryMethod
): Promise<string> => {
  const outputName = `summary-${method}.md`;
  const extension = extname(outputPath);

  if (extension && extension.toLowerCase() !== ".md") {
    throw new Error("Output must be a .md file or a directory path");
  }

  if (outputPath.endsWith(sep)) {
    await ensureDirectoryExists(outputPath);
    return join(outputPath, outputName);
  }

  try {
    const stat = await fs.stat(outputPath);
    if (stat.isDirectory()) {
      return join(outputPath, outputName);
    }
    if (!extension) {
      throw new Error(
        "Output path is ambiguous. Use a .md file path or a directory path."
      );
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code && err.code !== "ENOENT") {
      throw error;
    }
  }

  if (!extension) {
    await ensureDirectoryExists(outputPath);
    return join(outputPath, outputName);
  }

  return outputPath;
};

const parseExportFormats = (formats?: string): string[] => {
  if (!formats) {
    return [];
  }

  return formats
    .split(",")
    .map((format) => format.trim())
    .filter((format) => format.length > 0);
};

export const runSummarizeCommand = async (
  options: SummarizeCommandOptions
): Promise<void> => {
  const config = loadConfig();
  const method = resolveSummaryMethod(options.method);
  const outputPath = await resolveOutputPath(options.outputPath, method);

  logger.info("Starting book summary tool");
  logger.info(`Summarization method: ${method}`);

  if (extname(options.inputPath).toLowerCase() !== ".md") {
    throw new Error("Input must be a Markdown file with .md extension");
  }

  await ensureFileReadable(options.inputPath);
  await ensureDirectoryExists(dirname(outputPath));
  await ensureOutputWritable(outputPath, options.overwrite);

  const markdown = await fs.readFile(options.inputPath, "utf-8");

  const headings = parseHeadings(markdown);
  const headingTree = buildHeadingTree(headings);

  logger.info(`Parsed ${headings.length} headings from Markdown`);
  if (headings.length === 0) {
    logger.warn("No headings found in the document");
  }

  logger.info("Opening section selection menu");
  const selection = await promptForSection(headingTree, headings.length);
  if (selection.action === "exit") {
    logger.info("User exited without summarization");
    return;
  }

  logger.info(
    selection.action === "all"
      ? "User selected entire document"
      : `User selected section ${selection.index}`
  );
  const selectedText =
    selection.action === "all"
      ? markdown
      : extractSection(markdown, headings, selection.index);

  const selectedTokens = countTokens(selectedText, config.llm.model);
  logger.info(`Selected text tokens: ${selectedTokens}`);
  logger.info("Starting LLM summarization");
  const summary = await summarizeWithMethod(method, config.llm, selectedText);

  logger.info("LLM summarization completed");
  await fs.writeFile(outputPath, summary, "utf-8");
  logger.info(`Summary saved to ${outputPath}`);

  const exportFormats = parseExportFormats(options.exportFormats);
  for (const format of exportFormats) {
    await runExportCommand({
      inputPath: outputPath,
      format,
      overwrite: options.overwrite
    });
  }
};
