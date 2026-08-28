"""Analytical window 08:30-10:30 unless a documented override region."""

from __future__ import annotations

from staticclock.chronolect import DEFAULT_WINDOW, OVERRIDES, in_window, window_for
from staticclock.engine import StaticClock

FIXED = b"window-nonce-16b"


def test_default_time_inside_analytical_window() -> None:
    # Pin a nonce and a geo whose basket avoids override regions.
    adv = StaticClock(nonce=FIXED).advise("Japan")
    if adv.geo_location_chosen in OVERRIDES:
        assert in_window(adv.optimal_time, window_for(adv.geo_location_chosen))
    else:
        assert in_window(adv.optimal_time, DEFAULT_WINDOW)


def test_override_regions_use_documented_window() -> None:
    for region in OVERRIDES:
        # Direct pick: shake may choose a neighbor; inspect the window helper.
        assert window_for(region) != DEFAULT_WINDOW
        assert window_for("Japan") == DEFAULT_WINDOW


def test_chosen_override_time_stays_in_override_window() -> None:
    # Exhaust a few nonces until Spain itself is chosen, then check the clock.
    found = False
    for i in range(80):
        nonce = bytes([i]) * 16
        adv = StaticClock(nonce=nonce).advise("Spain")
        if adv.geo_location_chosen == "Spain":
            assert in_window(adv.optimal_time, OVERRIDES["Spain"])
            found = True
            break
    assert found
