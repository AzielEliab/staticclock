# StaticClock

> **Renamed to ChronoLock.** This tree is kept (do not delete StaticClock).
> Public name: [ChronoLock](https://github.com/AzielEliab/chronolock) ·
> Worker: [https://chronolock-download-tracker.vibelock.workers.dev/](https://chronolock-download-tracker.vibelock.workers.dev/)

A chrono-linguistic **release advisory**: the least-distorting, most
analytically stable window for information, given timezone, language,
and regional dialect.

**Author:** Aziel Eliab
**Date:** 2026
**License:** [Apache-2.0](LICENSE)

> It does not help messages travel farther. It helps them arrive intact.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"
staticclock ui
```

Open http://127.0.0.1:8765 (loopback only). No CDN, no telemetry.

Counted download: [https://staticclock-download-tracker.vibelock.workers.dev/](https://staticclock-download-tracker.vibelock.workers.dev/)


See the spec: [docs/whitepaper.md](docs/whitepaper.md).

## Download

Counted downloads (number on the button, no user reporting):
[https://staticclock-download-tracker.vibelock.workers.dev/](https://staticclock-download-tracker.vibelock.workers.dev/)

Direct tarball (also counted): [staticclock-0.1.0.tar.gz](https://staticclock-download-tracker.vibelock.workers.dev/download?asset=staticclock-0.1.0.tar.gz)


How to contribute: [CONTRIBUTING.md](CONTRIBUTING.md).

**Forks are welcome and always allowed.**

StaticClock is **advisory hygiene, not strategy.** It is not a scheduler,
not a targeting system, not analytics, and not a user-profile tool. It
does not optimize for reach, virality, or engagement. One advisory for
one moment; then it forgets.

This tree is the local Python implementation of the first-set paper
*THE STATICCLOCK — A Chrono-Linguistic Release Advisory System*.

---

## What it answers

“When should this be released so it is read, not reacted to?”

Input is a last-known geo (free text) or a Top-30 country. Output is
exactly five fields:

| Field | Meaning |
|-------|---------|
| `geo_location_chosen` | One region from a five-basket polarize/shake |
| `optimal_time` | Local clock time in the analytical window |
| `optimal_date` | Local date in the chosen region |
| `primary_language` | From the static bundled index |
| `dialect_section` | One of five dialectal variants |

No scores. No confidence. No alternatives. No “because”.

## Install

Python 3.10+. Stdlib only in the core (`zoneinfo`, `secrets`).

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## CLI

```bash
staticclock version
staticclock anchors
staticclock advise --geo "United States"
staticclock advise --geo "Indiana"
staticclock advise --geo "United States" --json
staticclock zones
staticclock ui          # 127.0.0.1 only
staticclock serve       # alias for ui
```

`advise` prints the five fields only. `zones` is read-only and does not
change an advisory.


## iPhone & Android

Flutter sources: [`mobile/`](mobile/). Application id `com.azieeliab.staticclock`. Offline. No analytics. Dark matte / gold.

Geo → five advisory fields. Not a scheduler.

```bash
cd mobile
flutter create --org com.azieeliab --project-name staticclock .
flutter pub get
flutter run
```

The `android/` and `ios/` folders in this tree are skeleton READMEs until you run `flutter create .` (this machine has no Flutter SDK on PATH). Then open `android/` in Android Studio or `ios/Runner.xcworkspace` in Xcode. Not a store listing.

## Library

```python
from staticclock.engine import StaticClock

with StaticClock() as clock:
    adv = clock.advise("Indiana")
    print(adv.to_dict())
# forget() ran on exit — nonce and inputs are gone
```

v0.1 ships the Top-30 geographic set plus five dialectal variants per
language. A full 100+ language index is a replacement update of
`staticclock/data/index.json`, not a network fetch.

Default analytical window: **08:30–10:30** local. Documented overrides
(later cultural morning starts): Spain, Argentina, Egypt.

## Tests

```bash
pip install -e ".[dev]"
python -m pytest -q
```

Offline. No network. No sqlite. No `.staticclock` store.

## Layout

```
staticclock/          library (anchors, index, chronolect, glossa, polarize, engine, cli, ui)
staticclock/data/     bundled Top-30 index
tests/                pytest
docs/whitepaper.md    spec (sections 1–13)
examples/             advise once, then forget
mobile/              Flutter iPhone + Android (`flutter create .`)
```

## Use with Grok, ChatGPT, Venice

Live HTTPS runtime on the existing download-tracker Worker. Advisory only, not a scheduler.

OpenAPI (ChatGPT GPT Actions / Venice custom HTTP / Grok custom tool):

```
https://staticclock-download-tracker.vibelock.workers.dev/openapi.json
```

Setup notes: [https://staticclock-download-tracker.vibelock.workers.dev/ai](https://staticclock-download-tracker.vibelock.workers.dev/ai)

MCP catalog (ships separately): `https://aziel-runtime.vibelock.workers.dev/mcp`

```bash
curl -sS -X POST https://staticclock-download-tracker.vibelock.workers.dev/v1/advisory \
  -H "content-type: application/json" \
  -d '{"geo": "Indiana", "language": "English"}'
```

## License

Apache-2.0. See [LICENSE](LICENSE).

Forks are welcome and always allowed.
