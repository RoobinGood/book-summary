export const parseCommaSeparatedList = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
};
