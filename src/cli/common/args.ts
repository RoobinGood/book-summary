export type SummarizeCliOptions = {
  inputPath: string;
  outputPath: string;
  overwrite: boolean;
  cache: boolean;
};

export type ExportCliOptions = {
  inputPath: string;
  format: string;
  overwrite: boolean;
};

const takeValue = (args: string[], index: number): string => {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${args[index]}`);
  }
  return value;
};

export const parseSummarizeArgs = (argv: string[]): SummarizeCliOptions => {
  let inputPath = "";
  let outputPath = "";
  let overwrite = false;
  let cache = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--input":
      case "-i":
        inputPath = takeValue(argv, i);
        i += 1;
        break;
      case "--output":
      case "-o":
        outputPath = takeValue(argv, i);
        i += 1;
        break;
      case "--overwrite":
        overwrite = true;
        break;
      case "--cache":
        cache = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!inputPath || !outputPath) {
    throw new Error("Both --input and --output are required");
  }

  return { inputPath, outputPath, overwrite, cache };
};

export const parseExportArgs = (argv: string[]): ExportCliOptions => {
  let inputPath = "";
  let format = "";
  let overwrite = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--input":
      case "-i":
        inputPath = takeValue(argv, i);
        i += 1;
        break;
      case "--format":
      case "-f":
        format = takeValue(argv, i);
        i += 1;
        break;
      case "--overwrite":
        overwrite = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!inputPath || !format) {
    throw new Error("Both --input and --format are required");
  }

  return { inputPath, format, overwrite };
};
