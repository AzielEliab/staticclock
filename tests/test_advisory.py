"""User-facing advisory contract: five fields, no reasoning dump."""

from __future__ import annotations

import json

from staticclock.engine import OUTPUT_FIELDS, Advisory, StaticClock
from staticclock.glossa import dialects_for, primary_language
from staticclock.index import record

BANNED = ("because", "score", "confidence", "alternative", "reason")


def _blob(advisory: Advisory) -> str:
    return json.dumps(advisory.to_dict()).lower()


def test_output_keys_exactly_five_fields() -> None:
    adv = StaticClock(nonce=b"fixed-nonce-16b!!").advise("United States")
    keys = list(adv.to_dict().keys())
    assert keys == list(OUTPUT_FIELDS)
    assert len(keys) == 5


def test_json_has_no_because_score_or_confidence() -> None:
    adv = StaticClock(nonce=b"fixed-nonce-16b!!").advise("Germany")
    blob = _blob(adv)
    for word in BANNED:
        assert word not in blob
    assert "because" not in adv.to_json().lower()


def test_primary_language_matches_chosen_region() -> None:
    adv = StaticClock(nonce=b"lang-nonce-16byt").advise("Japan")
    assert adv.primary_language == primary_language(adv.geo_location_chosen)
    assert adv.primary_language == record(adv.geo_location_chosen)["language"]


def test_dialect_is_one_of_five_for_language() -> None:
    adv = StaticClock(nonce=b"dial-nonce-16byt").advise("Spain")
    options = dialects_for(adv.primary_language)
    assert len(options) == 5
    assert adv.dialect_section in options
