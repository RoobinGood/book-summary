import { encoding_for_model, get_encoding, type TiktokenModel } from "@dqbd/tiktoken";

export const countTokens = (text: string, model: string): number => {
  let encoding: ReturnType<typeof get_encoding>;
  try {
    encoding = encoding_for_model(model as TiktokenModel);
  } catch {
    encoding = get_encoding("cl100k_base");
  }

  try {
    return encoding.encode(text).length;
  } finally {
    encoding.free();
  }
};
