"""Append-only gear-click timeline.

Every action is one click — one second that locks forward.
No rollbacks. The gear does not rewind.

Author: Aziel Eliab
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator, Sequence

GENESIS_PREV_HASH = "0" * 64
CORE_FIELDS = ("action", "click", "prev_hash", "second", "source")
AUTHOR = "Aziel Eliab"
MOTTO = "Every action is a gear click. Time only locks forward."


class NoRollbackError(Exception):
    """The gear does not rewind."""


def utc_second(when: datetime | None = None) -> str:
    """UTC timestamp truncated to the second (``YYYY-MM-DDTHH:MM:SSZ``)."""
    now = when if when is not None else datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    else:
        now = now.astimezone(timezone.utc)
    return now.replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def canonical_bytes(
    *,
    click: int,
    second: str,
    action: str,
    source: str,
    prev_hash: str,
) -> bytes:
    """UTF-8 JSON, sorted keys, no extra whitespace. ``hash`` is excluded."""
    payload: dict[str, Any] = {
        "action": action,
        "click": int(click),
        "prev_hash": prev_hash,
        "second": second,
        "source": source,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )


def digest(
    *,
    click: int,
    second: str,
    action: str,
    source: str,
    prev_hash: str,
) -> str:
    return hashlib.sha256(
        canonical_bytes(
            click=click,
            second=second,
            action=action,
            source=source,
            prev_hash=prev_hash,
        )
    ).hexdigest()


@dataclass(frozen=True)
class Click:
    click: int
    second: str
    action: str
    source: str
    prev_hash: str
    hash: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "click": self.click,
            "second": self.second,
            "action": self.action,
            "source": self.source,
            "prev_hash": self.prev_hash,
            "hash": self.hash,
        }

    def recomputed_hash(self) -> str:
        return digest(
            click=self.click,
            second=self.second,
            action=self.action,
            source=self.source,
            prev_hash=self.prev_hash,
        )

    @classmethod
    def create(
        cls,
        *,
        click: int,
        action: str,
        source: str = "local",
        prev_hash: str = GENESIS_PREV_HASH,
        second: str | None = None,
    ) -> "Click":
        text = action.strip()
        if not text:
            raise ValueError("action is required")
        src = (source or "local").strip() or "local"
        if int(click) < 1:
            raise ValueError("click must be >= 1")
        sec = second or utc_second()
        digest_hex = digest(
            click=int(click),
            second=sec,
            action=text,
            source=src,
            prev_hash=prev_hash,
        )
        return cls(
            click=int(click),
            second=sec,
            action=text,
            source=src,
            prev_hash=prev_hash,
            hash=digest_hex,
        )

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Click":
        return cls(
            click=int(data["click"]),
            second=str(data["second"]),
            action=str(data["action"]),
            source=str(data.get("source") or "local"),
            prev_hash=str(data["prev_hash"]),
            hash=str(data["hash"]),
        )


@dataclass(frozen=True)
class VerifyResult:
    ok: bool
    length: int
    first_hash: str | None
    last_hash: str | None
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "length": self.length,
            "first_hash": self.first_hash,
            "last_hash": self.last_hash,
            "errors": list(self.errors),
        }


def _click_json_line(tick: Click) -> str:
    return json.dumps(tick.to_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _append_line(path: Path, tick: Click) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(_click_json_line(tick))
        fh.write("\n")
        fh.flush()


class Timeline:
    """In-memory and/or JSONL-backed append-only gear.

    ``timeline.click(action)`` only. No modify, no delete, no rollback.
    A later action that mentions an earlier hash is a new click.
    The old click stays.
    """

    def __init__(
        self,
        clicks: Sequence[Click] | None = None,
        path: str | Path | None = None,
    ) -> None:
        self._clicks: tuple[Click, ...] = tuple(clicks or ())
        self._path: Path | None = Path(path) if path is not None else None

    @property
    def path(self) -> Path | None:
        return self._path

    def __len__(self) -> int:
        return len(self._clicks)

    def __iter__(self) -> Iterator[Click]:
        return iter(self._clicks)

    def __getitem__(self, index: int) -> Click:
        return self._clicks[index]

    def __bool__(self) -> bool:
        return bool(self._clicks)

    def to_list(self) -> list[dict[str, Any]]:
        return [tick.to_dict() for tick in self._clicks]

    def _refuse(self, action: str) -> None:
        raise NoRollbackError(f"cannot {action}: the gear does not rewind")

    def rollback(self, *args: object, **kwargs: object) -> None:
        self._refuse("rollback")

    def rewind(self, *args: object, **kwargs: object) -> None:
        self._refuse("rewind")

    def pop(self, *args: object, **kwargs: object) -> None:
        self._refuse("pop")

    def insert(self, *args: object, **kwargs: object) -> None:
        self._refuse("insert")

    def remove(self, *args: object, **kwargs: object) -> None:
        self._refuse("remove")

    def clear(self) -> None:
        self._refuse("clear")

    def reverse(self) -> None:
        self._refuse("reverse")

    def __setitem__(self, *args: object, **kwargs: object) -> None:
        self._refuse("replace")

    def __delitem__(self, *args: object, **kwargs: object) -> None:
        self._refuse("delete")

    @classmethod
    def load(cls, path: str | Path) -> "Timeline":
        path = Path(path)
        clicks: list[Click] = []
        if path.is_file():
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                clicks.append(Click.from_dict(json.loads(line)))
        return cls(clicks, path=path)

    @classmethod
    def from_dicts(cls, rows: Sequence[dict[str, Any]] | None) -> "Timeline":
        clicks = [Click.from_dict(row) for row in (rows or ())]
        return cls(clicks)

    @classmethod
    def genesis(
        cls,
        path: str | Path,
        *,
        action: str,
        source: str = "local",
        second: str | None = None,
    ) -> "Timeline":
        path = Path(path)
        if path.exists() and path.stat().st_size > 0:
            raise ValueError(f"timeline already exists: {path}; use click")
        gear = cls((), path=path)
        gear.click(action, source=source, second=second)
        return gear

    def click(
        self,
        action: str,
        *,
        source: str = "local",
        second: str | None = None,
    ) -> Click:
        prev = self._clicks[-1].hash if self._clicks else GENESIS_PREV_HASH
        tick = Click.create(
            click=len(self._clicks) + 1,
            action=action,
            source=source,
            prev_hash=prev,
            second=second,
        )
        if self._path is not None:
            _append_line(self._path, tick)
        self._clicks = self._clicks + (tick,)
        return tick

    def timeslate(self) -> dict[str, Any] | None:
        """Timeslate of the tip click, or None on an empty gear.

        TemporalLock binds this cross-hash into its lattice.
        """
        if not self._clicks:
            return None
        from staticclock.timeslate import timeslate_of

        return timeslate_of(self._clicks[-1])

    def verify(self) -> VerifyResult:
        errors: list[str] = []
        n = len(self._clicks)
        first = self._clicks[0].hash if n else None
        last = self._clicks[-1].hash if n else None
        for i, tick in enumerate(self._clicks):
            expected = tick.recomputed_hash()
            if tick.hash != expected:
                errors.append(f"index {i}: stored hash {tick.hash} != recomputed {expected}")
            if tick.click != i + 1:
                errors.append(f"index {i}: click {tick.click} != {i + 1}")
            if i == 0:
                if tick.prev_hash != GENESIS_PREV_HASH:
                    errors.append(f"index 0: prev_hash {tick.prev_hash} != genesis zeros")
                continue
            prev = self._clicks[i - 1]
            if tick.prev_hash != prev.hash:
                errors.append(f"index {i}: prev_hash {tick.prev_hash} != previous.hash {prev.hash}")
        return VerifyResult(
            ok=not errors,
            length=n,
            first_hash=first,
            last_hash=last,
            errors=errors,
        )
