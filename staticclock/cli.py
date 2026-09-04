"""Command-line interface for StaticClock.

    staticclock version
    staticclock click --action "session started"
    staticclock hook --action "invite accepted"
    staticclock timeline
    staticclock verify
    staticclock advise --geo "United States"
    staticclock anchors
    staticclock zones
    staticclock ui

Action-based immutable timeline. No rollbacks. AZ-OS hook.
Author: Aziel Eliab. Forks always allowed.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Sequence

from staticclock import __version__
from staticclock.anchors import TOP_30
from staticclock.azos import AzosHook
from staticclock.engine import OUTPUT_FIELDS, StaticClock
from staticclock.timeline import Timeline
from staticclock.zones import list_timezones


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="staticclock",
        description=(
            "StaticClock — action-based immutable timeline "
            "(Aziel Eliab, 2026). Every action is a gear click. "
            "Time only locks forward. AZ-OS hook. "
            "Local UI: `staticclock ui` at http://127.0.0.1:8765."
        ),
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("version", help="Print package version.")
    sub.add_parser("anchors", help="List the Top-30 geographic anchors.")

    p_click = sub.add_parser("click", help="Append one immutable gear click.")
    p_click.add_argument("--action", required=True, help="Action that becomes the next second.")
    p_click.add_argument("--source", default="local", help="Click source (default local).")
    p_click.add_argument("--timeline", help="Optional JSONL path. Created on first click.")
    p_click.add_argument("--json", action="store_true", dest="as_json", help="Print the click as JSON.")

    p_hook = sub.add_parser("hook", help="AZ-OS hook: record a principle-bound action. Does not exec.")
    p_hook.add_argument("--action", required=True, help="AZ-OS action to lock into the gear.")
    p_hook.add_argument("--session", default="", help="Optional AZ-OS session label.")
    p_hook.add_argument("--principle", default="", help="Optional principle label.")
    p_hook.add_argument("--timeline", help="Optional JSONL path.")
    p_hook.add_argument("--json", action="store_true", dest="as_json", help="Print the click as JSON.")

    p_tl = sub.add_parser("timeline", help="Show clicks on a JSONL timeline (or empty gear).")
    p_tl.add_argument("--timeline", help="JSONL path.")
    p_tl.add_argument("--json", action="store_true", dest="as_json", help="Print clicks as JSON.")

    p_ver = sub.add_parser("verify", help="Recompute hashes. Anyone can verify. No rollback.")
    p_ver.add_argument("--timeline", required=True, help="JSONL path.")
    p_ver.add_argument("--json", action="store_true", dest="as_json", help="Print verify result as JSON.")

    p_gen = sub.add_parser("genesis", help="First click of a new JSONL timeline. File must be absent or empty.")
    p_gen.add_argument("--timeline", required=True, help="New JSONL path.")
    p_gen.add_argument("--action", required=True, help="Genesis action.")
    p_gen.add_argument("--source", default="local")
    p_gen.add_argument("--json", action="store_true", dest="as_json")

    p_adv = sub.add_parser(
        "advise",
        help="Companion advisory for a last-known geo (also clicks the gear).",
    )
    p_adv.add_argument(
        "--geo",
        required=True,
        help="Last-known geo (free text) or a Top-30 country name.",
    )
    p_adv.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help="Print the five companion fields as JSON.",
    )

    sub.add_parser(
        "zones",
        help="Read-only IANA zones with computed current local times.",
    )

    p_ui = sub.add_parser(
        "ui",
        help="Serve the local timeline UI on 127.0.0.1.",
    )
    p_ui.add_argument("--host", default="127.0.0.1", help="Loopback host (default 127.0.0.1).")
    p_ui.add_argument("--port", type=int, default=8765, help="Port (default 8765).")

    p_serve = sub.add_parser(
        "serve",
        help="Alias for ui. Bind 127.0.0.1 only.",
    )
    p_serve.add_argument("--host", default="127.0.0.1", help="Loopback host (default 127.0.0.1).")
    p_serve.add_argument("--port", type=int, default=8765, help="Port (default 8765).")

    p_doc = sub.add_parser("doctor", help="Self-check. No network, no telemetry.")
    p_doc.add_argument("--json", action="store_true", dest="as_json", help="Print doctor results as JSON.")

    p_imp = sub.add_parser("import", help="Import a JSON document.")
    p_imp.add_argument("path")

    p_exp = sub.add_parser("export", help="Export a JSON document.")
    p_exp.add_argument("path")

    return parser


def _open_timeline(path: str | None) -> Timeline:
    if not path:
        return Timeline()
    pth = Path(path)
    if pth.exists() and pth.stat().st_size > 0:
        return Timeline.load(pth)
    return Timeline(path=pth)


def _print_click(tick, *, as_json: bool) -> None:
    if as_json:
        print(json.dumps(tick.to_dict(), indent=2, ensure_ascii=False))
        return
    print(f"click: {tick.click}")
    print(f"second: {tick.second}")
    print(f"action: {tick.action}")
    print(f"source: {tick.source}")
    print(f"hash: {tick.hash}")


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.cmd == "version":
        print(f"staticclock {__version__}")
        return 0

    if args.cmd == "anchors":
        for name in TOP_30:
            print(name)
        return 0

    if args.cmd == "click":
        gear = _open_timeline(getattr(args, "timeline", None))
        tick = gear.click(args.action, source=args.source)
        _print_click(tick, as_json=args.as_json)
        return 0

    if args.cmd == "hook":
        gear = _open_timeline(getattr(args, "timeline", None))
        hook = AzosHook(gear)
        tick = hook.record(args.action, session=args.session, principle=args.principle)
        _print_click(tick, as_json=args.as_json)
        return 0

    if args.cmd == "genesis":
        try:
            gear = Timeline.genesis(args.timeline, action=args.action, source=args.source)
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 2
        _print_click(gear[-1], as_json=args.as_json)
        return 0

    if args.cmd == "timeline":
        gear = _open_timeline(getattr(args, "timeline", None))
        rows = gear.to_list()
        if args.as_json:
            print(json.dumps({"clicks": rows, "length": len(rows)}, indent=2, ensure_ascii=False))
            return 0
        if not rows:
            print("empty gear")
            return 0
        for row in rows:
            print(f"{row['click']:4}  {row['second']}  {row['source']:8}  {row['action']}")
        return 0

    if args.cmd == "verify":
        gear = Timeline.load(args.timeline)
        result = gear.verify()
        if args.as_json:
            print(json.dumps(result.to_dict(), indent=2, ensure_ascii=False))
        else:
            print("ok" if result.ok else "broken")
            print(f"length: {result.length}")
            if result.last_hash:
                print(f"last_hash: {result.last_hash}")
            for err in result.errors:
                print(err, file=sys.stderr)
        return 0 if result.ok else 1

    if args.cmd == "advise":
        clock = StaticClock()
        try:
            advisory = clock.advise(args.geo)
        finally:
            clock.forget()
        payload = advisory.to_dict()
        if args.as_json:
            print(json.dumps(payload, indent=2, ensure_ascii=False))
        else:
            for key in OUTPUT_FIELDS:
                print(f"{key}: {payload[key]}")
        return 0

    if args.cmd == "zones":
        rows = list_timezones()
        for row in rows:
            print(
                f"{row['region']:16}  {row['iana']:36}  "
                f"{row['local_date']} {row['local_time']}  UTC{row['utc_offset']}"
            )
        return 0

    if args.cmd in {"ui", "serve"}:
        from staticclock.ui import serve

        try:
            serve(host=args.host, port=args.port)
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 2
        return 0

    if args.cmd == "doctor":
        from staticclock.doctor import run_doctor

        return run_doctor(as_json=getattr(args, "as_json", False))

    if args.cmd == "import":
        from staticclock.jsonio import import_json

        rec = import_json(args.path)
        sys.stdout.write(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")
        return 0

    if args.cmd == "export":
        from staticclock.jsonio import export_json

        rec = export_json(args.path)
        sys.stdout.write(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")
        return 0

    parser.error(f"unknown command {args.cmd}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
