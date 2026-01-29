export type CliOptions = {
  inputPath: string;
  outputPath: string;
  overwrite: boolean;
  cache: boolean;
};

const takeValue = (args: string[], index: number): string => {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${args[index]}`);
  }
  return value;
};

export const parseCliArgs = (argv: string[]): CliOptions => {
  const args = argv.slice(2);
  let inputPath = "";
  let outputPath = "";
  let overwrite = false;
  let cache = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--input":
      case "-i":
        inputPath = takeValue(args, i);
        i += 1;
        break;
      case "--output":
      case "-o":
        outputPath = takeValue(args, i);
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
