import { promises as fs } from "node:fs";
import { extname } from "node:path";
import { ensureFileReadable, ensureOutputWritable } from "../common/files";
import { loadConfig } from "../../config/config";
import { logger } from "../../logging/logger";
import { buildHeadingTree, parseHeadings } from "../../markdown/headings";
import { extractSection } from "../../markdown/section";
import { promptForSection } from "../../tui/menu";
import { loadSystemPrompt } from "../../prompts/promptLoader";
import { summarizeWithChainOfDensity } from "../../summary/chainOfDensity";
import { countTokens } from "../../llm/tokenizer";

export type SummarizeCommandOptions = {
  inputPath: string;
  outputPath: string;
  overwrite: boolean;
};

export const runSummarizeCommand = async (
  options: SummarizeCommandOptions
): Promise<void> => {
  const config = loadConfig();

  logger.info("Starting book summary tool");

  if (extname(options.inputPath).toLowerCase() !== ".md") {
    throw new Error("Input must be a Markdown file with .md extension");
  }

  await ensureFileReadable(options.inputPath);
  await ensureOutputWritable(options.outputPath, options.overwrite);

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
