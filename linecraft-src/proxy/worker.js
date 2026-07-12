/**
 * LineCraft CORS Proxy — Cloudflare Worker
 *
 * Forwards browser requests to OpenCode Go and adds CORS headers.
 * Needed for production (GitHub Pages) since direct browser requests to
 * opencode.ai are blocked by CORS.
 *
 * For local dev (npm run dev), no proxy is needed — Vite's built-in proxy
 * handles it automatically.
 *
 * === Deploy via wrangler CLI (recommended) ===
 *
 *   npx wrangler deploy
 *
 * Or deploy manually:
 *   1. Go to https://dash.cloudflare.com
 *   2. Workers & Pages → Create → Create Worker
 *   3. Click "Edit code" (not the quick edit if it doesn't show a code editor)
 *   4. Paste this script and click "Deploy"
 *   5. Copy the URL and paste into LineCraft Settings → CORS Proxy URL
 *
 * Security: This Worker does not log, store, or inspect your API key or data.
 * It only forwards the request and adds CORS headers on the response.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Only allow POST to /chat/completions
    const url = new URL(request.url);
    if (url.pathname !== "/chat/completions") {
      return new Response("Not found", {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const response = await fetch(
        "https://opencode.ai/zen/go/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: request.headers.get("Authorization") || "",
            "Content-Type": "application/json",
          },
          body: request.body,
        }
      );

      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Proxy could not reach OpenCode Go" }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
