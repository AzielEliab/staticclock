"""Timeslate cross-hash: TemporalLock binds to StaticClock clicks."""

from __future__ import annotations

from staticclock.cli import main
from staticclock.timeline import Timeline
from staticclock.timeslate import (
    LATTICE,
    TIMESLATE_SCHEMA,
    bind_evidence,
    cross_hash,
    timeslate_of,
    verify_timeslate,
)


def test_timeslate_is_stable_and_binds_temporallock() -> None:
    gear = Timeline()
    tick = gear.click("opened the ledger", second="2026-09-04T12:00:00Z")
    slate = timeslate_of(tick)
    assert slate["schema"] == TIMESLATE_SCHEMA
    assert slate["lattice"] == LATTICE
    assert slate["click_hash"] == tick.hash
    assert slate["azos"] is True
    assert slate["rollbacks"] is False
    expected = cross_hash(click=tick.click, click_hash=tick.hash, second=tick.second)
    assert slate["cross_hash"] == expected
    assert gear.timeslate() == slate
    assert verify_timeslate(slate)
    assert slate["evidence"] == bind_evidence(
        click=tick.click,
        second=tick.second,
        click_hash=tick.hash,
        digest=expected,
    )
    assert slate["bind"]["product"] == "temporallock"
    assert slate["bind"]["evidence"] == slate["evidence"]
    assert slate["bind"]["timestamp"] == tick.second
    gear.click("next", second="2026-09-04T12:00:01Z")
    slates = gear.timeslates()
    assert len(slates) == 2
    assert slates[0]["click"] == 1
    assert slates[1]["click"] == 2
    assert all(verify_timeslate(s) for s in slates)


def test_empty_gear_has_no_timeslate() -> None:
    assert Timeline().timeslate() is None


def test_cli_timeslate(tmp_path, capsys) -> None:
    path = str(tmp_path / "ticks.jsonl")
    assert main(["click", "--timeline", path, "--action", "opened", "--json"]) == 0
    capsys.readouterr()
    assert main(["timeslate", "--timeline", path, "--json"]) == 0
    import json

    slate = json.loads(capsys.readouterr().out)
    assert slate["lattice"] == "temporallock"
    assert len(slate["cross_hash"]) == 64
    assert slate["evidence"].startswith("schema=staticclock-timeslate-v1")
    assert slate["bind"]["uses"] == "evidence"
