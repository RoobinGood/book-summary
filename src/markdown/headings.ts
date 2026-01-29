export type Heading = {
  index: number;
  level: number;
  title: string;
  line: number;
};

export type HeadingNode = Heading & {
  children: HeadingNode[];
};

const headingRegex = /^(#{1,3})\s+(.+)$/;

export const parseHeadings = (markdown: string): Heading[] => {
  const lines = markdown.split(/\r?\n/);
  const headings: Heading[] = [];
  let inCodeBlock = false;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      return;
    }

    const match = headingRegex.exec(line);
    if (!match) {
      return;
    }

    const level = match[1].length;
    const title = match[2].trim();
    headings.push({
      index: headings.length + 1,
      level,
      title,
      line: lineIndex
    });
  });

  return headings;
};

export const buildHeadingTree = (headings: Heading[]): HeadingNode[] => {
  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  headings.forEach((heading) => {
    const node: HeadingNode = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
};

export const renderHeadingTree = (
  nodes: HeadingNode[],
  lines: string[] = []
): string[] => {
  nodes.forEach((node) => {
    const indent = "  ".repeat(node.level - 1);
    lines.push(`${indent}${node.index}. ${node.title}`);
    renderHeadingTree(node.children, lines);
  });

  return lines;
};
