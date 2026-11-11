# Tivvy Live dedicated collector (deployment required)

The GitHub Pages display cannot run a persistent server-side process. This Cloudflare Worker + Durable Object is a separate, shared cache. A browser polling /live every 20 seconds does not cause every visitor to call the Southern League; the Durable Object limits upstream calls to one per ~20 seconds across visitors. X is polled at most every 3 minutes, and posts are retained and de-duplicated.

**Nothing is deployed yet.** Deployment requires access to a Cloudflare account and Workers. The X bearer token must be configured as a Worker secret, not placed in frontend HTML or committed to GitHub.

Deployment from the folder `live-collector`:

1. `npx wrangler login`
2. `npx wrangler deploy`
3. Optional: `npx wrangler secret put X_BEARER_TOKEN` (use the existing credential from GitHub Actions; do not paste it into a public file)
4. Verify `https://<your-worker-host>/health` and `https://<your-worker-host>/live`.
5. On the Match Centre use `?liveApi=https%3A%2F%2F<your-worker-host>%2Flive` to enable the new collector for a test, or set the URL in the frontend configuration once verified.

The public Match Centre continues to work from GitHub JSON if the live Worker is unavailable. For now it remains a **test**; confirm Southern League API conditions and X API cost/rate limits before production use.
