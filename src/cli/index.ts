import { logger } from "../logging/logger";
import { runExportCommand } from "./commands/export";
import { runSummarizeCommand } from "./commands/summarize";

const printUsage = (): void => {
  const usage = [
    "Usage:",
    "  book-summary <command> [options]",
    "",
    "Commands:",
    "  summarize  Summarize a document with section selection",
    "  export     Convert Markdown to html or pdf",
    "",
    "Run with --help on a command to see its options."
  ];
  process.stdout.write(`${usage.join("\n")}\n`);
};

export const runCli = async (argv: string[]): Promise<void> => {
  const args = argv.slice(2);
  const first = args[0] ?? "";
  const normalizedArgs =
    first.endsWith(".ts") || first.endsWith(".js") ? args.slice(1) : args;
  const command = normalizedArgs[0];
  const rest = normalizedArgs.slice(1);

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  switch (command) {
    case "summarize":
      await runSummarizeCommand(rest);
      return;
    case "export":
      await runExportCommand(rest);
      return;
    default:
      logger.error(`Unknown command: ${command}`);
      printUsage();
      process.exitCode = 1;
  }
};

if (require.main === module) {
  runCli(process.argv).catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
