# LineCraft

**Context-first AI writing, refined sentence by sentence.**

A browser-based AI writing workbench - dump messy context, get polished drafts in your style, and refine them sentence by sentence.

## How it works

1. **Style Profile** - Paste or upload writing samples. The AI extracts your writing style.
2. **Context Dump** - Dump everything: bullet points, half-written arguments, data. Messy is fine.
3. **Generate Draft** - The AI writes a complete first draft in your style, for your target format.
4. **Highlight Workbench** - Highlight any passage, compare controlled variants, and accept the one you like.
5. **Export** - Copy to clipboard, download as `.txt` or `.md`, or export the full project as `.json`.

## Tech stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (styling)
- **Dexie.js** (local IndexedDB storage)
- **OpenCode Go API** (LLM provider at `opencode.ai/zen/go/v1/chat/completions`)

## Running locally

```bash
cd linecraft-src
npm install
npm run dev
```

Opens at `http://localhost:5173/linecraft/app/`.

## Build for production

```bash
npm run build
npm run preview
```

## Build static files for GitHub Pages

From the repository root, run:

```bash
cd linecraft-src
npm ci
npm run build:pages
```

The complete release will be written to both `linecraft/` for branch-based GitHub Pages and `_site/linecraft/` for Actions-based GitHub Pages. The public landing page serves at:

```text
https://ojas-singh.github.io/linecraft/
```

## API key

You need an [OpenCode Go](https://opencode.ai) subscription API key.

**Your API key is held by the browser and forwarded through the loopback launcher to OpenCode Go.** It is never written by the launcher or sent to GitHub Pages.

### Storage modes

| Mode | Where | Cleared when |
|---|---|---|
| Session only | `sessionStorage` | Browser tab closes |
| Save on device | `localStorage` | Manual clear |
| Do not save | Browser memory only | Every page refresh |

Default: **session only**.

> Because this is a browser app, the API key cannot be truly hidden. Anyone with access to your browser's developer tools can see it.

## One-command local launcher

The public URL is a launch page. It provides a self-contained Node command that starts the app at:

```text
http://127.0.0.1:8787/
```

No repository checkout, dependency installation, or compilation is required. Node.js 18+ is the only local prerequisite.

Windows PowerShell:

```powershell
irm https://ojas-singh.github.io/linecraft/launcher.mjs | node --input-type=module
```

macOS, Linux, or Git Bash:

```bash
curl -fsSL https://ojas-singh.github.io/linecraft/launcher.mjs | node --input-type=module
```

Health check:

```bash
curl http://127.0.0.1:8787/health
```

The launcher serves the current compiled app through the local origin, forwards AI requests to OpenCode Go, opens the browser automatically, and must remain running while LineCraft is in use.

## All data is local

- Drafts, style profiles, and projects are stored in **IndexedDB** (via Dexie.js).
- Nothing is sent to any server except OpenCode Go for model listing and AI generation.
- No accounts, no cloud sync, no analytics.

## Deploying to GitHub Pages

This project is configured to deploy to GitHub Pages at `ojas-singh.github.io/linecraft/`.

The deployed layout is:

```text
/linecraft/              landing page
/linecraft/launcher.mjs  self-contained local launcher
/linecraft/app/          compiled Vite application
```

The GitHub Actions workflow in `.github/workflows/deploy-linecraft.yml`:
1. Builds the Vite app with `npm run build:pages`
2. Assembles the landing page, launcher, and compiled app in `_site/linecraft/`
3. Deploys via `actions/deploy-pages@v4`

## Known limitations

- **The local launcher requires internet access.** It streams the current app assets from GitHub Pages and sends AI requests to OpenCode Go.
- **PDF worker** is bundled (~1.3MB) and increases the download size. Future optimization: lazy-load the worker.

## File structure

```text
linecraft-src/
  src/
    App.tsx                   - Root component with tab navigation
    components/
      settings/               - API key, model, connection test
      style/                  - Upload samples, extract and edit style profiles
      context/                - Context dump form, draft generation
      draft/                  - Draft editor, versioning panel
      sentence/               - Sentence split, variant picker, context box
      export/                 - Copy, download, import/export projects
    lib/
      ai/                     - opencodeGo.ts (API adapter), prompts.ts, json.ts
      parsing/                - text.ts, docx.ts, pdf.ts
      sentence/               - splitSentences.ts, replaceSentence.ts
      storage/                - db.ts (Dexie), settings.ts, styleProfiles.ts, projects.ts
    types/                    - settings.ts, styleProfile.ts, project.ts, sentence.ts
    data/                     - defaultStyleProfiles.ts
  vite.config.ts
  index.html
```

## License

MIT
