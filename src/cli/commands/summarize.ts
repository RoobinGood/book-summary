import { promises as fs } from "fs";
import { parseSummarizeArgs } from "../common/args";
import { ensureFileReadable, ensureOutputWritable } from "../common/files";
import { loadConfig } from "../../config/config";
import { logger } from "../../logging/logger";
import { getConverterForFile } from "../../formats/converterFactory";
import { loadCachedMarkdown, saveCachedMarkdown } from "../../cache/cache";
import { buildHeadingTree, parseHeadings, renderHeadingTree } from "../../markdown/headings";
import { extractSection } from "../../markdown/section";
import { promptForSection } from "../../tui/menu";
import { loadSystemPrompt } from "../../prompts/promptLoader";
import { summarizeWithChainOfDensity } from "../../summary/chainOfDensity";
import { countTokens } from "../../llm/tokenizer";

const printSummarizeUsage = (): void => {
  const usage = [
    "Usage:",
    "  book-summary summarize --input <path> --output <path> [--overwrite] [--cache]"
  ];
  process.stdout.write(`${usage.join("\n")}\n`);
};

export const runSummarizeCommand = async (argv: string[]): Promise<void> => {
  if (argv.includes("--help") || argv.includes("-h")) {
    printSummarizeUsage();
    return;
  }
  const options = parseSummarizeArgs(argv);
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
