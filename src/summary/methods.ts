import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { LlmConfig } from "../config/config";
import { countTokens } from "../llm/tokenizer";
import { loadSystemPrompt } from "../prompts/promptLoader";
import { summarizeStuffDense } from "./stuff-dense";
import { summarizeStuffQuotations } from "./stuff-quotations";

export type SummaryMethod = "stuff-dense" | "stuff-quotations";

const buildUserPrompt = (sourceText: string): string => {
  return [
    "Summarize the source text in Markdown.",
    "Return only the summary.",
    "",
    "Source:",
    sourceText
  ].join("\n");
};

const ensureTokenLimit = (
  config: LlmConfig,
  systemPrompt: string,
  userPrompt: string
): void => {
  const inputTokens = countTokens(systemPrompt + userPrompt, config.model);
  const totalTokens = inputTokens + config.maxOutputTokens;
  if (totalTokens > config.maxContextTokens) {
    throw new Error(
      `Context limit exceeded: ${totalTokens}/${config.maxContextTokens} tokens`
    );
  }
};

const resolvePromptPath = async (method: SummaryMethod): Promise<string> => {
  const localPath = join(__dirname, method, "prompt.txt");
  try {
    await fs.access(localPath);
    return localPath;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code && err.code !== "ENOENT") {
      throw error;
    }
  }

  const cwdPath = join(process.cwd(), "src", "summary", method, "prompt.txt");
  await fs.access(cwdPath);
  return cwdPath;
};

const methodMap: Record<
  SummaryMethod,
  (config: LlmConfig, sourceText: string) => Promise<string>
> = {
  "stuff-dense": summarizeStuffDense,
  "stuff-quotations": summarizeStuffQuotations
};

export const resolveSummaryMethod = (
  method: string | undefined
): SummaryMethod => {
  const normalized = (method ?? "stuff-dense").trim().toLowerCase();
  if (normalized in methodMap) {
    return normalized as SummaryMethod;
  }

  const available = Object.keys(methodMap).join(", ");
  throw new Error(
    `Unknown summarization method: ${method}. Available: ${available}`
  );
};

export const summarizeWithMethod = async (
  method: SummaryMethod,
  config: LlmConfig,
  sourceText: string
): Promise<string> => {
  const systemPrompt = await loadSystemPrompt(await resolvePromptPath(method));
  const userPrompt = buildUserPrompt(sourceText);
  ensureTokenLimit(config, systemPrompt, userPrompt);
  const summarize = methodMap[method];
  return summarize(config, sourceText);
};
