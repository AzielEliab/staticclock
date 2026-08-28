# staticclock download tracker

## Use with Grok, ChatGPT, Venice

This Worker now also hosts the product runtime API. `/v1` calls never increment DOWNLOADS KV.

- OpenAPI: `https://staticclock-download-tracker.vibelock.workers.dev/openapi.json`
- Health: `GET /v1/health` → `{ok, product, version:"0.1.0"}`
- Setup HTML: `GET /ai` (ChatGPT Actions, Grok/xAI custom tool, Venice custom HTTP; MCP catalog `https://aziel-runtime.vibelock.workers.dev/mcp`)

CORS `*` on API routes.
