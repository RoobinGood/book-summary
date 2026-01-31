# Book Summary CLI

CLI tool to convert EPUB files to Markdown, select a section via TUI, and summarize it using an OpenAI-compatible LLM with Chain of Density.

## Build

```
npm install
npm run build
```

## Scripts

### import
Purpose: convert supported formats (e.g. EPUB) to Markdown.
How it works: picks a converter by input extension and writes Markdown to a file.
Parameters: `--input <path>`, `--output <path>` (optional, defaults next to input)
Example:
```
node dist/cli/index.js import --input /path/to/book.epub --output /path/to/book.md
```
Default output example:
```
node dist/cli/index.js import --input /path/to/book.epub
```
Without build:
```
npm run dev -- import --input /path/to/book.epub --output /path/to/book.md
```

### summarize
Purpose: summarize Markdown with chapter selection via TUI.
How it works: parses headings, lets you pick a section, sends selected text to the LLM.
Parameters: `--input <path>`, `--output <path>`, `--overwrite`
Example:
```
node dist/cli/index.js summarize --input /path/to/book.md --output /path/to/summary.md
```
Without build:
```
npm run dev -- summarize --input /path/to/book.md --output /path/to/summary.md
```

### export
Purpose: export Markdown to HTML or PDF.
How it works: converts Markdown to the selected format and saves next to input.
Parameters: `--input <path>`, `--format <html|pdf>`, `--overwrite`
Example:
```
node dist/cli/index.js export --input /path/to/summary.md --format html
```
Without build:
```
npm run dev -- export --input /path/to/summary.md --format pdf
```

## Configuration

Copy `.env.example` to `.env` and adjust values:
- `LLM_URL`, `LLM_MODEL`, `LLM_API_KEY`
- `LLM_MAX_CONTEXT_TOKENS`, `LLM_MAX_OUTPUT_TOKENS`
- `LLM_TEMPERATURE`, `LLM_TOP_P`, penalties
- `LLM_DENSITY_PASSES`
- `LLM_SYSTEM_PROMPT_PATH`
