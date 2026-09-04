"""StaticClock: an action-based immutable timeline.

Every action is a gear click — a second that locks forward.
No rollbacks. AZ-OS hook records principle-bound actions into the gear.

Author: Aziel Eliab, 2026.

The chrono-linguistic advisory (five fields) remains a companion
capability. ChronoLock is the related advisory-window product.
TemporalLock is observation receipts. This tree is StaticClock.

Forks are welcome and always allowed.
"""

from __future__ import annotations

from staticclock.azos import AZOS_PRINCIPLE, AzosHook
from staticclock.engine import OUTPUT_FIELDS, Advisory, StaticClock
from staticclock.timeline import (
    GENESIS_PREV_HASH,
    MOTTO,
    Click,
    NoRollbackError,
    Timeline,
    VerifyResult,
)
from staticclock.timeslate import TIMESLATE_SCHEMA, timeslate_of
from staticclock.zones import list_timezones

__version__ = "0.2.0"
__author__ = "Aziel Eliab"
__all__ = [
    "AZOS_PRINCIPLE",
    "Advisory",
    "AzosHook",
    "Click",
    "GENESIS_PREV_HASH",
    "MOTTO",
    "NoRollbackError",
    "OUTPUT_FIELDS",
    "StaticClock",
    "TIMESLATE_SCHEMA",
    "Timeline",
    "VerifyResult",
    "list_timezones",
    "timeslate_of",
    "__version__",
]
