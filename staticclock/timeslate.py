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


def bind_evidence(*, click: int, second: str, click_hash: str, digest: str) -> str:
    """Single-line evidence TemporalLock puts on a receipt. Non-empty by contract."""
    return (
        f"schema={TIMESLATE_SCHEMA} product={PRODUCT} lattice={LATTICE} "
        f"click={int(click)} second={second} click_hash={click_hash} cross_hash={digest}"
    )


def timeslate_of(tick: Click) -> dict[str, Any]:
    """Return the timeslate TemporalLock binds to for one click."""
    digest = cross_hash(click=tick.click, click_hash=tick.hash, second=tick.second)
    evidence = bind_evidence(
        click=tick.click,
        second=tick.second,
        click_hash=tick.hash,
        digest=digest,
    )
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
        "evidence": evidence,
        "bind": {
            "product": LATTICE,
            "uses": "evidence",
            "summary": f"staticclock timeslate click {tick.click}",
            "evidence": evidence,
            "confidence": 1.0,
            "timestamp": tick.second,
        },
        "note": (
            "TemporalLock hash-chains this timeslate into its lattice. "
            "StaticClock does not store TemporalLock receipts."
        ),
    }


def verify_timeslate(slate: dict[str, Any]) -> bool:
    """Recompute cross_hash from core fields. Anyone can verify."""
    expected = cross_hash(
        click=int(slate["click"]),
        click_hash=str(slate["click_hash"]),
        second=str(slate["second"]),
        product=str(slate.get("product") or PRODUCT),
        schema=str(slate.get("schema") or TIMESLATE_SCHEMA),
    )
    return expected == str(slate.get("cross_hash") or "") and bool(slate.get("evidence"))
