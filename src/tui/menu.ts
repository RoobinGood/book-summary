import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

type MenuResult =
  | { action: "exit" }
  | { action: "all" }
  | { action: "section"; index: number };

export const promptForSection = async (
  headingLines: string[],
  maxIndex: number
): Promise<MenuResult> => {
  const rl = createInterface({ input, output });

  try {
    output.write("\nSelect a section to summarize:\n");
    output.write("0. Entire document\n");
    headingLines.forEach((line) => output.write(`${line}\n`));
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
};
