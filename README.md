# StaticClock

An **action-based immutable timeline**. Every action is a gear click —
a second that locks forward. **No rollbacks.** AZ-OS records
principle-bound actions into this gear.

**Author:** Aziel Eliab
**Date:** 2026
**License:** [Apache-2.0](LICENSE)

> Every action is a gear click. Time only locks forward.

ChronoLock is a related advisory-window product
([chronolock](https://github.com/AzielEliab/chronolock)). TemporalLock
is observation receipts. This tree is StaticClock and still ships its
own tarball.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"
staticclock ui
```


## One-click install

```bash
curl -fsSL https://staticclock-download-tracker.vibelock.workers.dev/install.sh | bash
```

The script curls the **counted** tarball from this project's Worker
(`/download`, User-Agent `Mozilla/5.0`), extracts, makes a venv, and
`pip install -e .`. Then run `staticclock ui`.

Or tap **Download** / **One-click install** on the Worker homepage:
https://staticclock-download-tracker.vibelock.workers.dev/

## Counted download (Cloudflare Worker)

**This is the counted download.** GitHub releases exist as a mirror.
The Worker serves the gzip itself (HTTP 200, no 302 to GitHub).

- Homepage: [https://staticclock-download-tracker.vibelock.workers.dev/](https://staticclock-download-tracker.vibelock.workers.dev/)
- Direct tarball: [staticclock-0.2.0.tar.gz](https://staticclock-download-tracker.vibelock.workers.dev/download?asset=staticclock-0.2.0.tar.gz)
- One-click install: [https://staticclock-download-tracker.vibelock.workers.dev/install.sh](https://staticclock-download-tracker.vibelock.workers.dev/install.sh)
- Skill: [https://staticclock-download-tracker.vibelock.workers.dev/v1/skill](https://staticclock-download-tracker.vibelock.workers.dev/v1/skill)
- OpenAPI: [https://staticclock-download-tracker.vibelock.workers.dev/openapi.json](https://staticclock-download-tracker.vibelock.workers.dev/openapi.json)
- GitHub: [https://github.com/AzielEliab/staticclock](https://github.com/AzielEliab/staticclock)

Isolated counter: Worker `staticclock-download-tracker`, KV `STATICCLOCK_DOWNLOADS`. `/v1` does not increment downloads.

Open http://127.0.0.1:8765 (loopback only). No CDN, no telemetry.

Counted download: [https://staticclock-download-tracker.vibelock.workers.dev/](https://staticclock-download-tracker.vibelock.workers.dev/)


See the spec: [docs/whitepaper.md](docs/whitepaper.md).

## Download

Counted downloads (number on the button, no user reporting):
[https://staticclock-download-tracker.vibelock.workers.dev/](https://staticclock-download-tracker.vibelock.workers.dev/)

Direct tarball (also counted): [staticclock-0.2.0.tar.gz](https://staticclock-download-tracker.vibelock.workers.dev/download?asset=staticclock-0.2.0.tar.gz)


How to contribute: [CONTRIBUTING.md](CONTRIBUTING.md).

**Forks are welcome and always allowed.**

StaticClock is an action-based immutable timeline. The gear clicks
forward. A later action that mentions an earlier hash is a new click.
The old click stays. The AZ-OS hook records; it does not exec.

This tree is the local Python implementation of *THE STATICCLOCK*.

---

## What it answers

“What happened, in order, as actions that cannot rewind?”

Each click is:

| Field | Meaning |
|-------|---------|
| `click` | Gear tooth, 1-based |
| `second` | UTC second the action locked (`YYYY-MM-DDTHH:MM:SSZ`) |
| `action` | What happened |
| `source` | `local`, `azos`, or `advise` |
| `prev_hash` | SHA-256 of the prior click (genesis is 64 zero hex chars) |
| `hash` | SHA-256 of this click's canonical encoding |

Canonical encoding: UTF-8 JSON, sorted keys, no extra whitespace.
Hashed fields: `action`, `click`, `prev_hash`, `second`, `source`.
The click's own `hash` is excluded.

A companion advisory (`advise`) still names a geo, local time, date,
language, and dialect. That call also clicks the gear. ChronoLock is
the public name of the advisory-window product.

## Install

Python 3.10+. Stdlib only in the core (`zoneinfo`, `secrets`, `hashlib`).

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## CLI

```bash
staticclock version
staticclock click --action "opened the ledger"
staticclock click --timeline ticks.jsonl --action "next second" --json
staticclock hook --action "invite accepted" --session azos-1
staticclock genesis --timeline ticks.jsonl --action "first click"
staticclock timeline --timeline ticks.jsonl
staticclock verify --timeline ticks.jsonl
staticclock advise --geo "United States"
staticclock advise --geo "Indiana" --json
staticclock anchors
staticclock zones
staticclock ui          # 127.0.0.1 only
staticclock serve       # alias for ui
staticclock doctor
```

`click` and `hook` append. There is no rollback command.


## iPhone & Android

Flutter sources: [`mobile/`](mobile/). Application id `com.azieeliab.staticclock`. Offline. No analytics. Dark matte / gold.

Action → immutable click. AZ-OS hook on device. Companion advisory still available.

```bash
cd mobile
flutter create --org com.azieeliab --project-name staticclock .
flutter pub get
flutter run
```

The `android/` and `ios/` folders in this tree are skeleton READMEs until you run `flutter create .` (this machine has no Flutter SDK on PATH). Then open `android/` in Android Studio or `ios/Runner.xcworkspace` in Xcode. Not a store listing.

## Library

```python
from staticclock import AzosHook, StaticClock, Timeline

gear = Timeline()
gear.click("opened the ledger")
AzosHook(gear).record("invite accepted", session="azos-1")
assert gear.verify().ok
# gear.rollback() raises NoRollbackError

with StaticClock(timeline=gear) as clock:
    adv = clock.advise("Indiana")
    print(adv.to_dict())
# forget() drops nonce and inputs — the gear does not rewind
```

v0.2 ships the append-only gear, the AZ-OS hook, and the Top-30
companion advisory index. A full 100+ language index is a replacement
update of `staticclock/data/index.json`, not a network fetch.

## Tests

```bash
pip install -e ".[dev]"
python -m pytest -q
```

Offline. No network. No sqlite.

## Layout

```
staticclock/          library (timeline, azos hook, advisory engine, cli, ui)
staticclock/data/     bundled Top-30 index
tests/                pytest
docs/whitepaper.md    spec
examples/             click once; advise once
mobile/               Flutter iPhone + Android (`flutter create .`)
```

## Use with Grok, ChatGPT, Venice

Live HTTPS runtime on the existing download-tracker Worker. Hosted API
is stateless: send existing `clicks` to append. The Worker does not
store a chain.

OpenAPI (ChatGPT GPT Actions / Venice custom HTTP / Grok custom tool):

```
https://staticclock-download-tracker.vibelock.workers.dev/openapi.json
```

Setup notes: [https://staticclock-download-tracker.vibelock.workers.dev/ai](https://staticclock-download-tracker.vibelock.workers.dev/ai)

MCP catalog (ships separately): `https://aziel-runtime.vibelock.workers.dev/mcp`

```bash
curl -sS -X POST https://staticclock-download-tracker.vibelock.workers.dev/v1/click \
  -H "content-type: application/json" \
  -d '{"action": "opened the ledger"}'
```

## License

Apache-2.0. See [LICENSE](LICENSE).

Forks are welcome and always allowed.
