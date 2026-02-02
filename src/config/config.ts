import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseNumber = (key: string): number => {
  const raw = requireEnv(key);
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return value;
};

const parseOptionalNumber = (key: string): number | undefined => {
  const raw = process.env[key];
  if (!raw) {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return value;
};

export type LlmConfig = {
  url: string;
  model: string;
  apiKey: string;
  maxContextTokens: number;
  maxOutputTokens: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

export type AppConfig = {
  llm: LlmConfig;
};

export const loadConfig = (): AppConfig => {
  return {
    llm: {
      url: requireEnv("LLM_URL"),
      model: requireEnv("LLM_MODEL"),
      apiKey: requireEnv("LLM_API_KEY"),
      maxContextTokens: parseNumber("LLM_MAX_CONTEXT_TOKENS"),
      maxOutputTokens: parseNumber("LLM_MAX_OUTPUT_TOKENS"),
      temperature: parseOptionalNumber("LLM_TEMPERATURE"),
      topP: parseOptionalNumber("LLM_TOP_P"),
      frequencyPenalty: parseOptionalNumber("LLM_FREQUENCY_PENALTY"),
      presencePenalty: parseOptionalNumber("LLM_PRESENCE_PENALTY")
    }
  };
};
