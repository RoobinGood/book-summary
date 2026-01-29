import EPub from "epub";
import TurndownService from "turndown";
import { DocumentConversionResult, DocumentConverter } from "../types";
import { logger } from "../../logging/logger";

const createTurndownService = (): TurndownService => {
  return new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "*",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full"
  });
};

const readChapter = (epub: EPub, chapterId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    epub.getChapter(chapterId, (error, text) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(text);
    });
  });
};

const parseEpub = (inputPath: string): Promise<EPub> => {
  return new Promise((resolve, reject) => {
    const epub = new EPub(inputPath);
    epub.on("end", () => resolve(epub));
    epub.on("error", reject);
    epub.parse();
  });
};

export class EpubConverter implements DocumentConverter {
  supports(extension: string): boolean {
    return extension.toLowerCase() === ".epub";
  }

  async convert(inputPath: string): Promise<DocumentConversionResult> {
    logger.info(`Parsing EPUB file: ${inputPath}`);
    const epub = await parseEpub(inputPath);
    const turndownService = createTurndownService();

    const markdownParts: string[] = [];
    for (const chapter of epub.flow) {
      const html = await readChapter(epub, chapter.id);
      const markdown = turndownService.turndown(html);
      markdownParts.push(markdown);
    }

    const markdown = markdownParts.join("\n\n").trim();
    logger.info("EPUB conversion finished");

    return { markdown };
  }
}
