# staticclock download tracker

Isolated Worker `staticclock-download-tracker`. Project `staticclock`.
KV namespace `STATICCLOCK_DOWNLOADS` bound as `DOWNLOADS`.
Does **not** 302 to GitHub on `/download`. Serves gzip via `ASSETS.fetch`,
`Cache-Control: private, no-store`.

GET `/` increments a **page-view** counter (separate from downloads).
GET `/download` increments **downloads**.
`/v1` never increments DOWNLOADS KV.
GET `/install.sh` one-click install (does not increment; script curls `/download`).
GET `/v1/skill` returns skill markdown (`text/markdown`). Does not increment views or downloads.

Host: https://staticclock-download-tracker.vibelock.workers.dev

Product identity: action-based immutable timeline. No rollbacks. AZ-OS hook.
`POST /v1/click`, `POST /v1/hook`, `POST /v1/verify`. Hosted `/v1` is stateless
and does not store a chain. Author Aziel Eliab.
