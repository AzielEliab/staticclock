"""AZ-OS hook records into the gear and never execs."""

from __future__ import annotations

from staticclock.azos import AZOS_PRINCIPLE, AZOS_SOURCE, AzosHook
from staticclock.engine import StaticClock
from staticclock.timeline import Timeline


def test_hook_records_azos_source() -> None:
    hook = AzosHook()
    tick = hook.record("invite accepted", session="s1", second="2026-09-04T12:00:00Z")
    assert tick.source == AZOS_SOURCE
    assert tick.click == 1
    assert "invite accepted" in tick.action
    assert "session:s1" in tick.action
    assert hook.timeline.verify().ok


def test_hook_status_does_not_exec() -> None:
    hook = AzosHook(Timeline())
    status = hook.status()
    assert status["ok"] is True
    assert status["exec"] is False
    assert status["remote_shell"] is False
    assert status["rollbacks"] is False
    assert status["principle"] == AZOS_PRINCIPLE
    assert status["author"] == "Aziel Eliab"


def test_clock_hook_shares_the_gear() -> None:
    clock = StaticClock()
    clock.click("local first", source="local")
    tick = clock.azos_hook().record("halt token labeled", second="2026-09-04T12:00:03Z")
    assert tick.source == "azos"
    assert len(clock.timeline) == 2
    assert clock.timeline.verify().ok


def test_empty_hook_action_refused() -> None:
    import pytest

    with pytest.raises(ValueError, match="action"):
        AzosHook().record(" ")
