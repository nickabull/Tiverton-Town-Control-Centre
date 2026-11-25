/**
 * Tivvy WhatsApp Cloud API webhook receiver (isolated, not yet deployed).
 *
 * Required Worker secrets: META_WEBHOOK_VERIFY_TOKEN, META_APP_SECRET.
 * Required private R2 binding: WEBHOOK_ARCHIVE.
 * No live publishing is performed. This first stage archives signed messages.
 */
const enc = new TextEncoder();

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function validSignature(request, raw, secret) {
  const header = request.headers.get("x-hub-signature-256") || "";
  if (!/^sha256=[0-9a-f]{64}$/i.test(header)) return false;
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, raw));
  const expected = bytesToHex(signed);
  const provided = header.slice(7).toLowerCase();
  // Constant-work hex comparison for correctly formatted digest strings.
  let different = 0;
  for (let i = 0; i < expected.length; i++) {
    different |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return different === 0;
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse({ status: "ok", service: "tivvy-whatsapp-webhook", stage: "receive-only" }, 200);
    }
    if (url.pathname !== "/webhook") return jsonResponse({ error: "not_found" }, 404);

    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && env.META_WEBHOOK_VERIFY_TOKEN &&
          token === env.META_WEBHOOK_VERIFY_TOKEN && challenge !== null) {
        return new Response(challenge, {
          status: 200, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
        });
      }
      return jsonResponse({ error: "verification_failed" }, 403);
    }
    if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
    if (!env.META_APP_SECRET || !env.WEBHOOK_ARCHIVE) {
      return jsonResponse({ error: "receiver_not_configured" }, 503);
    }

    const raw = await request.arrayBuffer();
    if (raw.byteLength > 1024 * 1024) return jsonResponse({ error: "payload_too_large" }, 413);
    if (!(await validSignature(request, raw, env.META_APP_SECRET))) {
      return jsonResponse({ error: "signature_invalid" }, 403);
    }

    let payload;
    try { payload = JSON.parse(new TextDecoder().decode(raw)); }
    catch { return jsonResponse({ error: "invalid_json" }, 400); }
    if (payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) {
      return jsonResponse({ error: "unexpected_event" }, 400);
    }

    // Private, durable raw event archive. Do not log bodies, phone numbers or tokens.
    // Use the canonical raw bytes for audit; no downstream publishing is authorised.
    const digest = bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", raw)));
    const key = "events/" + digest.slice(0, 2) + "/" + digest + ".json";
    try {
      if (!(await env.WEBHOOK_ARCHIVE.head(key))) {
        await env.WEBHOOK_ARCHIVE.put(key, raw, {
          httpMetadata: { contentType: "application/json" },
          customMetadata: { source: "meta-whatsapp", checksumSha256: digest }
        });
      }
    } catch {
      // Let Meta retry rather than claiming acceptance without durable storage.
      return jsonResponse({ error: "archive_unavailable" }, 503);
    }
    return jsonResponse({ received: true }, 200);
  }
};
