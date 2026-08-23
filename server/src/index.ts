/**
 * Thin proxy in front of NCSpeech Studio's ASR/TTS API.
 *
 * The app never sees the real NCSpeech key — it's stored as a Worker secret
 * (NCSPEECH_API_KEY, set via `wrangler secret put`) and injected here. This
 * closes the gap described in https://github.com/bigkozha/memory-cards/issues/1:
 * a key shipped inside a compiled app bundle is trivially extractable, but a
 * key that only ever lives in this Worker's environment is not.
 *
 * Abuse protection is a simple in-memory sliding-window rate limit per
 * client IP. It's best-effort (resets on cold start, not shared across edge
 * locations) rather than a hard guarantee — a reasonable deterrent for an
 * app this size without adding a KV/Durable Object dependency. If abuse
 * becomes a real problem, upgrade to Cloudflare's Rate Limiting API bound
 * through a namespace instead of this in-memory map.
 */

export interface Env {
  NCSPEECH_API_KEY: string;
}

const NCSPEECH_BASE_URL = "https://studio.ncspeech.ai/v1";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const requestLog = new Map<string, number[]>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(clientId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  requestLog.set(clientId, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function jsonError(status: number, message: string): Response {
  return withCors(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return withCors(new Response("ok"));
    }

    const clientId = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (isRateLimited(clientId)) {
      return jsonError(429, "Too many requests — slow down and try again shortly.");
    }

    if (request.method !== "POST") {
      return jsonError(405, "Method not allowed");
    }

    if (url.pathname === "/audio/transcriptions") {
      return proxy(request, env, "/audio/transcriptions");
    }
    if (url.pathname === "/audio/speech") {
      return proxy(request, env, "/audio/speech");
    }

    return jsonError(404, "Not found");
  },
};

async function proxy(request: Request, env: Env, upstreamPath: string): Promise<Response> {
  const contentType = request.headers.get("Content-Type") ?? "";
  const headers: Record<string, string> = { "X-API-Key": env.NCSPEECH_API_KEY };
  if (contentType) headers["Content-Type"] = contentType;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${NCSPEECH_BASE_URL}${upstreamPath}`, {
      method: "POST",
      headers,
      body: request.body,
      // @ts-expect-error Cloudflare Workers requires this for streaming request bodies.
      duplex: "half",
    });
  } catch (err) {
    return jsonError(502, `Upstream request failed: ${err instanceof Error ? err.message : err}`);
  }

  return withCors(upstreamRes);
}
