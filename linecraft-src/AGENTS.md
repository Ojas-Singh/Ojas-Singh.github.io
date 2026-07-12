# AGENTS.md

This is a static browser-based AI writing workbench called **LineCraft**.

## Core principles

- No required backend.
- GitHub Pages compatible.
- User data stays local (IndexedDB via Dexie, sessionStorage/localStorage for keys).
- API key is user-provided in the browser.
- Do not hardcode secrets.
- Do not commit API keys or `.env` files.
- Keep AI actions small and reversible (sentence-level default).
- Preserve user context and writing style.
- Avoid generic AI writing ("AI slop").
- Sentence-level editing is the main feature.

## Preferred stack

- **Vite** (build tool)
- **React 19** (UI)
- **TypeScript** (type safety)
- **Tailwind CSS v4** (styling via `@tailwindcss/vite` plugin)
- **Dexie.js** (IndexedDB wrapper)
- **OpenCode Go API** (LLM provider, endpoint: `https://opencode.ai/zen/go/v1/chat/completions`)

## File structure

```
linecraft/
  src/
    app/          - App shell, routing
    components/   - UI components grouped by feature
    lib/          - Business logic (ai, parsing, storage, etc.)
    types/        - TypeScript type definitions
    data/         - Default data (style profiles, etc.)
  vite.config.ts
  tsconfig.json
  index.html
```

## Prompt rules

- Keep all AI prompts in `src/lib/ai/prompts.ts`.
- Do not scatter prompt strings across components.
- Prefer strict JSON for structured LLM responses.
- Always handle invalid JSON with `src/lib/ai/json.ts`.

## Storage rules

- Keep all data local-first.
- Do not add a backend unless explicitly requested.
- API keys: sessionStorage (default) or localStorage based on user setting. Never in IndexedDB.

## UI priorities

The core workflow in order:
1. Style profile (extract from samples)
2. Context dump (messy notes, audience, goal)
3. Draft generation (full draft in user's style)
4. Sentence workbench (split, variants, accept)
5. Export (copy, .txt, .md, project JSON)

## Before changing anything

- Read the build plan first.
- Follow existing code patterns.
- Use the `@/` path alias for imports from `src/`.
