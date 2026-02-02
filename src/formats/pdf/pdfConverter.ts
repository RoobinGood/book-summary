import { promises as fs } from "node:fs";
import type { DocumentConversionResult, DocumentConverter } from "../types";
import { logger } from "../../logging/logger";

type TextItem = {
  text: string;
  x: number;
  y: number;
  fontSize: number;
};

type Line = {
  y: number;
  text: string;
  fontSize: number;
};

const getPdfjs = async () => {
  if (!globalThis.DOMMatrix) {
    class DOMMatrixStub {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;

      constructor(init?: number[] | DOMMatrixStub) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        } else if (init instanceof DOMMatrixStub) {
          this.a = init.a;
          this.b = init.b;
          this.c = init.c;
          this.d = init.d;
          this.e = init.e;
          this.f = init.f;
        }
      }

      multiplySelf() {
        return this;
      }

      preMultiplySelf() {
        return this;
      }

      translate() {
        return this;
      }

      scale() {
        return this;
      }

      invertSelf() {
        return this;
      }
    }

    globalThis.DOMMatrix = DOMMatrixStub as unknown as typeof DOMMatrix;
  }

  // Use native dynamic import to load ESM from CJS without TS downleveling.
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier);"
  ) as (specifier: string) => Promise<any>;
  return dynamicImport("pdfjs-dist/legacy/build/pdf.mjs");
};

const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const normalizeText = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

const buildLines = (items: TextItem[]): Line[] => {
  const sorted = [...items].sort((a, b) => {
    if (a.y === b.y) {
      return a.x - b.x;
    }
    return b.y - a.y;
  });

  const lines: { y: number; parts: TextItem[]; fontSize: number }[] = [];
  for (const item of sorted) {
    const tolerance = Math.max(2, item.fontSize * 0.5);
    const last = lines.at(-1);
    if (last && Math.abs(last.y - item.y) <= tolerance) {
      last.parts.push(item);
      last.fontSize = Math.max(last.fontSize, item.fontSize);
      continue;
    }
    lines.push({ y: item.y, parts: [item], fontSize: item.fontSize });
  }

  return lines.map((line) => {
    const parts = line.parts.sort((a, b) => a.x - b.x);
    const text = parts.map((part) => part.text).join(" ");
    return {
      y: line.y,
      text: normalizeText(text),
      fontSize: line.fontSize
    };
  });
};

const toMarkdownLine = (text: string, fontSize: number, baseFont: number) => {
  const normalized = normalizeText(text);
  if (!normalized) {
    return "";
  }

  const bulletMatch = normalized.match(/^[•\-*]\s+(.*)$/);
  if (bulletMatch) {
    return `- ${bulletMatch[1]}`;
  }

  const orderedMatch = normalized.match(/^(\d+)[.)]\s+(.*)$/);
  if (orderedMatch) {
    return `${orderedMatch[1]}. ${orderedMatch[2]}`;
  }

  if (baseFont > 0) {
    if (fontSize >= baseFont * 1.8) {
      return `# ${normalized}`;
    }
    if (fontSize >= baseFont * 1.4) {
      return `## ${normalized}`;
    }
    if (fontSize >= baseFont * 1.2) {
      return `### ${normalized}`;
    }
  }

  return normalized;
};

const groupParagraphs = (lines: Line[], baseFont: number): string[] => {
  const paragraphs: string[] = [];
  let current: string[] = [];
  let lastY: number | null = null;
  let lastFont = baseFont;

  for (const line of lines) {
    if (!line.text) {
      continue;
    }

    const gap = lastY === null ? 0 : Math.abs(lastY - line.y);
    const shouldBreak =
      lastY !== null && gap > Math.max(lastFont, line.fontSize) * 1.4;

    if (shouldBreak && current.length > 0) {
      paragraphs.push(current.join("\n"));
      current = [];
    }

    const mdLine = toMarkdownLine(line.text, line.fontSize, baseFont);
    if (mdLine) {
      const headingMatch = mdLine.match(/^(#{1,6})\s+(.*)$/);
      const previous = current.at(-1);
      if (headingMatch && previous) {
        const previousMatch = previous.match(/^(#{1,6})\s+(.*)$/);
        if (previousMatch && previousMatch[1] === headingMatch[1]) {
          current[current.length - 1] = `${headingMatch[1]} ${normalizeText(
            `${previousMatch[2]} ${headingMatch[2]}`
          )}`;
        } else {
          current.push(mdLine);
        }
      } else {
        current.push(mdLine);
      }
    }

    lastY = line.y;
    lastFont = line.fontSize || lastFont;
  }

  if (current.length > 0) {
    paragraphs.push(current.join("\n"));
  }

  return paragraphs;
};

export class PdfConverter implements DocumentConverter {
  supports(extension: string): boolean {
    return extension.toLowerCase() === ".pdf";
  }

  async convert(inputPath: string): Promise<DocumentConversionResult> {
    logger.info(`Parsing PDF file: ${inputPath}`);
    const data = await fs.readFile(inputPath);
    const pdfjs = await getPdfjs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;

    const markdownParts: string[] = [];
    for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
      const page = await doc.getPage(pageIndex);
      const content = await page.getTextContent();
      const items: TextItem[] = [];

      for (const item of content.items) {
        if (!("str" in item) || !("transform" in item)) {
          continue;
        }
        const text = item.str as string;
        if (!text || !text.trim()) {
          continue;
        }
        const transform = item.transform as number[];
        const fontSize = Math.hypot(transform[0], transform[1]);
        items.push({
          text,
          x: transform[4] ?? 0,
          y: transform[5] ?? 0,
          fontSize: fontSize || 0
        });
      }

      const lines = buildLines(items);
      const baseFont = median(lines.map((line) => line.fontSize).filter(Boolean));
      const paragraphs = groupParagraphs(lines, baseFont);

      if (paragraphs.length > 0) {
        markdownParts.push(paragraphs.join("\n\n"));
      }
    }

    const markdown = markdownParts.join("\n\n").trim();
    logger.info("PDF conversion finished");
    return { markdown };
  }
}
