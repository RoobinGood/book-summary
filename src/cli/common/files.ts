import { promises as fs } from "node:fs";

export const ensureFileReadable = async (path: string): Promise<void> => {
  await fs.access(path);
};

export const ensureOutputWritable = async (
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

export const ensureDirectoryExists = async (path: string): Promise<void> => {
  await fs.mkdir(path, { recursive: true });
};
