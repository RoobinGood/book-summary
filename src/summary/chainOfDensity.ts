import type { LlmConfig } from "../config/config";
import { createChatCompletion } from "../llm/client";
import { countTokens } from "../llm/tokenizer";
import { logger } from "../logging/logger";

const buildUserPrompt = (
  sourceText: string,
  previousSummary: string | null,
  passIndex: number,
  totalPasses: number
): string => {
  if (!previousSummary) {
    return [
      `Chain of Density pass ${passIndex + 1}/${totalPasses}.`,
      "Summarize the source text in Markdown.",
      "Return only the summary.",
      "",
      "Source:",
      sourceText
    ].join("\n");
  }

  return [
    `Chain of Density pass ${passIndex + 1}/${totalPasses}.`,
    "Improve the summary by adding missing key entities and details.",
    "Keep it concise and in Markdown.",
    "Return only the summary.",
    "",
    "Source:",
    sourceText,
    "",
    "Previous summary:",
    previousSummary
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

export const summarizeWithChainOfDensity = async (
  config: LlmConfig,
  systemPrompt: string,
  sourceText: string
): Promise<string> => {
  let currentSummary: string | null = null;

  for (let i = 0; i < config.densityPasses; i += 1) {
    logger.info(`Starting Chain of Density pass ${i + 1}`);
    const userPrompt = buildUserPrompt(
      sourceText,
      currentSummary,
      i,
      config.densityPasses
    );

    ensureTokenLimit(config, systemPrompt, userPrompt);

    currentSummary = await createChatCompletion(config, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);
  }

  if (!currentSummary) {
    throw new Error("LLM returned empty summary");
  }

  return currentSummary;
};
