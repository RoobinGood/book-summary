#!/usr/bin/env node
import { promises as fs } from "fs";
import { parseCliArgs } from "./cli/args";
import { loadConfig } from "./config/config";
import { logger } from "./logging/logger";
import { getConverterForFile } from "./formats/converterFactory";
import { loadCachedMarkdown, saveCachedMarkdown } from "./cache/cache";
import { buildHeadingTree, parseHeadings, renderHeadingTree } from "./markdown/headings";
import { extractSection } from "./markdown/section";
import { promptForSection } from "./tui/menu";
import { loadSystemPrompt } from "./prompts/promptLoader";
import { summarizeWithChainOfDensity } from "./summary/chainOfDensity";
import { countTokens } from "./llm/tokenizer";

const ensureFileReadable = async (path: string): Promise<void> => {
  await fs.access(path);
};

const ensureOutputWritable = async (
  path: string,
  overwrite: boolean
): Promise<void> => {
  try {
    await fs.access(path);
    if (!overwrite) {
      throw new Error(
        `Output file already exists. Use --overwrite to replace: ${path}`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Output file")) {
      throw error;
    }
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }
  }
};

const run = async (): Promise<void> => {
  const options = parseCliArgs(process.argv);
  const config = loadConfig();

  logger.info("Starting book summary tool");

  await ensureFileReadable(options.inputPath);
  await ensureOutputWritable(options.outputPath, options.overwrite);

  const cached = await loadCachedMarkdown(options.inputPath, options.cache);
  let markdown: string;

  if (cached) {
    markdown = cached.markdown;
  } else {
    const converter = getConverterForFile(options.inputPath);
    const result = await converter.convert(options.inputPath);
    markdown = result.markdown;
    await saveCachedMarkdown(options.inputPath, markdown, options.cache);
  }

  const headings = parseHeadings(markdown);
  const headingTree = buildHeadingTree(headings);
  const headingLines = renderHeadingTree(headingTree);

  logger.info(`Parsed ${headings.length} headings from Markdown`);
  if (headingLines.length === 0) {
    logger.warn("No headings found in the document");
  }

  logger.info("Opening section selection menu");
  const selection = await promptForSection(headingLines, headings.length);
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

  const systemPrompt = await loadSystemPrompt(config.llm.systemPromptPath);
  const selectedTokens = countTokens(selectedText, config.llm.model);
  logger.info(`Selected text tokens: ${selectedTokens}`);
  logger.info("Starting LLM summarization");
  const summary = await summarizeWithChainOfDensity(
    config.llm,
    systemPrompt,
    selectedText
  );

  logger.info("LLM summarization completed");
  await fs.writeFile(options.outputPath, summary, "utf-8");
  logger.info(`Summary saved to ${options.outputPath}`);
};

run().catch((error) => {
  logger.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
