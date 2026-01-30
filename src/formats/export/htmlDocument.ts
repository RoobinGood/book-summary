import MarkdownIt from "markdown-it";

const renderer = new MarkdownIt();

export const renderMarkdownDocument = (markdown: string): string => {
  const body = renderer.render(markdown);
  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8" />',
    "<title>Document</title>",
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>"
  ].join("");
};
