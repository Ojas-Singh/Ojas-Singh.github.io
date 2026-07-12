import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");
const appDist = resolve(appRoot, "dist");
const landingRoot = resolve(appRoot, "landing");
const launcherSource = resolve(appRoot, "launcher.mjs");
const faviconSource = resolve(appRoot, "public", "favicon.svg");
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
if (!existsSync(landingRoot) || !existsSync(launcherSource)) {
  throw new Error("Missing LineCraft landing page or launcher source");
}

function assembleLineCraft(target) {
  emptyDirectory(target);
  cpSync(landingRoot, target, { recursive: true });
  cpSync(launcherSource, resolve(target, "launcher.mjs"));
  cpSync(faviconSource, resolve(target, "favicon.svg"));
  cpSync(appDist, resolve(target, "app"), { recursive: true });
}

copyRootSite();
assembleLineCraft(linecraftTarget);
assembleLineCraft(branchLinecraftTarget);

console.log(`Copied full GitHub Pages site to ${siteRoot}`);
console.log(`Assembled LineCraft landing, launcher, and app at ${linecraftTarget}`);
console.log(`Assembled branch-based LineCraft release at ${branchLinecraftTarget}`);
