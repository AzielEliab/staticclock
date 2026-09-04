#!/usr/bin/env python3
"""Two gear clicks and an AZ-OS hook record. No rollback."""

from __future__ import annotations

from staticclock.azos import AzosHook
from staticclock.timeline import Timeline


def main() -> None:
    gear = Timeline()
    first = gear.click("opened the ledger", second="2026-09-04T12:00:00Z")
    hook = AzosHook(gear)
    hooked = hook.record("invite accepted", session="demo", second="2026-09-04T12:00:01Z")
    result = gear.verify()
    print(first.to_dict())
    print(hooked.to_dict())
    print({"ok": result.ok, "length": result.length, "exec": hook.status()["exec"]})
    assert result.ok
    assert result.length == 2


if __name__ == "__main__":
    main()
