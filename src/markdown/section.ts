import { Heading } from "./headings";

export const extractSection = (
  markdown: string,
  headings: Heading[],
  selectedIndex: number
): string => {
  const target = headings.find((heading) => heading.index === selectedIndex);
  if (!target) {
    throw new Error(`Heading not found for index ${selectedIndex}`);
  }

  const lines = markdown.split(/\r?\n/);
  const startLine = target.line;

  let endLine = lines.length;
  for (const heading of headings) {
    if (heading.line <= startLine) {
      continue;
    }
    if (heading.level <= target.level) {
      endLine = heading.line;
      break;
    }
  }

  return lines.slice(startLine, endLine).join("\n").trim();
};
