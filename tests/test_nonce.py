"""One-shot nonce: same geo can differ; pinned nonce is deterministic."""

from __future__ import annotations

from staticclock.anchors import basket_of, resolve_geo
from staticclock.engine import StaticClock

FIXED = b"test-hook-nonce!!"


def test_advise_twice_same_geo_can_differ() -> None:
    geo = "United States"
    seen: set[tuple[str, str, str]] = set()
    for _ in range(24):
        adv = StaticClock().advise(geo)
        seen.add((adv.geo_location_chosen, adv.optimal_time, adv.dialect_section))
        basket = basket_of(resolve_geo(geo))
        assert adv.geo_location_chosen in basket
    assert len(seen) >= 2


def test_fixed_nonce_is_deterministic() -> None:
    a = StaticClock(nonce=FIXED).advise("Canada")
    b = StaticClock(nonce=FIXED).advise("Canada")
    assert a.to_dict() == b.to_dict()


def test_pinned_nonce_survives_two_calls_on_one_instance() -> None:
    clock = StaticClock(nonce=FIXED)
    a = clock.advise("India")
    b = clock.advise("India")
    assert a.to_dict() == b.to_dict()
