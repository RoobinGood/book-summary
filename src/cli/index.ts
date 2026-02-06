import { Command } from "commander";
import { runImportCommand } from "./commands/import";
import { runExportCommand } from "./commands/export";
import { runSummarizeCommand } from "./commands/summarize";

const createCli = (): Command => {
  const program = new Command();

  program
    .name("book-summary")
    .description(
      "Convert documents to Markdown, summarize sections, and export formats."
    );

  program
    .command("import")
    .description("Convert a document to Markdown")
    .requiredOption("-i, --input <path>", "Input file path")
    .option("-o, --output <path>", "Output Markdown path")
    .action(async (options) => {
      await runImportCommand({
        inputPath: options.input,
        outputPath: options.output
      });
    });

  program
    .command("summarize")
    .description("Summarize a Markdown document with section selection")
    .requiredOption("-i, --input <path>", "Input Markdown path")
    .requiredOption("-o, --output <path>", "Output summary path")
    .option(
      "-m, --method <method>",
      "Summarization method: stuff-dense | stuff-quotations",
      "stuff-dense"
    )
    .option(
      "-e, --export <formats>",
      "Export formats list (comma-separated)"
    )
    .option("--overwrite", "Overwrite existing output file")
    .action(async (options) => {
      await runSummarizeCommand({
        inputPath: options.input,
        outputPath: options.output,
        overwrite: Boolean(options.overwrite),
        method: options.method,
        exportFormats: options.export
      });
    });

  program
    .command("export")
    .description("Convert Markdown to HTML or PDF")
    .requiredOption("-i, --input <path>", "Input Markdown path")
    .requiredOption(
      "-f, --format <formats>",
      "Export formats list (comma-separated)"
    )
    .option("--overwrite", "Overwrite existing output file")
    .action(async (options) => {
      await runExportCommand({
        inputPath: options.input,
        formats: options.format,
        overwrite: Boolean(options.overwrite)
      });
    });

  return program;
};

export const runCli = async (argv: string[]): Promise<void> => {
  const args = argv.slice(2);
  const first = args[0] ?? "";
  const normalizedArgs =
    first.endsWith(".ts") || first.endsWith(".js") ? args.slice(1) : args;

  const program = createCli();
  await program.parseAsync(["node", "book-summary", ...normalizedArgs]);
};

if (require.main === module) {
  runCli(process.argv).catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
