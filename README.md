# StaticClock

Record actions in order. Each action locks forward as one click.

**Author:** Aziel Eliab  
**License:** [Apache-2.0](LICENSE)

## Start

Python 3.10 or newer.

1. `python -m venv .venv && source .venv/bin/activate && pip install -e .`
2. `staticclock ui`
3. Open http://127.0.0.1:8765/ and press **Record action**.

Check the install with `staticclock doctor`.  
All commands: `staticclock --help`.

The same three steps are in [RUN.txt](RUN.txt). One-click install, after the archive is on this computer:

```bash
curl -fsSL https://staticclock-download-tracker.vibelock.workers.dev/install.sh | bash
staticclock ui
```

Counted archive: [staticclock-0.2.0.tar.gz](https://staticclock-download-tracker.vibelock.workers.dev/download?asset=staticclock-0.2.0.tar.gz)

## Commands

People see short text. Add `--json` when a program needs the same result as data.

```bash
staticclock
staticclock ui
staticclock click --action "opened the ledger"
staticclock timeline --timeline ticks.jsonl
staticclock verify --timeline ticks.jsonl
staticclock doctor
```

`staticclock` with no command prints this welcome and the next steps. `ui` and `serve` bind 127.0.0.1 only.

### Advanced

```bash
staticclock hook --action "invite accepted" --session azos-1
staticclock genesis --timeline ticks.jsonl --action "first click"
staticclock timeslate --timeline ticks.jsonl
staticclock advise --geo "United States"
staticclock advise --geo "Indiana" --json
staticclock anchors
staticclock zones
staticclock import notes.json
staticclock export notes.json
staticclock version
```

## Notes

Every action is a gear click. A later action that mentions an earlier hash is a new click. The earlier click stays.

The AZ-OS hook records a principle-bound action into the gear. It does not run a command.

| Field | Meaning |
|-------|---------|
| `click` | Gear tooth, 1-based |
| `second` | UTC second the action locked (`YYYY-MM-DDTHH:MM:SSZ`) |
| `action` | What happened |
| `source` | `local`, `azos`, or `advise` |
| `prev_hash` | SHA-256 of the prior click (genesis is 64 zero hex chars) |
| `hash` | SHA-256 of this click's canonical encoding |

Canonical encoding: UTF-8 JSON, sorted keys, no extra whitespace. Hashed fields: `action`, `click`, `prev_hash`, `second`, `source`. The click's own `hash` is excluded.

A companion advisory (`advise`) names a place, local time, date, language, and dialect, and also records a click. ChronoLock is the related advisory-window product ([chronolock](https://github.com/AzielEliab/chronolock)). Each click has a timeslate (`staticclock-timeslate-v1`). TemporalLock can bind that timeslate into its lattice. StaticClock does not store TemporalLock receipts.

See [docs/whitepaper.md](docs/whitepaper.md). How to contribute: [CONTRIBUTING.md](CONTRIBUTING.md). Forks are welcome and always allowed.

## Phone

Flutter sources live in [`mobile/`](mobile/). Application id `com.azieeliab.staticclock`. Offline. The phone list follows the system light and dark theme.

```bash
cd mobile
flutter create --org com.azieeliab --project-name staticclock .
flutter pub get
flutter run
```

The `android/` and `ios/` folders are skeleton READMEs until `flutter create .` runs. Then open `android/` in Android Studio or `ios/Runner.xcworkspace` in Xcode.

## Library

```python
from staticclock import AzosHook, StaticClock, Timeline, timeslate_of

gear = Timeline()
gear.click("opened the ledger")
AzosHook(gear).record("invite accepted", session="azos-1")
assert gear.verify().ok
slate = gear.timeslate()
# TemporalLock genesis/append uses slate["bind"]:
#   summary, evidence, confidence=1.0, timestamp=click second

with StaticClock(timeline=gear) as clock:
    adv = clock.advise("Indiana")
    print(adv.to_dict())
# forget() drops nonce and inputs — the gear stays
```

v0.2 ships the append-only gear, the AZ-OS hook, and the Top-30 companion advisory index. A fuller language index is a replacement of `staticclock/data/index.json`, not a network fetch.

## Tests

```bash
pip install -e ".[dev]"
python -m pytest -q
```

Offline. No network.

## Layout

```
staticclock/          library (timeline, azos hook, advisory engine, cli, ui)
staticclock/web/      local timeline page
staticclock/data/     bundled Top-30 index
tests/                pytest
docs/whitepaper.md    spec
examples/             click once; advise once
mobile/               Flutter iPhone + Android
RUN.txt               three steps to the timeline
```

## Agents

The hosted API is stateless: send existing `clicks` to append. The Worker does not store a chain. Author Aziel Eliab only.

OpenAPI: `https://staticclock-download-tracker.vibelock.workers.dev/openapi.json`  
Setup notes: https://staticclock-download-tracker.vibelock.workers.dev/ai

MCP catalog (Cursor, Glama, Claude, and other MCP clients): `https://aziel-runtime.vibelock.workers.dev/mcp`. Suite mesh `/v1/mesh/*` PROXY via `AZIEL_RUNTIME` (default OFF; QNM-BUILD-1.0 live|locked|isolated; QNS-CD-1.0 photon QNS1 packet transfer cross-map; no Node Gate; no public qnsd proxy). Catalog MCP `mesh_*` + FragGate `slug=mesh`. Local qnsd is [qnm-node](https://github.com/AzielEliab/qnm-node); runtime cites + catalog field live in [aziel-runtime](https://github.com/AzielEliab/aziel-runtime); pair custody is [AZInterface](https://github.com/AzielEliab/azinterface). Not a Softwares-tab product. StaticClock is Plain category (not Lock).

```bash
curl -sS -A 'Mozilla/5.0' -X POST https://staticclock-download-tracker.vibelock.workers.dev/v1/click \
  -H "content-type: application/json" \
  -d '{"action": "opened the ledger"}'
```

Works with ChatGPT, Grok, Venice, Claude, Cursor, Glama, Perplexity, Microsoft Copilot, Google Gemini, Mistral, Meta AI, Apple Intelligence surfaces, Amazon Q, DuckAssist, You.com, Cohere, and other MCP or OpenAPI assistants.
