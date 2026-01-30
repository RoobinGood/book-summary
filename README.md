# Book Summary CLI

CLI tool to convert EPUB files to Markdown, select a section via TUI, and summarize it using an OpenAI-compatible LLM with Chain of Density.

## Build

```
npm install
npm run build
```

## Run

Summarize:
```
node dist/cli/index.js summarize --input /path/to/book.epub --output /path/to/summary.md
```

Optional flags for summarize:
- `--overwrite` to replace an existing output file
- `--cache` to store and reuse `<input>.md` and `<input>.md5`

Export Markdown:
```
node dist/cli/index.js export --input /path/to/summary.md --format html
```

Optional flags for export:
- `--overwrite` to replace an existing output file

## Run without build

Summarize:
```
npm run dev -- summarize --input /path/to/book.epub --output /path/to/summary.md
```

Export Markdown:
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
