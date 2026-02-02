import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { LlmConfig } from "../../config/config";
import { createChatCompletion } from "../../llm/client";
import { loadSystemPrompt } from "../../prompts/promptLoader";

const buildUserPrompt = (sourceText: string): string => {
  return [
    "Summarize the source text in Markdown.",
    "Return only the summary.",
    "",
    "Source:",
    sourceText
  ].join("\n");
};

const resolvePromptPath = async (): Promise<string> => {
  const localPath = join(__dirname, "prompt.txt");
  try {
    await fs.access(localPath);
    return localPath;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code && err.code !== "ENOENT") {
      throw error;
    }
  }

  const cwdPath = join(
    process.cwd(),
    "src",
    "summary",
    "stuff-quotations",
    "prompt.txt"
  );
  await fs.access(cwdPath);
  return cwdPath;
};

export const summarizeStuffQuotations = async (
  config: LlmConfig,
  sourceText: string
): Promise<string> => {
  const promptPath = await resolvePromptPath();
  const systemPrompt = await loadSystemPrompt(promptPath);
  const userPrompt = buildUserPrompt(sourceText);

  const summary = await createChatCompletion(config, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  if (!summary) {
    throw new Error("LLM returned empty summary");
  }

  return summary;
};
