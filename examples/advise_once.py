#!/usr/bin/env python3
"""Companion advisory, then forget nonce. The gear click stays."""

from __future__ import annotations

from staticclock.engine import StaticClock


def main() -> None:
    clock = StaticClock()
    try:
        adv = clock.advise("Indiana")
        print(adv.to_text())
    finally:
        clock.forget()
    assert clock.last_inputs is None
    print("forgotten")


if __name__ == "__main__":
    main()
