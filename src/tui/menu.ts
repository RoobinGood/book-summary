import { createInterface } from "node:readline/promises";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { type HeadingNode, renderHeadingTree } from "../markdown/headings";

type MenuResult =
  | { action: "exit" }
  | { action: "all" }
  | { action: "section"; index: number };

export const promptForSection = async (
  headingTree: HeadingNode[],
  maxIndex: number
): Promise<MenuResult> => {
  if (!input.isTTY || !output.isTTY) {
    const rl = createInterface({ input, output });
    try {
      const headingLines = renderHeadingTree(headingTree);
      output.write("\nSelect a section to summarize:\n");
      output.write("0. Entire document\n");
      for (const line of headingLines) {
        output.write(`${line}\n`);
      }
      output.write("q. Quit\n");

      while (true) {
        const answer = (await rl.question("\nEnter number: ")).trim();
        if (answer.toLowerCase() === "q") {
          return { action: "exit" };
        }
        const value = Number(answer);
        if (Number.isFinite(value)) {
          if (value === 0) {
            return { action: "all" };
          }
          if (value >= 1 && value <= maxIndex) {
            return { action: "section", index: value };
          }
        }
        output.write("Invalid selection. Try again.\n");
      }
    } finally {
      rl.close();
    }
  }

  type FlatItem = {
    kind: "all" | "heading";
    label: string;
    depth: number;
    hasChildren: boolean;
    isExpanded: boolean;
    node?: HeadingNode;
  };

  const expanded = new Set<number>();
  let selectedIndex = 0;

  const buildFlatItems = (): FlatItem[] => {
    const items: FlatItem[] = [
      {
        kind: "all",
        label: "0. Entire document",
        depth: 0,
        hasChildren: false,
        isExpanded: false
      }
    ];

    const addNodes = (nodes: HeadingNode[], depth: number): void => {
      nodes.forEach((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expanded.has(node.index);
        items.push({
          kind: "heading",
          label: `${node.index}. ${node.title}`,
          depth,
          hasChildren,
          isExpanded,
          node
        });
        if (hasChildren && isExpanded) {
          addNodes(node.children, depth + 1);
        }
      });
    };

    addNodes(headingTree, 0);
    return items;
  };

  const render = (items: FlatItem[]): void => {
    output.write("\x1b[2J\x1b[H");
    output.write("Select a section to summarize:\n");
    output.write("Arrows: up/down to move, left/right to collapse/expand\n");
    output.write("Enter to select, q to quit\n\n");
    items.forEach((item, index) => {
      const isSelected = index === selectedIndex;
      const prefix = isSelected ? "> " : "  ";
      const indent = "  ".repeat(item.depth);
      const marker =
        item.kind === "heading" && item.hasChildren
          ? item.isExpanded
            ? "-"
            : "+"
          : " ";
      output.write(`${prefix}${indent}${marker} ${item.label}\n`);
    });
  };

  const findParentIndex = (items: FlatItem[], index: number): number | null => {
    const depth = items[index]?.depth ?? 0;
    if (depth === 0) {
      return null;
    }
    for (let i = index - 1; i >= 0; i -= 1) {
      if (items[i].depth === depth - 1 && items[i].kind === "heading") {
        return i;
      }
    }
    return null;
  };

  return await new Promise<MenuResult>((resolve) => {
    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    output.write("\x1b[?25l");

    let items = buildFlatItems();
    render(items);

    const cleanup = (): void => {
      input.off("keypress", onKeypress);
      input.setRawMode(false);
      input.pause();
      output.write("\x1b[?25h\n");
    };

    const resolveWith = (result: MenuResult): void => {
      cleanup();
      resolve(result);
    };

    const onKeypress = (_: string, key: readline.Key): void => {
      if (!key) {
        return;
      }
      if (key.ctrl && key.name === "c") {
        resolveWith({ action: "exit" });
        return;
      }
      if (key.name === "q") {
        resolveWith({ action: "exit" });
        return;
      }
      if (key.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render(items);
        return;
      }
      if (key.name === "down") {
        selectedIndex = Math.min(items.length - 1, selectedIndex + 1);
        render(items);
        return;
      }
      if (key.name === "right") {
        const item = items[selectedIndex];
        if (item?.kind === "heading" && item.hasChildren && !item.isExpanded && item.node) {
          expanded.add(item.node.index);
          items = buildFlatItems();
          selectedIndex = Math.min(selectedIndex, items.length - 1);
          render(items);
        }
        return;
      }
      if (key.name === "left") {
        const item = items[selectedIndex];
        if (item?.kind === "heading" && item.hasChildren && item.isExpanded && item.node) {
          expanded.delete(item.node.index);
          items = buildFlatItems();
          selectedIndex = Math.min(selectedIndex, items.length - 1);
          render(items);
          return;
        }
        const parentIndex = findParentIndex(items, selectedIndex);
        if (parentIndex !== null) {
          const parent = items[parentIndex];
          if (parent?.kind === "heading" && parent.node) {
            expanded.delete(parent.node.index);
            items = buildFlatItems();
            selectedIndex = Math.min(parentIndex, items.length - 1);
            render(items);
          }
        }
        return;
      }
      if (key.name === "return") {
        const item = items[selectedIndex];
        if (item?.kind === "all") {
          resolveWith({ action: "all" });
          return;
        }
        if (item?.kind === "heading" && item.node) {
          resolveWith({ action: "section", index: item.node.index });
        }
      }
    };

    input.on("keypress", onKeypress);
  });
};
