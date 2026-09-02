---
name: StaticClock
description: Use when calling StaticClock hosted /v1 or installing the local package. Author Aziel Eliab.
---

# StaticClock

It does not help messages travel farther. It helps them arrive intact. Author: **Aziel Eliab**.

**THIS IS:** a chrono-linguistic release advisory (five fields).

**THIS IS NOT:** a scheduler, targeting tool, analytics, user-profile, or virality optimizer. Hosted `/v1` does not increment downloads or views.

Always send `User-Agent: Mozilla/5.0`. Cloudflare Workers may 403 an empty agent.

## Call these URLs

- Worker OpenAPI: https://staticclock-download-tracker.vibelock.workers.dev/openapi.json
- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
- MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`
- Live skill (this markdown): `GET https://staticclock-download-tracker.vibelock.workers.dev/v1/skill`

Ops (do **not** increment downloads or views):

- `GET /v1/health` — liveness
- `GET /v1/skill` — this file
- Product POSTs listed in OpenAPI

Grok: import OpenAPI as a custom tool. ChatGPT: GPT Actions. Venice: HTTP tools.

## Example

```bash
curl -s -A 'Mozilla/5.0' https://staticclock-download-tracker.vibelock.workers.dev/v1/health
curl -s -A 'Mozilla/5.0' https://staticclock-download-tracker.vibelock.workers.dev/v1/skill
```

## Local (after one-click install)

```bash
curl -fsSL https://staticclock-download-tracker.vibelock.workers.dev/install.sh | bash
staticclock ui
staticclock doctor
```

Then open http://127.0.0.1:8765 (loopback only).

Counted download (gzip HTTP 200, no 302): https://staticclock-download-tracker.vibelock.workers.dev/download?asset=staticclock-0.1.0.tar.gz
GitHub: https://github.com/AzielEliab/staticclock

## Catalog + local UI

Author: **Aziel Eliab**. Honest scope: Five advisory fields for a geo. Not a scheduler. Pointer to ChronoLock.

- Catalog product: https://aziel-runtime.vibelock.workers.dev/p/staticclock/
- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
- Catalog MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`
- This Worker skill: `GET https://staticclock-download-tracker.vibelock.workers.dev/v1/skill`
- This Worker OpenAPI: https://staticclock-download-tracker.vibelock.workers.dev/openapi.json
- Sample payload: `GET https://staticclock-download-tracker.vibelock.workers.dev/v1/example`

Local UI: **Import JSON file** (`type=file`) and **Export JSON**. Then `staticclock doctor`.

Grok: import catalog or Worker OpenAPI as a custom tool. ChatGPT: GPT Actions. Venice: HTTP tools.
