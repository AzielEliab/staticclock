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

Python 3.10+. Core is stdlib only (`zoneinfo`, `secrets`, `hashlib`,
`json`, `http.server`). pytest is the dev extra. No network.

## Ground rules

1. **The gear only clicks forward.** No rollback, pop, insert, delete,
   or rewrite of earlier clicks. A correction is a new click.
2. **AZ-OS hook records only.** It does not exec and does not open a
   remote shell.
3. **Author is Aziel Eliab only.** Do not add other identity labels.
4. **Advisory companion still forgets its nonce.** `forget()` drops
   last-known geo and the one-shot nonce. It does not rewind the gear.
5. **No user identification.** Last-known geo is a string, not a profile.
6. **Keep the dependency list tiny.** Stdlib only in the core.
7. **UI binds loopback only** (`127.0.0.1`). Do not listen on `0.0.0.0`.
8. New behavior needs a test that fails without the change.

## Where to change things

- Gear / hash / no-rollback: `staticclock/timeline.py`
- AZ-OS hook: `staticclock/azos.py`
- Session / advise / forget: `staticclock/engine.py`
- Top-30 / geo resolve: `staticclock/anchors.py`
- Bundled index: `staticclock/data/index.json`, `staticclock/index.py`
- Windows: `staticclock/chronolect.py`
- Language / dialect: `staticclock/glossa.py`
- Five-basket shake: `staticclock/polarize.py`
- CLI: `staticclock/cli.py`
- Local UI: `staticclock/ui.py`, `staticclock/web/`
- Hosted runtime: `workers/download-tracker/src/runtime.js`

## License of contributions

By submitting a change you agree it is licensed under Apache-2.0, the
same license as the rest of the tree. Keep the copyright lines honest.
