"""Command-line interface for StaticClock.

    staticclock
    staticclock ui
    staticclock click --action "session started"
    staticclock timeline --timeline ticks.jsonl
    staticclock verify --timeline ticks.jsonl
    staticclock doctor

People get short text. Add --json when a program needs the same result as data.
Author: Aziel Eliab.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Sequence

from staticclock import __version__
from staticclock.anchors import TOP_30
from staticclock.azos import AzosHook
from staticclock.engine import OUTPUT_FIELDS, StaticClock
from staticclock.timeline import Timeline

AUTHOR = "Aziel Eliab"

START_COMMANDS: tuple[tuple[str, str], ...] = (
    ("ui", "Open the local timeline at http://127.0.0.1:8765"),
    ("click", "Record one action"),
    ("timeline", "Show recorded actions"),
    ("verify", "Check that the chain still matches"),
    ("doctor", "Check this install"),
)

ADVANCED_COMMANDS: tuple[tuple[str, str], ...] = (
    ("hook", "Record an AZ-OS action"),
    ("genesis", "Start a new timeline file"),
    ("timeslate", "Show the tip timeslate"),
    ("advise", "Companion place, time, language, and dialect"),
    ("anchors", "List the 30 place names"),
    ("zones", "Local times for those places"),
    ("import", "Import a JSON document"),
    ("export", "Export a JSON document"),
    ("serve", "Same as ui"),
    ("version", "Print the version"),
)


def _root_help() -> str:
    lines = [
        "StaticClock records actions in order. Each action locks forward as one click.",
        "",
        "usage:",
        "  staticclock",
        "  staticclock ui",
        '  staticclock click --action "opened the ledger"',
        "  staticclock --help",
        "",
        "Start",
    ]
    for name, blurb in START_COMMANDS:
        lines.append(f"  {name:<12}{blurb}")
    lines.append("")
    lines.append("Advanced")
    for name, blurb in ADVANCED_COMMANDS:
        lines.append(f"  {name:<12}{blurb}")
    lines.extend(
        [
            "",
            "Add --json on a command when a program needs data.",
            f"Author: {AUTHOR}",
            "",
        ]
    )
    return "\n".join(lines)


def _required_hint(command: str | None, message: str) -> str:
    hints = {
        "click": 'Click needs an action. Try: staticclock click --action "opened the ledger"',
        "hook": 'The AZ-OS hook needs an action. Try: staticclock hook --action "invite accepted"',
        "genesis": (
            "Genesis needs a new file and an action. "
            'Try: staticclock genesis --timeline ticks.jsonl --action "first click"'
        ),
        "verify": "Verify needs a timeline file. Try: staticclock verify --timeline ticks.jsonl",
        "timeslate": "Timeslate needs a timeline file. Try: staticclock timeslate --timeline ticks.jsonl",
        "advise": 'Advise needs a place. Try: staticclock advise --geo "United States"',
        "import": "Import needs a JSON file. Try: staticclock import notes.json",
        "export": "Export needs a destination file. Try: staticclock export notes.json",
    }
    if command in hints:
        return hints[command]
    if command:
        return f"{message}. Try: staticclock {command} --help"
    return f"{message}. Try: staticclock --help"


def _humanize_arg_error(command: str | None, message: str) -> str:
    choice = re.search(r"invalid choice: '([^']*)'", message)
    if choice:
        name = choice.group(1) or "(empty)"
        return f'Unknown command "{name}". Try: staticclock ui   or   staticclock --help'
    if "unrecognized arguments" in message:
        extra = message.split(":", 1)[-1].strip()
        hint = f"staticclock {command} --help" if command else "staticclock --help"
        return f"Unknown option {extra}. Try: {hint}"
    if "required" in message:
        return _required_hint(command, message)
    if command:
        return f"{message}. Try: staticclock {command} --help"
    return f"{message}. Try: staticclock --help"


class FriendlyParser(argparse.ArgumentParser):
    """Human errors, and a short root help page."""

    def format_help(self) -> str:
        if getattr(self, "_root_help", False):
            return _root_help()
        return super().format_help()

    def error(self, message: str) -> None:
        text = _humanize_arg_error(getattr(self, "_sc_name", None), message)
        self.exit(2, text + "\n")


def _fail(text: str) -> int:
    print(text, file=sys.stderr)
    return 2


def _build_parser() -> FriendlyParser:
    parser = FriendlyParser(
        prog="staticclock",
        description="StaticClock records actions in order.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser._root_help = True  # noqa: SLF001
    parser._sc_name = None  # noqa: SLF001
    parser.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help=argparse.SUPPRESS,
    )
    sub = parser.add_subparsers(dest="cmd", required=False, metavar="<command>")

    def add(name: str, *, help: str, description: str, epilog: str) -> argparse.ArgumentParser:
        command = sub.add_parser(
            name,
            help=help,
            description=description,
            epilog=epilog,
            formatter_class=argparse.RawDescriptionHelpFormatter,
        )
        command._sc_name = name  # noqa: SLF001
        return command

    add(
        "version",
        help="Print the version.",
        description="Print the StaticClock version.",
        epilog="Example: staticclock version",
    ).add_argument("--json", action="store_true", dest="as_json", help="Print version as JSON.")

    add(
        "anchors",
        help="List the 30 place names.",
        description="List the Top-30 geographic anchors, one name per line.",
        epilog="Example: staticclock anchors",
    ).add_argument("--json", action="store_true", dest="as_json", help="Print the names as JSON.")

    p_click = add(
        "click",
        help="Record one action.",
        description="Record one action. It locks forward as the next click.",
        epilog='Example: staticclock click --action "opened the ledger"',
    )
    p_click.add_argument("--action", required=True, help="Action that becomes the next click.")
    p_click.add_argument("--source", default="local", help="Click source (default local).")
    p_click.add_argument("--timeline", help="Optional JSONL path. Created on first click.")
    p_click.add_argument("--json", action="store_true", dest="as_json", help="Print the click as JSON.")

    p_hook = add(
        "hook",
        help="Record an AZ-OS action.",
        description="Record a principle-bound action into the timeline.",
        epilog='Example: staticclock hook --action "invite accepted" --session azos-1',
    )
    p_hook.add_argument("--action", required=True, help="AZ-OS action to lock into the gear.")
    p_hook.add_argument("--session", default="", help="Optional AZ-OS session label.")
    p_hook.add_argument("--principle", default="", help="Optional principle label.")
    p_hook.add_argument("--timeline", help="Optional JSONL path.")
    p_hook.add_argument("--json", action="store_true", dest="as_json", help="Print the click as JSON.")

    p_tl = add(
        "timeline",
        help="Show recorded actions.",
        description="Show clicks on a JSONL timeline, or an empty in-memory gear.",
        epilog="Example: staticclock timeline --timeline ticks.jsonl",
    )
    p_tl.add_argument("--timeline", help="JSONL path.")
    p_tl.add_argument("--json", action="store_true", dest="as_json", help="Print clicks as JSON.")

    p_ver = add(
        "verify",
        help="Check that the chain still matches.",
        description="Recompute hashes. Anyone can verify.",
        epilog="Example: staticclock verify --timeline ticks.jsonl",
    )
    p_ver.add_argument("--timeline", required=True, help="JSONL path.")
    p_ver.add_argument("--json", action="store_true", dest="as_json", help="Print verify result as JSON.")

    p_ts = add(
        "timeslate",
        help="Show the tip timeslate.",
        description="Emit the tip timeslate TemporalLock binds into its lattice.",
        epilog="Example: staticclock timeslate --timeline ticks.jsonl",
    )
    p_ts.add_argument("--timeline", required=True, help="JSONL path.")
    p_ts.add_argument("--json", action="store_true", dest="as_json", help="Print timeslate as JSON.")

    p_gen = add(
        "genesis",
        help="Start a new timeline file.",
        description="First click of a new JSONL timeline. The file must be absent or empty.",
        epilog='Example: staticclock genesis --timeline ticks.jsonl --action "first click"',
    )
    p_gen.add_argument("--timeline", required=True, help="New JSONL path.")
    p_gen.add_argument("--action", required=True, help="Genesis action.")
    p_gen.add_argument("--source", default="local")
    p_gen.add_argument("--json", action="store_true", dest="as_json")

    p_adv = add(
        "advise",
        help="Companion place, time, language, and dialect.",
        description="Companion advisory for a last-known place. This also records a click.",
        epilog='Example: staticclock advise --geo "United States"',
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

    p_zones = add(
        "zones",
        help="Local times for the 30 places.",
        description="Read-only IANA zones with computed current local times.",
        epilog="Example: staticclock zones",
    )
    p_zones.add_argument("--json", action="store_true", dest="as_json", help="Print zones as JSON.")

    for name, blurb in (("ui", "Open the local timeline on 127.0.0.1."), ("serve", "Same as ui.")):
        command = add(
            name,
            help=blurb,
            description="Serve the local timeline on this computer only.",
            epilog="Example: staticclock ui",
        )
        command.add_argument("--host", default="127.0.0.1", help="Loopback host (default 127.0.0.1).")
        command.add_argument("--port", type=int, default=8765, help="Port (default 8765).")

    p_doc = add(
        "doctor",
        help="Check this install.",
        description="Self-check. No network, no telemetry.",
        epilog="Example: staticclock doctor",
    )
    p_doc.add_argument("--json", action="store_true", dest="as_json", help="Print doctor results as JSON.")

    p_imp = add(
        "import",
        help="Import a JSON document.",
        description="Import a JSON document into the local state file.",
        epilog="Example: staticclock import notes.json",
    )
    p_imp.add_argument("path", help="JSON file to import.")
    p_imp.add_argument("--json", action="store_true", dest="as_json", help="Print the import record as JSON.")

    p_exp = add(
        "export",
        help="Export a JSON document.",
        description="Export the local state file as JSON.",
        epilog="Example: staticclock export notes.json",
    )
    p_exp.add_argument("path", help="Destination JSON file.")
    p_exp.add_argument("--json", action="store_true", dest="as_json", help="Print the export record as JSON.")

    return parser


def _welcome(*, as_json: bool) -> int:
    if as_json:
        print(
            json.dumps(
                {
                    "product": "staticclock",
                    "version": __version__,
                    "author": AUTHOR,
                    "next": "staticclock ui",
                },
                indent=2,
            )
        )
        return 0
    print("StaticClock records actions in order. Each action locks forward as one click.")
    print()
    print("Open the timeline:")
    print("  staticclock ui")
    print()
    print("Or record one action:")
    print('  staticclock click --action "opened the ledger"')
    print()
    print("Check this install:")
    print("  staticclock doctor")
    print()
    print("More commands: staticclock --help")
    print(f"Author: {AUTHOR}")
    return 0


def _open_timeline(path: str | None) -> Timeline:
    if not path:
        return Timeline()
    pth = Path(path)
    if pth.exists() and pth.stat().st_size > 0:
        return _load_existing(str(pth))
    return Timeline(path=pth)


def _load_existing(path: str) -> Timeline:
    pth = Path(path)
    if not pth.is_file():
        raise FileNotFoundError(path)
    try:
        return Timeline.load(pth)
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        raise ValueError(f"{path} is not a StaticClock timeline") from exc


def _print_click(tick, *, as_json: bool, lead: str) -> None:
    if as_json:
        print(json.dumps(tick.to_dict(), indent=2, ensure_ascii=False))
        return
    print(lead)
    print(f"click: {tick.click}")
    print(f"second: {tick.second}")
    print(f"action: {tick.action}")
    print(f"source: {tick.source}")
    print(f"hash: {tick.hash}")


def _click_error(exc: ValueError, command: str) -> int:
    text = str(exc)
    if "not a StaticClock timeline" in text:
        return _fail(f"{text}. Try: staticclock doctor")
    if "action is required" in text:
        if command == "hook":
            return _fail('The AZ-OS hook needs an action. Try: staticclock hook --action "invite accepted"')
        if command == "genesis":
            return _fail(
                'Genesis needs an action. Try: staticclock genesis --timeline ticks.jsonl --action "first click"'
            )
        return _fail('Click needs an action. Try: staticclock click --action "opened the ledger"')
    return _fail(f"{text}. Try: staticclock {command} --help")


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    try:
        args = parser.parse_args(list(argv) if argv is not None else None)
    except SystemExit as exc:
        code = exc.code
        if code is None:
            return 0
        return code if isinstance(code, int) else 2

    if args.cmd is None:
        return _welcome(as_json=bool(getattr(args, "as_json", False)))

    if args.cmd == "version":
        if getattr(args, "as_json", False):
            print(json.dumps({"version": __version__, "author": AUTHOR}, indent=2))
        else:
            print(f"staticclock {__version__}")
        return 0

    if args.cmd == "anchors":
        names = list(TOP_30)
        if getattr(args, "as_json", False):
            print(json.dumps(names, indent=2, ensure_ascii=False))
        else:
            for name in names:
                print(name)
        return 0

    if args.cmd == "click":
        try:
            gear = _open_timeline(getattr(args, "timeline", None))
            tick = gear.click(args.action, source=args.source)
        except ValueError as exc:
            return _click_error(exc, "click")
        _print_click(tick, as_json=args.as_json, lead="Recorded.")
        return 0

    if args.cmd == "hook":
        try:
            gear = _open_timeline(getattr(args, "timeline", None))
            hook = AzosHook(gear)
            tick = hook.record(args.action, session=args.session, principle=args.principle)
        except ValueError as exc:
            return _click_error(exc, "hook")
        _print_click(tick, as_json=args.as_json, lead="Recorded with the AZ-OS hook.")
        return 0

    if args.cmd == "genesis":
        try:
            gear = Timeline.genesis(args.timeline, action=args.action, source=args.source)
        except ValueError as exc:
            text = str(exc)
            if "already exists" in text:
                return _fail(
                    f"{text}. Try: staticclock click --timeline {args.timeline} --action \"next\""
                )
            return _click_error(exc, "genesis")
        _print_click(gear[-1], as_json=args.as_json, lead="Recorded the first click.")
        return 0

    if args.cmd == "timeline":
        path = getattr(args, "timeline", None)
        if path and not Path(path).exists():
            return _fail(f'Could not find "{path}". Try: staticclock click --timeline {path} --action "opened the ledger"')
        try:
            gear = _open_timeline(path)
        except ValueError as exc:
            return _fail(f"{exc}. Try: staticclock timeline --help")
        rows = gear.to_list()
        if args.as_json:
            print(json.dumps({"clicks": rows, "length": len(rows)}, indent=2, ensure_ascii=False))
            return 0
        if not rows:
            print("No actions yet.")
            print('Try: staticclock click --action "opened the ledger"')
            return 0
        for row in rows:
            print(f"{row['click']:4}  {row['second']}  {row['source']:8}  {row['action']}")
        return 0

    if args.cmd == "verify":
        try:
            gear = _load_existing(args.timeline)
        except FileNotFoundError:
            return _fail(
                f'Could not find "{args.timeline}". Try: staticclock verify --timeline ticks.jsonl'
            )
        except ValueError as exc:
            return _fail(f"{exc}. Try: staticclock verify --timeline ticks.jsonl")
        result = gear.verify()
        if args.as_json:
            print(json.dumps(result.to_dict(), indent=2, ensure_ascii=False))
        else:
            print("Status: checks out" if result.ok else "Status: does not check out")
            print(f"Actions: {result.length}")
            if result.last_hash:
                print(f"Last hash: {result.last_hash}")
            for err in result.errors:
                print(err, file=sys.stderr)
            if not result.ok:
                print(
                    'Next: recorded actions stay. Add a new one with staticclock click --action "note"',
                    file=sys.stderr,
                )
        return 0 if result.ok else 1

    if args.cmd == "timeslate":
        try:
            gear = _load_existing(args.timeline)
        except FileNotFoundError:
            return _fail(
                f'Could not find "{args.timeline}". Try: staticclock timeslate --timeline ticks.jsonl'
            )
        except ValueError as exc:
            return _fail(f"{exc}. Try: staticclock timeslate --timeline ticks.jsonl")
        slate = gear.timeslate()
        if slate is None:
            print(
                "No actions on this timeline yet. "
                'Try: staticclock click --timeline ticks.jsonl --action "opened the ledger"',
                file=sys.stderr,
            )
            return 2
        if args.as_json:
            print(json.dumps(slate, indent=2, ensure_ascii=False))
        else:
            print(f"click: {slate['click']}")
            print(f"second: {slate['second']}")
            print(f"click_hash: {slate['click_hash']}")
            print(f"cross_hash: {slate['cross_hash']}")
            print(f"lattice: {slate['lattice']}")
            print(f"evidence: {slate['evidence']}")
        return 0

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
            print("Companion advisory")
            for key in OUTPUT_FIELDS:
                print(f"{key}: {payload[key]}")
        return 0

    if args.cmd == "zones":
        from staticclock.zones import list_timezones

        rows = list_timezones()
        if getattr(args, "as_json", False):
            print(json.dumps(rows, indent=2, ensure_ascii=False))
            return 0
        print("Local times")
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
            return _fail(str(exc))
        except OSError as exc:
            return _fail(f"Could not open the timeline ({exc}). Try: staticclock ui --port 8766")
        return 0

    if args.cmd == "doctor":
        from staticclock.doctor import run_doctor

        return run_doctor(as_json=getattr(args, "as_json", False))

    if args.cmd == "import":
        from staticclock.jsonio import import_json

        try:
            rec = import_json(args.path)
        except FileNotFoundError:
            return _fail(f'Could not find "{args.path}". Try: staticclock import notes.json')
        except json.JSONDecodeError:
            return _fail(f'"{args.path}" is not JSON. Try: staticclock import notes.json')
        except ValueError as exc:
            return _fail(f"{exc}. Try: staticclock import notes.json")
        if args.as_json:
            sys.stdout.write(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")
        else:
            print(f"Imported {rec['imported']}")
            print(f"Stored {rec['stored']}")
            keys = ", ".join(rec.get("keys") or [])
            print(f"Keys: {keys}" if keys else "Keys: (none)")
        return 0

    if args.cmd == "export":
        from staticclock.jsonio import export_json

        try:
            rec = export_json(args.path)
        except OSError as exc:
            return _fail(f'Could not write "{args.path}" ({exc}). Try: staticclock export notes.json')
        if args.as_json:
            sys.stdout.write(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")
        else:
            print(f"Exported {rec['exported']}")
            print(f"Author: {rec['author']}")
        return 0

    return _fail(f'Unknown command "{args.cmd}". Try: staticclock ui   or   staticclock --help')


if __name__ == "__main__":
    raise SystemExit(main())
