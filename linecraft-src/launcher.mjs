import http from "node:http";
import { spawn } from "node:child_process";

const VERSION = "1.0.1";
const HOST = "127.0.0.1";
const PORT = 8787;
const LOCAL_URL = `http://${HOST}:${PORT}/`;
const SITE_ORIGIN = "https://ojas-singh.github.io";
const APP_PATH = "/linecraft/app/";
const CHAT_TARGET = "https://opencode.ai/zen/go/v1/chat/completions";

if (Number(process.versions.node.split(".")[0]) < 18) {
  console.error("LineCraft requires Node.js 18 or newer.");
  process.exit(1);
}

function json(response, status, value, extra = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...extra });
  response.end(JSON.stringify(value));
}

function errorPage(response, message) {
  response.writeHead(502, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(`<!doctype html><title>LineCraft unavailable</title><style>body{font:16px system-ui;max-width:680px;margin:12vh auto;padding:24px;color:#292524}code{background:#f5f5f4;padding:2px 5px;border-radius:5px}</style><h1>LineCraft could not load</h1><p>${escapeHtml(message)}</p><p>Check your internet connection and reload. The launcher must remain running in this terminal.</p><p><code>curl http://127.0.0.1:8787/health</code></p>`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function bodyBuffer(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function staticUrl(pathname, search) {
  if (pathname === "/") return `${SITE_ORIGIN}${APP_PATH}${search}`;
  if (pathname.startsWith(APP_PATH)) return `${SITE_ORIGIN}${pathname}${search}`;
  return null;
}

async function proxyStatic(request, response, url) {
  const target = staticUrl(url.pathname, url.search);
  if (!target) {
    json(response, 404, { error: "Not found" });
    return;
  }
  try {
    const upstream = await fetch(target, { method: request.method, redirect: "follow" });
    const headers = { "Content-Type": upstream.headers.get("content-type") || "application/octet-stream" };
    // Node fetch transparently decompresses upstream bodies. Forwarding the
    // compressed Content-Length would make browsers truncate HTML and assets.
    for (const name of ["etag", "last-modified"]) {
      const value = upstream.headers.get(name);
      if (value) headers[name] = value;
    }
    headers["Cache-Control"] = url.pathname === "/" || url.pathname.endsWith("/index.html")
      ? "no-store"
      : "public, max-age=31536000, immutable";
    response.writeHead(upstream.status, headers);
    if (request.method !== "HEAD" && upstream.body) {
      for await (const chunk of upstream.body) response.write(chunk);
    }
    response.end();
  } catch (error) {
    errorPage(response, error);
  }
}

async function proxyChat(request, response) {
  try {
    const upstream = await fetch(CHAT_TARGET, {
      method: "POST",
      headers: {
        Authorization: request.headers.authorization || "",
        "Content-Type": request.headers["content-type"] || "application/json",
      },
      body: await bodyBuffer(request),
    });
    response.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    });
    if (upstream.body) for await (const chunk of upstream.body) response.write(chunk);
    response.end();
  } catch (error) {
    json(response, 502, { error: "LineCraft could not reach OpenCode Go", detail: String(error) });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", LOCAL_URL);
  if (request.method === "GET" && url.pathname === "/health") {
    json(response, 200, { ok: true, service: "linecraft-launcher", version: VERSION, app: LOCAL_URL }, { "Cache-Control": "no-store" });
    return;
  }
  if (request.method === "POST" && url.pathname === "/chat/completions") {
    await proxyChat(request, response);
    return;
  }
  if (request.method === "GET" || request.method === "HEAD") {
    await proxyStatic(request, response, url);
    return;
  }
  json(response, 405, { error: "Method not allowed" }, { Allow: "GET, HEAD, POST" });
});

function openBrowser(url) {
  if (process.env.LINECRAFT_NO_OPEN === "1") return true;
  const command = process.platform === "darwin" ? ["open", [url]]
    : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
      : ["xdg-open", [url]];
  try {
    const child = spawn(command[0], command[1], { detached: true, stdio: "ignore" });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

async function existingLineCraft() {
  try {
    const response = await fetch(`${LOCAL_URL}health`, { signal: AbortSignal.timeout(1500) });
    const data = await response.json();
    return response.ok && data?.service === "linecraft-launcher" && data?.version === VERSION;
  } catch {
    return false;
  }
}

async function handlePortConflict() {
  if (await existingLineCraft()) {
    console.log(`LineCraft is already running at ${LOCAL_URL}`);
    if (!openBrowser(LOCAL_URL)) console.log(`Open ${LOCAL_URL} in your browser.`);
    process.exit(0);
  }
  console.error(`Port ${PORT} is already in use by another application.`);
  if (process.platform === "win32") {
    console.error(`Inspect it: netstat -ano | findstr :${PORT}`);
    console.error("Stop it manually: taskkill /PID <PID> /F");
  } else if (process.platform === "linux") {
    console.error(`Inspect it: ss -ltnp 'sport = :${PORT}'`);
    console.error("Stop it manually: kill <PID>");
  } else {
    console.error(`Inspect it: lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);
    console.error("Stop it manually: kill <PID>");
  }
  console.error("LineCraft did not terminate or replace the existing process.");
  process.exit(1);
}

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") void handlePortConflict();
  else { console.error(`LineCraft failed to start: ${error}`); process.exit(1); }
});

function shutdown() {
  console.log("\nStopping LineCraft…");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(PORT, HOST, () => {
  console.log(`LineCraft ${VERSION} is running at ${LOCAL_URL}`);
  console.log("Keep this terminal open. Press Ctrl+C to stop.");
  if (!openBrowser(LOCAL_URL)) console.log(`Open ${LOCAL_URL} in your browser.`);
});
