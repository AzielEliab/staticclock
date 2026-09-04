"""StaticClock engine: advise companion plus the immutable gear.

The advisory session still forgets its nonce and last-known geo.
``forget()`` does not rewind the timeline. Every advise is also a click.
"""

from __future__ import annotations

import json
import secrets
from dataclasses import asdict, dataclass

from staticclock.anchors import basket_of, resolve_geo
from staticclock.azos import AzosHook
from staticclock.chronolect import local_date, pick_time
from staticclock.glossa import pick_dialect, primary_language
from staticclock.index import record
from staticclock.polarize import shake
from staticclock.timeline import Click, Timeline

OUTPUT_FIELDS: tuple[str, ...] = (
    "geo_location_chosen",
    "optimal_time",
    "optimal_date",
    "primary_language",
    "dialect_section",
)

_BANNED_USER_KEYS = frozenset(
    {
        "because",
        "score",
        "confidence",
        "alternative",
        "alternatives",
        "reason",
        "reasons",
        "explanation",
    }
)


@dataclass(frozen=True)
class Advisory:
    geo_location_chosen: str
    optimal_time: str
    optimal_date: str
    primary_language: str
    dialect_section: str

    def to_dict(self) -> dict[str, str]:
        payload = asdict(self)
        if tuple(payload.keys()) != OUTPUT_FIELDS:
            payload = {k: payload[k] for k in OUTPUT_FIELDS}
        extra = set(payload) - set(OUTPUT_FIELDS)
        if extra:
            raise ValueError(f"advisory leaked extra fields: {extra}")
        banned = _BANNED_USER_KEYS & {k.lower() for k in payload}
        if banned:
            raise ValueError(f"advisory leaked banned keys: {banned}")
        return payload

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)

    def to_text(self) -> str:
        d = self.to_dict()
        return "\n".join(f"{k}: {d[k]}" for k in OUTPUT_FIELDS)


class StaticClock:
    """Action session: append-only gear plus an optional advisory companion.

    ``nonce`` is a test hook for advise(). Production callers omit it.
    After ``advise()``, ``forget()`` drops nonce and inputs. The gear
    stays. There is no rollback.
    """

    def __init__(
        self,
        nonce: bytes | None = None,
        timeline: Timeline | None = None,
    ) -> None:
        self._pin = nonce
        self._nonce: bytes | None = None
        self._last_inputs: dict[str, str] | None = None
        self._forgotten = False
        self._timeline = timeline if timeline is not None else Timeline()

    @property
    def timeline(self) -> Timeline:
        return self._timeline

    def azos_hook(self) -> AzosHook:
        return AzosHook(self._timeline)

    def click(self, action: str, *, source: str = "local") -> Click:
        return self._timeline.click(action, source=source)

    def advise(self, geo: str) -> Advisory:
        nonce = self._pin if self._pin is not None else secrets.token_bytes(16)
        self._nonce = nonce
        self._last_inputs = {"geo": geo}
        self._forgotten = False

        anchor = resolve_geo(geo)
        basket = basket_of(anchor)
        chosen = shake(basket, nonce, salt=b"geo")
        rec = record(chosen)
        language = primary_language(chosen)
        dialect = pick_dialect(language, nonce)
        clock = pick_time(chosen, nonce)
        day = local_date(str(rec["iana"]))

        advisory = Advisory(
            geo_location_chosen=chosen,
            optimal_time=clock,
            optimal_date=day.isoformat(),
            primary_language=language,
            dialect_section=dialect,
        )
        self._timeline.click(f"advise {chosen}", source="advise")
        return advisory

    def forget(self) -> None:
        """Drop nonce and last advisory inputs. Does not rewind the gear."""
        self._nonce = None
        self._last_inputs = None
        self._forgotten = True

    @property
    def forgotten(self) -> bool:
        return self._forgotten

    @property
    def last_inputs(self) -> dict[str, str] | None:
        if self._last_inputs is None:
            return None
        return dict(self._last_inputs)

    @property
    def nonce(self) -> bytes | None:
        return self._nonce

    def __enter__(self) -> "StaticClock":
        return self

    def __exit__(self, *exc: object) -> None:
        self.forget()
