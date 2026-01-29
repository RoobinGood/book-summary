# Book Summary CLI

CLI tool to convert EPUB files to Markdown, select a section via TUI, and summarize it using an OpenAI-compatible LLM with Chain of Density.

## Build

```
npm install
npm run build
```

## Run

```
node dist/index.js --input /path/to/book.epub --output /path/to/summary.md
```

Optional flags:
- `--overwrite` to replace an existing output file
- `--cache` to store and reuse `<input>.md` and `<input>.md5`

## Run without build

```
npm run dev -- --input /path/to/book.epub --output /path/to/summary.md
```

## Configuration

Copy `.env.example` to `.env` and adjust values:
- `LLM_URL`, `LLM_MODEL`, `LLM_API_KEY`
- `LLM_MAX_CONTEXT_TOKENS`, `LLM_MAX_OUTPUT_TOKENS`
- `LLM_TEMPERATURE`, `LLM_TOP_P`, penalties
- `LLM_DENSITY_PASSES`
- `LLM_SYSTEM_PROMPT_PATH`
