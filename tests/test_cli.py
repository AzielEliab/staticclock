"""CLI: version, anchors, advise, zones. JSON is five fields only."""

from __future__ import annotations

import json

from staticclock import __version__
from staticclock.anchors import TOP_30
from staticclock.cli import main
from staticclock.engine import OUTPUT_FIELDS, StaticClock
from staticclock.ui import LOOPBACK, make_server
from staticclock.zones import list_timezones


def test_cli_version(capsys) -> None:
    assert main(["version"]) == 0
    assert capsys.readouterr().out.strip() == f"staticclock {__version__}"


def test_cli_anchors(capsys) -> None:
    assert main(["anchors"]) == 0
    lines = [ln for ln in capsys.readouterr().out.splitlines() if ln.strip()]
    assert lines == list(TOP_30)
    assert len(lines) == 30


def test_cli_advise_plain(capsys) -> None:
    assert main(["advise", "--geo", "United States"]) == 0
    out = capsys.readouterr().out
    for key in OUTPUT_FIELDS:
        assert f"{key}:" in out
    low = out.lower()
    assert "because" not in low
    assert "confidence" not in low
    assert "score" not in low


def test_cli_advise_json_only_five_fields(capsys) -> None:
    assert main(["advise", "--geo", "Indiana", "--json"]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert list(payload.keys()) == list(OUTPUT_FIELDS)
    blob = json.dumps(payload).lower()
    for word in ("because", "score", "confidence"):
        assert word not in blob


def test_cli_zones_readonly_does_not_change_advisory(capsys) -> None:
    clock = StaticClock(nonce=b"zone-nonce-16byte")
    before = clock.advise("Sweden")
    assert main(["zones"]) == 0
    out = capsys.readouterr().out
    assert "Europe/Stockholm" in out
    after = clock.advise("Sweden")
    assert before.to_dict() == after.to_dict()


def test_list_timezones_has_iana_and_local_times() -> None:
    rows = list_timezones()
    assert len(rows) == 30
    for row in rows:
        assert "iana" in row and "/" in row["iana"]
        assert ":" in row["local_time"]
        assert row["local_date"]


def test_ui_rejects_non_loopback() -> None:
    import pytest

    with pytest.raises(ValueError, match="loopback"):
        make_server("0.0.0.0", 9)
    assert "127.0.0.1" in LOOPBACK


def test_ui_handler_advise_five_fields() -> None:
    import json
    import threading
    import urllib.request

    from staticclock.ui import reset_gear

    reset_gear()
    httpd = make_server("127.0.0.1", 0)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=3) as resp:
            html = resp.read().decode("utf-8")
        assert "last-known geo" in html.lower() or "Last-known geo" in html
        assert "dialect" in html.lower()
        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/advise",
            data=json.dumps({"geo": "United States"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        assert list(payload.keys()) == list(OUTPUT_FIELDS)
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_help_lists_ui_and_version() -> None:
    from staticclock.cli import _build_parser

    text = _build_parser().format_help()
    assert "ui" in text
    assert "version" in text
    assert "click" in text
    assert "hook" in text
    assert "127.0.0.1:8765" in text or "staticclock ui" in text


def test_cli_click_and_verify(tmp_path, capsys) -> None:
    path = str(tmp_path / "ticks.jsonl")
    assert main(["genesis", "--timeline", path, "--action", "first", "--json"]) == 0
    first = json.loads(capsys.readouterr().out)
    assert first["click"] == 1
    assert main(["click", "--timeline", path, "--action", "second", "--json"]) == 0
    second = json.loads(capsys.readouterr().out)
    assert second["click"] == 2
    assert second["prev_hash"] == first["hash"]
    assert main(["verify", "--timeline", path, "--json"]) == 0
    result = json.loads(capsys.readouterr().out)
    assert result["ok"] is True
    assert result["length"] == 2


def test_cli_hook_azos_source(tmp_path, capsys) -> None:
    path = str(tmp_path / "hook.jsonl")
    assert main(["hook", "--timeline", path, "--action", "invite accepted", "--json"]) == 0
    tick = json.loads(capsys.readouterr().out)
    assert tick["source"] == "azos"
    assert tick["click"] == 1


def test_ui_click_and_refuses_rollback() -> None:
    import json
    import threading
    import urllib.error
    import urllib.request

    from staticclock.ui import reset_gear

    reset_gear()
    httpd = make_server("127.0.0.1", 0)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=3) as resp:
            html = resp.read().decode("utf-8")
        assert "gear click" in html.lower()
        assert "az-os" in html.lower()
        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/click",
            data=json.dumps({"action": "opened"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        assert payload["click"]["click"] == 1
        assert payload["verify"]["ok"] is True
        hook_req = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/hook",
            data=json.dumps({"action": "invite accepted", "session": "s1"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(hook_req, timeout=3) as resp:
            hooked = json.loads(resp.read().decode("utf-8"))
        assert hooked["click"]["source"] == "azos"
        bad = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/rollback",
            data=b"{}",
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            urllib.request.urlopen(bad, timeout=3)
            raise AssertionError("rollback must fail")
        except urllib.error.HTTPError as exc:
            assert exc.code == 400
            body = json.loads(exc.read().decode("utf-8"))
            assert body["rollbacks"] is False
    finally:
        httpd.shutdown()
        httpd.server_close()
        reset_gear()
