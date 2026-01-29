import { promises as fs } from "fs";

export const loadSystemPrompt = async (path: string): Promise<string> => {
  const content = await fs.readFile(path, "utf-8");
  return content.trim();
};
