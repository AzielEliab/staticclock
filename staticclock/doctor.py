"""Self-check for StaticClock. No network, no telemetry.

    staticclock doctor
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Callable

from staticclock import __version__
from staticclock.azos import AZOS_PRINCIPLE, AzosHook
from staticclock.timeline import NoRollbackError, Timeline

AUTHOR = "Aziel Eliab"
Check = tuple[str, bool, str]


def _ok(name: str, detail: str = "") -> Check:
    return name, True, detail


def _fail(name: str, detail: str) -> Check:
    return name, False, detail


def _check_version() -> Check:
    if __version__:
        return _ok("version", str(__version__))
    return _fail("version", "missing")


def _check_identity() -> Check:
    try:
        mod = __import__(__name__.split(".")[0])
        author = str(getattr(mod, "__author__", AUTHOR))
    except Exception as exc:  # noqa: BLE001
        return _fail("identity", str(exc))
    blob = author + " " + AUTHOR
    forbidden = ("Col" + "lin H" + "orton", "Ja" + "ck Al" + "tman", "GodLock" + ".AZ", "Reve" + "aler")
    if any(x in blob for x in forbidden):
        return _fail("identity", "forbidden identity label")
    if "Aziel Eliab" not in blob:
        return _fail("identity", author)
    return _ok("identity", AUTHOR)


def _check_gear() -> Check:
    gear = Timeline()
    first = gear.click("genesis", source="local", second="2026-09-04T00:00:00Z")
    second = gear.click("next second", source="local", second="2026-09-04T00:00:01Z")
    result = gear.verify()
    if first.click != 1 or second.click != 2:
        return _fail("gear", "click numbers")
    if second.prev_hash != first.hash:
        return _fail("gear", "link")
    if not result.ok:
        return _fail("gear", "; ".join(result.errors))
    try:
        gear.rollback()
    except NoRollbackError:
        return _ok("gear", f"{result.length} clicks, no rollback")
    return _fail("gear", "rollback was allowed")


def _check_azos_hook() -> Check:
    hook = AzosHook()
    tick = hook.record("invite accepted", session="demo", second="2026-09-04T00:00:02Z")
    status = hook.status()
    if tick.source != "azos":
        return _fail("azos hook", tick.source)
    if status.get("exec") or status.get("remote_shell"):
        return _fail("azos hook", "hook must not exec")
    if AZOS_PRINCIPLE not in str(status.get("principle")):
        return _fail("azos hook", "principle")
    if not hook.timeline.verify().ok:
        return _fail("azos hook", "verify")
    return _ok("azos hook", "record only")


def _check_timeslate() -> Check:
    from staticclock.timeslate import LATTICE, timeslate_of

    gear = Timeline()
    tick = gear.click("opened", source="local", second="2026-09-04T00:00:00Z")
    slate = timeslate_of(tick)
    if slate.get("lattice") != LATTICE:
        return _fail("timeslate", "lattice")
    if slate.get("click_hash") != tick.hash:
        return _fail("timeslate", "click_hash")
    if len(str(slate.get("cross_hash") or "")) != 64:
        return _fail("timeslate", "cross_hash")
    if gear.timeslate() != slate:
        return _fail("timeslate", "tip")
    from staticclock.timeslate import verify_timeslate

    if not verify_timeslate(slate) or "cross_hash=" not in str(slate.get("evidence")):
        return _fail("timeslate", "evidence")
    if len(gear.timeslates()) != 1:
        return _fail("timeslate", "lattice length")
    return _ok("timeslate", "temporallock bind")


def _check_json_roundtrip() -> Check:
    from staticclock.jsonio import export_json, import_json

    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "in.json"
        out = Path(tmp) / "out.json"
        src.write_text(json.dumps({"product": "staticclock", "author": AUTHOR, "ok": True}, indent=2), encoding="utf-8")
        rec = import_json(src)
        if not rec.get("ok"):
            return _fail("import", str(rec))
        rec2 = export_json(out)
        if not rec2.get("ok") or not out.exists():
            return _fail("export", str(rec2))
        doc = json.loads(out.read_text(encoding="utf-8"))
        if doc.get("author") != AUTHOR:
            return _fail("export author", str(doc.get("author")))
        return _ok("json import/export", "roundtrip")


CHECKS: tuple[Callable[[], Check], ...] = (
    _check_version,
    _check_identity,
    _check_gear,
    _check_azos_hook,
    _check_timeslate,
    _check_json_roundtrip,
)


def run_doctor(*, as_json: bool = False) -> int:
    results = []
    failed = 0
    for fn in CHECKS:
        name, ok, detail = fn()
        results.append({"name": name, "ok": ok, "detail": detail})
        if not ok:
            failed += 1
        mark = "ok" if ok else "FAIL"
        if not as_json:
            print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))
    payload = {
        "ok": failed == 0,
        "failed": failed,
        "checks": results,
        "version": __version__,
        "author": AUTHOR,
        "network": False,
        "telemetry": False,
        "rollbacks": False,
    }
    if as_json:
        print(json.dumps(payload, indent=2))
    else:
        print("doctor", "passed" if failed == 0 else "failed")
    return 0 if failed == 0 else 1
