# staticclock download tracker

Isolated Worker `staticclock-download-tracker`. Project `staticclock`.
KV namespace `STATICCLOCK_DOWNLOADS` bound as `DOWNLOADS`.
Does **not** 302 to GitHub on `/download`. Serves gzip via `ASSETS.fetch`,
`Cache-Control: private, no-store`.

GET `/` is the **product homepage** (title `StaticClock — Aziel Eliab`):
counted download, one-click install, rose-star brand mark, and an interactive
workspace for `/v1` click / hook / verify / timeslate / advisory. Increments
a **page-view** counter (separate from downloads).
GET `/download` increments **downloads**.
`/v1` never increments DOWNLOADS KV.
GET `/install.sh` one-click install (does not increment; script curls `/download`).
GET `/v1/skill` returns skill markdown (`text/markdown`). Does not increment views or downloads.
`/v1/mesh/*` PROXY to aziel-runtime suite mesh (`AZIEL_RUNTIME` / `https://aziel-runtime.vibelock.workers.dev`). Default OFF. QNM-BUILD-1.0 live|locked|isolated. QNS-CD-1.0 photon QNS1 packet transfer is a hub cite / Worker mesh cross-map only (local qnsd in [qnm-node](https://github.com/AzielEliab/qnm-node); runtime cites + catalog field in [aziel-runtime](https://github.com/AzielEliab/aziel-runtime); pair custody [AZInterface](https://github.com/AzielEliab/azinterface)). No Node Gate. No public qnsd proxy. No auto-heal. Not anonymity. Not a Softwares-tab product. StaticClock is Plain category (not Lock). Human UI Live Nodes strip polls `GET /v1/mesh`.

Verify: `curl -sS -A 'Mozilla/5.0' https://staticclock-download-tracker.vibelock.workers.dev/v1/mesh/status` returns MESH-OK style JSON with `enabled: false` by default.
GET `/cite.json` citation record (`doi` is `null` — no invented Zenodo DOI).
GET `/robots.txt` and `/sitemap.xml` for crawlers.

Host: https://staticclock-download-tracker.vibelock.workers.dev

Product identity: action-based immutable timeline. No rollbacks. AZ-OS hook.
`POST /v1/click`, `POST /v1/hook`, `POST /v1/verify`. Hosted `/v1` is stateless
and does not store a chain. Author Aziel Eliab only. Apache-2.0. Forks welcome.

## Human / bot schema (`/stats` and `/count`)

Additive dual-count (Whitestone canary). Classification lives in `src/classify.js`
and response shaping in `src/stats-shape.js`.

Invariant: `views === views_human + views_bot` and
`downloads === downloads_human + downloads_bot`.

Legacy strategy (b): existing KV totals are never reset. Pre-split remainder
is shown as bot on read (`views_bot = views - views_human`). Author: Aziel Eliab only.

