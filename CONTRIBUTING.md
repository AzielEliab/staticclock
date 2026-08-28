# Contributing to StaticClock

**Forks are first-class.** This project is Apache-2.0; you do not need
permission to fork, patch, or redistribute.

**Forks are welcome and always allowed.**

## How to run tests

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m pytest -q
```

Python 3.10+. Core is stdlib only (`zoneinfo`, `secrets`, `json`,
`http.server`). pytest is the dev extra. No network.

## Ground rules

1. **No persistence.** Do not add sqlite, a `.staticclock` store, or a
   log of past advisories. Session state lives in memory and dies on
   `forget()`.
2. **No user identification.** Last-known geo is a string, not a profile.
3. **No targeting, no virality optimization, no engagement metrics.**
   Do not add ML, A/B, reach scores, or outcome learning.
4. **User-facing output is five fields.** No scores, no confidence, no
   alternatives, no “because” in the CLI, JSON, or UI report. Tests may
   inspect internals.
5. **Keep the dependency list tiny.** Stdlib only in the core.
6. **UI binds loopback only** (`127.0.0.1`). Do not listen on `0.0.0.0`.
7. New behavior needs a test that fails without the change.

## Where to change things

- Top-30 / geo resolve: `staticclock/anchors.py`
- Bundled index: `staticclock/data/index.json`, `staticclock/index.py`
- Windows: `staticclock/chronolect.py`
- Language / dialect: `staticclock/glossa.py`
- Five-basket shake: `staticclock/polarize.py`
- Session / forget: `staticclock/engine.py`
- CLI: `staticclock/cli.py`
- Local UI: `staticclock/ui.py`, `staticclock/web/`

## License of contributions

By submitting a change you agree it is licensed under Apache-2.0, the
same license as the rest of the tree. Keep the copyright lines honest.
