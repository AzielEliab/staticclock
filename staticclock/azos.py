"""AZ-OS hook for StaticClock.

AZ-OS records principle-bound actions into the append-only gear.
This hook does not execute a remote shell and does not grant AZ-OS
privileges. One action → one immutable click. Source is always ``azos``.

Author: Aziel Eliab
"""

from __future__ import annotations

from typing import Any

from staticclock.timeline import Click, Timeline

AZOS_PRINCIPLE = "Integrity precedes execution."
AZOS_SOURCE = "azos"
AZOS_HOST = "https://azos-download-tracker.vibelock.workers.dev"
AUTHOR = "Aziel Eliab"


class AzosHook:
    """Record AZ-OS actions into a StaticClock timeline.

    Does not exec. Does not open a remote shell.
    """

    def __init__(self, timeline: Timeline | None = None) -> None:
        self._timeline = timeline if timeline is not None else Timeline()

    @property
    def timeline(self) -> Timeline:
        return self._timeline

    def record(
        self,
        action: str,
        *,
        session: str = "",
        principle: str = "",
        second: str | None = None,
    ) -> Click:
        text = action.strip()
        if not text:
            raise ValueError("action is required")
        session = session.strip()
        if session:
            text = f"{text} [session:{session}]"
        bound = (principle or AZOS_PRINCIPLE).strip()
        if bound and bound != AZOS_PRINCIPLE:
            text = f"{text} [principle:{bound}]"
        return self._timeline.click(text, source=AZOS_SOURCE, second=second)

    def status(self) -> dict[str, Any]:
        n = len(self._timeline)
        last = self._timeline[-1] if n else None
        return {
            "ok": True,
            "hook": "azos",
            "product": "staticclock",
            "author": AUTHOR,
            "principle": AZOS_PRINCIPLE,
            "exec": False,
            "remote_shell": False,
            "rollbacks": False,
            "clicks": n,
            "last_hash": last.hash if last else None,
            "azos_host": AZOS_HOST,
            "note": "Records actions into the StaticClock timeline. Does not exec.",
        }
