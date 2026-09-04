"""Local StaticClock UI. Bind 127.0.0.1 only.

Process-local append-only gear. Click, AZ-OS hook, verify.
Companion advise still returns five fields and also clicks the gear.
Self-contained CSS. No CDN. No rollback endpoint.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib.resources import files
from urllib.parse import urlparse

from staticclock.anchors import TOP_30
from staticclock.azos import AzosHook
from staticclock.engine import OUTPUT_FIELDS, StaticClock
from staticclock.timeline import NoRollbackError, Timeline
from staticclock.zones import list_timezones

LOOPBACK = frozenset({"127.0.0.1", "localhost", "::1"})
WEB = files("staticclock") / "web"
MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
}

_GEAR = Timeline()


def reset_gear() -> None:
    """Test hook. Production UI never rewinds; tests may start a fresh process gear."""
    global _GEAR
    _GEAR = Timeline()


class Handler(BaseHTTPRequestHandler):
    server_version = "StaticClock/0.2.0"

    def log_message(self, fmt: str, *args: object) -> None:
        return

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, obj: object) -> None:
        body = json.dumps(obj, indent=2, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        payload = json.loads(raw.decode("utf-8") or "{}")
        if not isinstance(payload, dict):
            raise ValueError("JSON object required")
        return payload

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in {"/", "/index.html"}:
            self._send(200, _web_bytes("index.html"), MIME[".html"])
            return
        if path == "/style.css":
            self._send(200, _web_bytes("style.css"), MIME[".css"])
            return
        if path == "/app.js":
            self._send(200, _web_bytes("app.js"), MIME[".js"])
            return
        if path == "/api/anchors":
            self._json(200, list(TOP_30))
            return
        if path == "/api/zones":
            self._json(200, list_timezones())
            return
        if path == "/api/timeline":
            self._json(
                200,
                {
                    "clicks": _GEAR.to_list(),
                    "length": len(_GEAR),
                    "verify": _GEAR.verify().to_dict(),
                    "timeslate": _GEAR.timeslate(),
                },
            )
            return
        if path == "/api/timeslate":
            slate = _GEAR.timeslate()
            if slate is None:
                self._json(200, {"empty": True, "timeslate": None})
                return
            self._json(200, slate)
            return
        if path == "/api/hook":
            self._json(200, AzosHook(_GEAR).status())
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in {"/api/rollback", "/api/rewind"}:
            self._json(400, {"error": "the gear does not rewind", "rollbacks": False})
            return
        try:
            payload = self._read_json()
        except (json.JSONDecodeError, ValueError):
            self._json(400, {"error": "JSON body required"})
            return

        if path == "/api/click":
            action = str(payload.get("action") or "")
            source = str(payload.get("source") or "local")
            try:
                tick = _GEAR.click(action, source=source)
            except ValueError as exc:
                self._json(400, {"error": str(exc)})
                return
            except NoRollbackError as exc:
                self._json(400, {"error": str(exc)})
                return
            self._json(
                200,
                {
                    "click": tick.to_dict(),
                    "clicks": _GEAR.to_list(),
                    "verify": _GEAR.verify().to_dict(),
                    "timeslate": _GEAR.timeslate(),
                },
            )
            return

        if path == "/api/hook":
            action = str(payload.get("action") or "")
            session = str(payload.get("session") or "")
            principle = str(payload.get("principle") or "")
            hook = AzosHook(_GEAR)
            try:
                tick = hook.record(action, session=session, principle=principle)
            except ValueError as exc:
                self._json(400, {"error": str(exc)})
                return
            self._json(
                200,
                {
                    "click": tick.to_dict(),
                    "clicks": _GEAR.to_list(),
                    "verify": _GEAR.verify().to_dict(),
                    "timeslate": _GEAR.timeslate(),
                    "hook": hook.status(),
                },
            )
            return

        if path == "/api/verify":
            self._json(200, _GEAR.verify().to_dict())
            return

        if path == "/api/advise":
            geo = str(payload.get("geo") or payload.get("anchor") or "")
            clock = StaticClock(timeline=_GEAR)
            try:
                advisory = clock.advise(geo)
                data = advisory.to_dict()
            finally:
                clock.forget()
            self._json(200, {k: data[k] for k in OUTPUT_FIELDS})
            return

        self._json(404, {"error": "not found"})


def _web_bytes(name: str) -> bytes:
    return (WEB / name).read_bytes()


def make_server(host: str = "127.0.0.1", port: int = 8765) -> ThreadingHTTPServer:
    if host not in LOOPBACK:
        raise ValueError("StaticClock UI binds loopback only (127.0.0.1)")
    return ThreadingHTTPServer((host, port), Handler)


def serve(host: str = "127.0.0.1", port: int = 8765) -> None:
    httpd = make_server(host, port)
    bound_host, bound_port = httpd.server_address[:2]
    print(f"StaticClock UI http://{bound_host}:{bound_port} (loopback only; gear clicks forward)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    finally:
        httpd.server_close()
