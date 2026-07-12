import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");
const appDist = resolve(appRoot, "dist");
const siteRoot = resolve(repoRoot, "_site");
const linecraftTarget = resolve(siteRoot, "linecraft");
const branchLinecraftTarget = resolve(repoRoot, "linecraft");

const EXCLUDED_ROOT_ENTRIES = new Set([
  ".git",
  ".github",
  "_site",
  "linecraft",
  "linecraft-src",
]);

function copyRootSite() {
  rmSync(siteRoot, { recursive: true, force: true });
  mkdirSync(siteRoot, { recursive: true });

  for (const entry of readdirSync(repoRoot)) {
    if (EXCLUDED_ROOT_ENTRIES.has(entry)) continue;

    const source = resolve(repoRoot, entry);
    const target = resolve(siteRoot, basename(entry));
    cpSync(source, target, { recursive: statSync(source).isDirectory() });
  }
}

function emptyDirectory(path) {
  mkdirSync(path, { recursive: true });
  for (const entry of readdirSync(path)) {
    rmSync(resolve(path, entry), { recursive: true, force: true });
  }
}

if (!existsSync(appDist)) {
  throw new Error(`Missing Vite build output: ${appDist}`);
}

copyRootSite();
mkdirSync(linecraftTarget, { recursive: true });
cpSync(appDist, linecraftTarget, { recursive: true });
emptyDirectory(branchLinecraftTarget);
cpSync(appDist, branchLinecraftTarget, { recursive: true });

console.log(`Copied full GitHub Pages site to ${siteRoot}`);
console.log(`Copied LineCraft static build to ${linecraftTarget}`);
console.log(`Copied branch-based LineCraft build to ${branchLinecraftTarget}`);
