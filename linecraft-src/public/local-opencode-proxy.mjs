import http from "node:http";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 8787);
const TARGET = "https://opencode.ai/zen/go/v1/chat/completions";
const ALLOWED_ORIGINS = new Set([
  "https://ojas-singh.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://ojas-singh.github.io";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function sendJson(response, status, body, origin) {
  response.writeHead(status, {
    ...corsHeaders(origin),
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  const url = new URL(request.url || "/", `http://${HOST}:${PORT}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders(origin));
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true, service: "linecraft-opencode-proxy" }, origin);
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/chat/completions") {
    sendJson(response, 404, { error: "Not found" }, origin);
    return;
  }

  try {
    const body = await readBody(request);
    const upstream = await fetch(TARGET, {
      method: "POST",
      headers: {
        Authorization: request.headers.authorization || "",
        "Content-Type": request.headers["content-type"] || "application/json",
      },
      body,
    });

    response.writeHead(upstream.status, {
      ...corsHeaders(origin),
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    });

    if (upstream.body) {
      for await (const chunk of upstream.body) response.write(chunk);
    }
    response.end();
  } catch (error) {
    sendJson(
      response,
      502,
      { error: "Proxy could not reach OpenCode Go", detail: String(error) },
      origin
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(`LineCraft OpenCode Go proxy running at http://${HOST}:${PORT}`);
  console.log("Keep this terminal open while using https://ojas-singh.github.io/linecraft/");
});
