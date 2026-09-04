---
name: StaticClock
description: Use when recording an action into an immutable gear-click timeline, or when an AZ-OS session should lock an action forward. No rollbacks. Hosted /v1 via this Worker or aziel-runtime. Author Aziel Eliab.
---

# StaticClock

Every action is a gear click. Time only locks forward.

Author: **Aziel Eliab**.

**THIS IS:** an action-based immutable timeline. Each action is a click or second that locks forward. AZ-OS hook records principle-bound actions into the gear.

**THIS IS NOT:** a rollback clock, a remote shell, or ChronoLock. ChronoLock is the related advisory-window product. TemporalLock is observation receipts. Hosted `/v1` does not increment downloads or views and does not store a chain.

Always send `User-Agent: Mozilla/5.0`. Cloudflare Workers may 403 an empty agent.

## Call these URLs

- Worker OpenAPI: https://staticclock-download-tracker.vibelock.workers.dev/openapi.json
- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
- MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`
- Live skill (this markdown): `GET https://staticclock-download-tracker.vibelock.workers.dev/v1/skill`

Ops (do **not** increment downloads or views):

- `GET /v1/health` — liveness
- `GET /v1/skill` — this file
- `GET /v1/example` — sample click payload
- `GET /v1/anchors` — Top-30 geographic anchors
- `POST /v1/click` — append one click (send existing `clicks` if any)
- `POST /v1/hook` — AZ-OS hook; records, does not exec
- `POST /v1/verify` — recompute hashes
- `POST /v1/timeslate` — tip timeslate; TemporalLock binds this cross-hash into its lattice
- `POST /v1/advisory` — companion advisory for a last-known geo

There is no rollback. `POST /v1/rollback` returns 400.

Grok: import OpenAPI as a custom tool. ChatGPT: GPT Actions. Venice: HTTP tools.

## Example

```bash
curl -s -A 'Mozilla/5.0' https://staticclock-download-tracker.vibelock.workers.dev/v1/health
curl -s -A 'Mozilla/5.0' -X POST https://staticclock-download-tracker.vibelock.workers.dev/v1/click \
  -H 'content-type: application/json' \
  -d '{"action":"opened the ledger"}'
curl -s -A 'Mozilla/5.0' -X POST https://staticclock-download-tracker.vibelock.workers.dev/v1/hook \
  -H 'content-type: application/json' \
  -d '{"action":"invite accepted","session":"azos-1"}'
curl -s -A 'Mozilla/5.0' https://staticclock-download-tracker.vibelock.workers.dev/v1/skill
```

## Local (after one-click install)

```bash
curl -fsSL https://staticclock-download-tracker.vibelock.workers.dev/install.sh | bash
staticclock ui
staticclock doctor
```

Then open http://127.0.0.1:8765 (loopback only). Click the gear. Optional AZ-OS hook, Import JSON, Export JSON, Verify.

Counted download (gzip HTTP 200, no 302): https://staticclock-download-tracker.vibelock.workers.dev/download?asset=staticclock-0.2.0.tar.gz
GitHub: https://github.com/AzielEliab/staticclock
