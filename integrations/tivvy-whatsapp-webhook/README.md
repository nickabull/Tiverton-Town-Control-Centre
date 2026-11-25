# Tivvy Live: isolated WhatsApp webhook receiver

**Status: source committed only; NOT deployed, NOT connected to Meta.**

This receiver is independent of the existing Tivvy Live collector and programme storage Worker. The live matchday Workers and GitHub deployment workflows are intentionally unchanged.

## What it does

- GET `/webhook`: validates Meta's exact `hub.verify_token` and returns `hub.challenge` to complete webhook registration.
- POST `/webhook`: validates the `X-Hub-Signature-256` HMAC-SHA256 against the **raw request bytes**, checks envelope type, and archives each valid signed event verbatim into a **private** Cloudflare R2 bucket, deduplicating exact identical deliveries by SHA-256 content.
- GET `/health`: reports that the receiver process is responding, **not** that Meta is subscribed or messages are delivered.
- Does **not** yet parse/post Darren's commentary, identify authorised correspondents, expose archives, reply to anyone, alter the website, or send any paid templates.

## Provisioning needed before entering anything in Meta

1. Create a **separate** private R2 bucket (suggested name `tivvy-whatsapp-inbound-private`); configure a new isolated Cloudflare Worker with binding `WEBHOOK_ARCHIVE` referencing it. Do not reuse the programme-artwork R2 bucket.
2. Set Cloudflare Worker **secrets**, never plaintext files or GitHub: `META_WEBHOOK_VERIFY_TOKEN` (a fresh random high-entropy string generated privately) and `META_APP_SECRET` (the existing app secret from the Tivvy Live Messaging Meta app). Do not share either in a chat, URL, repository or logs. The verify token is different from any WhatsApp API access token.
3. Deploy Worker source `src/index.js` under a new Worker name. Neither the existing live collector nor an unrelated Worker should be replaced. Before the first deployment, verify the correct account and bindings; no auto-deploy is configured in this folder.
4. Verify GET `/health`; test GET `/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...` privately and ensure wrong tokens fail with 403. POST with incorrect signature must fail with 403; with correct signature and R2 available must return 200 and create a private object.
5. Only **after** deployment and successful verification, paste `https://<actual-worker-host>/webhook` and the exact verify token into Meta's callback form. Subscribe to `messages` events. Do not invent the URL in advance. Note that Meta's developer app is currently unpublished and warns actual production webhook traffic may not flow until published.
6. Once the first real signed event is archived, make a separate, reviewed change to process only approved reporter identities with replay protection and editorial audit; until that stage, no content should be automatically published.

## Security and retention

The stored raw events may contain personal phone numbers and message contents. Keep R2 private, restrict account access and establish a retention/deletion policy and lawful basis before production. Configure monitoring without recording raw payloads or credentials. This initial staging receiver is **not** a full production data-handling implementation.

## Progress

At time of writing, user verified WhatsApp two-way message delivery to/from the live Meta sender. The webhook has not yet received a real event. The WhatsApp overall progress remains 6/10 until live webhook receipt is verified.
