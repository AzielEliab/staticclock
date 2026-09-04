"""Append-only gear: clicks lock forward; no rollbacks."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from staticclock.timeline import (
    GENESIS_PREV_HASH,
    Click,
    NoRollbackError,
    Timeline,
    digest,
)


def test_first_click_is_genesis() -> None:
    gear = Timeline()
    tick = gear.click("opened", source="local", second="2026-09-04T12:00:00Z")
    assert tick.click == 1
    assert tick.prev_hash == GENESIS_PREV_HASH
    assert tick.hash == tick.recomputed_hash()
    assert len(tick.hash) == 64
    assert gear.verify().ok


def test_second_click_links_forward() -> None:
    gear = Timeline()
    a = gear.click("one", second="2026-09-04T12:00:00Z")
    b = gear.click("two", second="2026-09-04T12:00:01Z")
    assert b.click == 2
    assert b.prev_hash == a.hash
    assert a.hash != b.hash
    assert gear.verify().ok
    assert gear.verify().length == 2


def test_no_rollback_methods() -> None:
    gear = Timeline()
    gear.click("stay", second="2026-09-04T12:00:00Z")
    for fn in (gear.rollback, gear.rewind, gear.pop, gear.clear, gear.reverse):
        with pytest.raises(NoRollbackError, match="rewind"):
            fn()
    assert len(gear) == 1
    assert gear.verify().ok


def test_tamper_is_visible() -> None:
    gear = Timeline()
    gear.click("honest", second="2026-09-04T12:00:00Z")
    broken = Click(
        click=1,
        second="2026-09-04T12:00:00Z",
        action="rewritten",
        source="local",
        prev_hash=GENESIS_PREV_HASH,
        hash=gear[0].hash,
    )
    bad = Timeline([broken])
    result = bad.verify()
    assert result.ok is False
    assert result.errors


def test_jsonl_is_append_only(tmp_path: Path) -> None:
    path = tmp_path / "ticks.jsonl"
    gear = Timeline.genesis(path, action="first", second="2026-09-04T12:00:00Z")
    gear.click("second", second="2026-09-04T12:00:01Z")
    loaded = Timeline.load(path)
    assert len(loaded) == 2
    assert loaded.verify().ok
    lines = path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 2
    first = json.loads(lines[0])
    assert first["action"] == "first"
    with pytest.raises(ValueError, match="already exists"):
        Timeline.genesis(path, action="nope")


def test_empty_action_refused() -> None:
    gear = Timeline()
    with pytest.raises(ValueError, match="action"):
        gear.click("   ")


def test_canonical_hash_is_stable() -> None:
    expected = digest(
        click=1,
        second="2026-09-04T12:00:00Z",
        action="opened",
        source="local",
        prev_hash=GENESIS_PREV_HASH,
    )
    tick = Click.create(
        click=1,
        action="opened",
        source="local",
        prev_hash=GENESIS_PREV_HASH,
        second="2026-09-04T12:00:00Z",
    )
    assert tick.hash == expected
