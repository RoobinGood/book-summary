import { createHash } from "crypto";
import { promises as fs } from "fs";
import { logger } from "../logging/logger";

const hashFile = async (filePath: string): Promise<string> => {
  const data = await fs.readFile(filePath);
  return createHash("md5").update(data).digest("hex");
};

const mdPathForInput = (inputPath: string): string => `${inputPath}.md`;
const md5PathForInput = (inputPath: string): string => `${inputPath}.md5`;

export type CacheResult = {
  markdown: string;
  source: "cache" | "fresh";
};

export const loadCachedMarkdown = async (
  inputPath: string,
  cacheEnabled: boolean
): Promise<CacheResult | null> => {
  if (!cacheEnabled) {
    return null;
  }

  const mdPath = mdPathForInput(inputPath);
  const md5Path = md5PathForInput(inputPath);

  try {
    const [mdContent, cachedHash, currentHash] = await Promise.all([
      fs.readFile(mdPath, "utf-8"),
      fs.readFile(md5Path, "utf-8"),
      hashFile(inputPath)
    ]);

    if (cachedHash.trim() === currentHash) {
      logger.info(`Cache hit for ${mdPath}`);
      return { markdown: mdContent, source: "cache" };
    }
  } catch {
    logger.info(`Cache miss for ${mdPath}`);
    return null;
  }

  logger.info(`Cache stale for ${mdPath}`);
  return null;
};

export const saveCachedMarkdown = async (
  inputPath: string,
  markdown: string,
  cacheEnabled: boolean
): Promise<void> => {
  if (!cacheEnabled) {
    return;
  }

  const mdPath = mdPathForInput(inputPath);
  const md5Path = md5PathForInput(inputPath);
  const hash = await hashFile(inputPath);

  await Promise.all([
    fs.writeFile(mdPath, markdown, "utf-8"),
    fs.writeFile(md5Path, hash, "utf-8")
  ]);

  logger.info(`Saved cache to ${mdPath}`);
};
