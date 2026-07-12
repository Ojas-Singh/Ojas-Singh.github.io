# LineCraft

**Context-first AI writing, refined sentence by sentence.**

A browser-based AI writing workbench - dump messy context, get polished drafts in your style, and refine them sentence by sentence.

## How it works

1. **Style Profile** - Paste or upload writing samples. The AI extracts your writing style.
2. **Context Dump** - Dump everything: bullet points, half-written arguments, data. Messy is fine.
3. **Generate Draft** - The AI writes a complete first draft in your style, for your target format.
4. **Sentence Workbench** - Split the draft into sentences, generate variants, and accept the one you like.
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

Opens at `http://localhost:5173/linecraft/`.

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

The static app will be written to both `linecraft/` for branch-based GitHub Pages and `_site/linecraft/` for Actions-based GitHub Pages. It serves at:

```text
https://ojas-singh.github.io/linecraft/
```

## API key

You need an [OpenCode Go](https://opencode.ai) subscription API key.

**Your API key is sent directly from your browser to OpenCode Go.** The app is a static frontend, so GitHub Pages cannot provide a server-side API route by itself.

### Storage modes

| Mode | Where | Cleared when |
|---|---|---|
| Session only | `sessionStorage` | Browser tab closes |
| Save on device | `localStorage` | Manual clear |
| Do not save | Browser memory only | Every page refresh |

Default: **session only**.

> Because this is a browser app, the API key cannot be truly hidden. Anyone with access to your browser's developer tools can see it.

## Browser-only OpenCode Go behavior

LineCraft does not require a public backend, Cloudflare Worker, or browser extension to deploy.

The OpenCode Go model list endpoint currently works from the browser, so LineCraft loads the current model list dynamically. AI generation attempts direct browser requests to the OpenCode Go chat completions endpoint.

If chat completions fail with CORS, that is a browser security restriction enforced by OpenCode Go's response headers. Frontend JavaScript, GitHub Pages, Vite, and `fetch` options cannot bypass server CORS rules. Browser-only AI generation will work if OpenCode Go allows web origins for chat completions.

By default, LineCraft uses a personal local proxy at:

```text
http://localhost:8787
```

Users can start it from any folder with one command.

Windows PowerShell:

```powershell
irm https://ojas-singh.github.io/linecraft/local-opencode-proxy.mjs | node --input-type=module
```

macOS, Linux, or Git Bash:

```bash
curl -fsSL https://ojas-singh.github.io/linecraft/local-opencode-proxy.mjs | node --input-type=module
```

Health check:

```bash
curl http://localhost:8787/health
```

## All data is local

- Drafts, style profiles, and projects are stored in **IndexedDB** (via Dexie.js).
- Nothing is sent to any server except OpenCode Go for model listing and AI generation.
- No accounts, no cloud sync, no analytics.

## Deploying to GitHub Pages

This project is configured to deploy to GitHub Pages at `ojas-singh.github.io/linecraft/`.

The GitHub Actions workflow in `.github/workflows/deploy-linecraft.yml`:
1. Builds the Vite app with `npm run build:pages`
2. Copies the output into `_site/linecraft/`
3. Deploys via `actions/deploy-pages@v4`

## Known limitations

- **Browser-only AI generation depends on OpenCode Go CORS.** Model listing works in the browser, but chat completions can only work if OpenCode allows browser origins for that endpoint.
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
