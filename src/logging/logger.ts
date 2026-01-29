type LogLevel = "info" | "warn" | "error";

const formatTimestamp = (): string => new Date().toISOString();

const log = (level: LogLevel, message: string): void => {
  const timestamp = formatTimestamp();
  process.stdout.write(`[${timestamp}] ${level.toUpperCase()}: ${message}\n`);
};

export const logger = {
  info: (message: string) => log("info", message),
  warn: (message: string) => log("warn", message),
  error: (message: string) => log("error", message)
};
