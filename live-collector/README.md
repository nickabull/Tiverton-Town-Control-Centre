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

## Deploy using GitHub Actions instead of local Wrangler

An Actions workflow is now available: `.github/workflows/deploy-tivvy-live-service.yml`.

Set repository **Actions secrets** `CLOUDFLARE_API_TOKEN` (Workers deployment permissions) and `CLOUDFLARE_ACCOUNT_ID` (your Cloudflare account ID). The existing `X_BEARER_TOKEN` secret is forwarded securely during deployment. Run **Deploy Tivvy Live collector** on `main`. Confirm the actual workers.dev URL in the deployment job output and test its `/health` then `/live` endpoints before activating it in the Match Centre. Do not put a Cloudflare API token in chat or code.

If no Cloudflare Worker has been deployed, the Match Centre uses the existing GitHub snapshots and does **not** gain genuinely live polling simply from committing these files.
