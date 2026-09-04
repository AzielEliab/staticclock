"""Timeslate cross-hash: the bindable face of one StaticClock click.

StaticClock gear-clicks are the immutable ticks. TemporalLock
hash-chains those timeslates into a lattice for AZ-OS system
integrity. This module is the StaticClock side of that cross-hash.
It does not store TemporalLock receipts and does not exec.

Author: Aziel Eliab
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from staticclock.timeline import Click

TIMESLATE_SCHEMA = "staticclock-timeslate-v1"
LATTICE = "temporallock"
PRODUCT = "staticclock"
AUTHOR = "Aziel Eliab"
CORE_FIELDS = ("click", "click_hash", "product", "schema", "second")


def canonical_timeslate_bytes(
    *,
    click: int,
    click_hash: str,
    second: str,
    product: str = PRODUCT,
    schema: str = TIMESLATE_SCHEMA,
) -> bytes:
    payload = {
        "click": int(click),
        "click_hash": click_hash,
        "product": product,
        "schema": schema,
        "second": second,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )


def cross_hash(
    *,
    click: int,
    click_hash: str,
    second: str,
    product: str = PRODUCT,
    schema: str = TIMESLATE_SCHEMA,
) -> str:
    return hashlib.sha256(
        canonical_timeslate_bytes(
            click=click,
            click_hash=click_hash,
            second=second,
            product=product,
            schema=schema,
        )
    ).hexdigest()


def timeslate_of(tick: Click) -> dict[str, Any]:
    """Return the timeslate TemporalLock binds to for one click."""
    digest = cross_hash(click=tick.click, click_hash=tick.hash, second=tick.second)
    return {
        "schema": TIMESLATE_SCHEMA,
        "product": PRODUCT,
        "author": AUTHOR,
        "click": tick.click,
        "second": tick.second,
        "click_hash": tick.hash,
        "cross_hash": digest,
        "lattice": LATTICE,
        "azos": True,
        "rollbacks": False,
        "note": (
            "TemporalLock hash-chains this timeslate into its lattice. "
            "StaticClock does not store TemporalLock receipts."
        ),
    }
