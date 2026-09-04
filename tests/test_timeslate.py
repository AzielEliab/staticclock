"""Timeslate cross-hash: TemporalLock binds to StaticClock clicks."""

from __future__ import annotations

from staticclock.cli import main
from staticclock.timeline import Timeline
from staticclock.timeslate import LATTICE, TIMESLATE_SCHEMA, cross_hash, timeslate_of


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
