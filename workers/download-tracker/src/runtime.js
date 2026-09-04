/**
 * StaticClock hosted runtime: append-only gear-click timeline + AZ-OS hook.
 * Companion advisory remains. /v1 never touches DOWNLOADS KV and never stores a chain.
 * Author Aziel Eliab.
 */
import INDEX from "./index-data.json";

const PRODUCT = "staticclock";
const VERSION = "0.2.0";
const AUTHOR = "Aziel Eliab";
const MOTTO = "Every action is a gear click. Time only locks forward.";
const HOST = "https://staticclock-download-tracker.vibelock.workers.dev";
const GENESIS_PREV_HASH = "0".repeat(64);
const SKILL = "---\nname: StaticClock\ndescription: Use when recording an action into an immutable gear-click timeline, or when an AZ-OS session should lock an action forward. No rollbacks. Hosted /v1 via this Worker or aziel-runtime. Author Aziel Eliab.\n---\n\n# StaticClock\n\nEvery action is a gear click. Time only locks forward.\n\nAuthor: **Aziel Eliab**.\n\n**THIS IS:** an action-based immutable timeline. Each action is a click or second that locks forward. AZ-OS hook records principle-bound actions into the gear.\n\n**THIS IS NOT:** a rollback clock, a remote shell, or ChronoLock. ChronoLock is the related advisory-window product. TemporalLock is observation receipts. Hosted `/v1` does not increment downloads or views and does not store a chain.\n\nAlways send `User-Agent: Mozilla/5.0`. Cloudflare Workers may 403 an empty agent.\n\n## Call these URLs\n\n- Worker OpenAPI: https://staticclock-download-tracker.vibelock.workers.dev/openapi.json\n- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json\n- MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`\n- Live skill (this markdown): `GET https://staticclock-download-tracker.vibelock.workers.dev/v1/skill`\n\nOps (do **not** increment downloads or views):\n\n- `GET /v1/health` \u2014 liveness\n- `GET /v1/skill` \u2014 this file\n- `GET /v1/example` \u2014 sample click payload\n- `GET /v1/anchors` \u2014 Top-30 geographic anchors\n- `POST /v1/click` \u2014 append one click (send existing `clicks` if any)\n- `POST /v1/hook` \u2014 AZ-OS hook; records, does not exec\n- `POST /v1/verify` \u2014 recompute hashes\n- `POST /v1/advisory` \u2014 companion advisory for a last-known geo\n\nThere is no rollback. `POST /v1/rollback` returns 400.\n\nGrok: import OpenAPI as a custom tool. ChatGPT: GPT Actions. Venice: HTTP tools.\n\n## Example\n\n```bash\ncurl -s -A 'Mozilla/5.0' https://staticclock-download-tracker.vibelock.workers.dev/v1/health\ncurl -s -A 'Mozilla/5.0' -X POST https://staticclock-download-tracker.vibelock.workers.dev/v1/click \\\n  -H 'content-type: application/json' \\\n  -d '{\"action\":\"opened the ledger\"}'\ncurl -s -A 'Mozilla/5.0' -X POST https://staticclock-download-tracker.vibelock.workers.dev/v1/hook \\\n  -H 'content-type: application/json' \\\n  -d '{\"action\":\"invite accepted\",\"session\":\"azos-1\"}'\ncurl -s -A 'Mozilla/5.0' https://staticclock-download-tracker.vibelock.workers.dev/v1/skill\n```\n\n## Local (after one-click install)\n\n```bash\ncurl -fsSL https://staticclock-download-tracker.vibelock.workers.dev/install.sh | bash\nstaticclock ui\nstaticclock doctor\n```\n\nThen open http://127.0.0.1:8765 (loopback only). Click the gear. Optional AZ-OS hook, Import JSON, Export JSON, Verify.\n\nCounted download (gzip HTTP 200, no 302): https://staticclock-download-tracker.vibelock.workers.dev/download?asset=staticclock-0.2.0.tar.gz\nGitHub: https://github.com/AzielEliab/staticclock\n";

const OUTPUT_FIELDS = ["geo_location_chosen", "optimal_time", "optimal_date", "primary_language", "dialect_section"];
const DEFAULT_ANCHOR = "United States";
const DEFAULT_WINDOW = ["08:30", "10:30"];
const OVERRIDES = { Spain: ["09:30", "11:30"], Argentina: ["09:30", "11:30"], Egypt: ["09:00", "11:00"] };

const TOP_30 = [
  "United States","United Kingdom","Germany","France","Spain","Italy","Brazil","Mexico","Canada",
  "India","China","Japan","South Korea","Australia","New Zealand","South Africa","Nigeria","Egypt",
  "Israel","Turkey","Russia","Ukraine","Poland","Netherlands","Sweden","Norway","Finland",
  "Argentina","Chile","Saudi Arabia",
];

const US_STATES = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware","florida",
  "georgia","hawaii","idaho","illinois","indiana","iowa","kansas","kentucky","louisiana","maine",
  "maryland","massachusetts","michigan","minnesota","mississippi","missouri","montana","nebraska",
  "nevada","new hampshire","new jersey","new mexico","new york","north carolina","north dakota",
  "ohio","oklahoma","oregon","pennsylvania","rhode island","south carolina","south dakota",
  "tennessee","texas","utah","vermont","virginia","washington","west virginia","wisconsin","wyoming",
  "district of columbia","washington dc","washington d.c.","dc",
];

const ALIASES = {
  usa: "United States", us: "United States", "u.s.": "United States", "u.s.a.": "United States",
  america: "United States", "united states of america": "United States", indianapolis: "United States",
  chicago: "United States", "new york city": "United States", nyc: "United States", "los angeles": "United States",
  uk: "United Kingdom", "u.k.": "United Kingdom", britain: "United Kingdom", "great britain": "United Kingdom",
  england: "United Kingdom", scotland: "United Kingdom", wales: "United Kingdom", "northern ireland": "United Kingdom",
  gb: "United Kingdom", london: "United Kingdom", deutschland: "Germany", berlin: "Germany", paris: "France",
  madrid: "Spain", rome: "Italy", brasil: "Brazil", "sao paulo": "Brazil", "são paulo": "Brazil",
  "mexico city": "Mexico", méxico: "Mexico", toronto: "Canada", bharat: "India", hindustan: "India",
  prc: "China", "people's republic of china": "China", "peoples republic of china": "China",
  nippon: "Japan", nihon: "Japan", tokyo: "Japan", korea: "South Korea", "republic of korea": "South Korea",
  rok: "South Korea", seoul: "South Korea", sydney: "Australia", auckland: "New Zealand", aotearoa: "New Zealand",
  rsa: "South Africa", johannesburg: "South Africa", lagos: "Nigeria", cairo: "Egypt", "tel aviv": "Israel",
  jerusalem: "Israel", turkiye: "Turkey", türkiye: "Turkey", istanbul: "Turkey", moscow: "Russia",
  kyiv: "Ukraine", kiev: "Ukraine", warsaw: "Poland", holland: "Netherlands", amsterdam: "Netherlands",
  stockholm: "Sweden", oslo: "Norway", helsinki: "Finland", "buenos aires": "Argentina", santiago: "Chile",
  ksa: "Saudi Arabia", saudi: "Saudi Arabia", riyadh: "Saudi Arabia",
};
for (const s of US_STATES) ALIASES[s] = "United States";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function fold(text) {
  const nfkd = (text || "").normalize("NFKD");
  const stripped = [...nfkd].filter((ch) => !/[\u0300-\u036f]/.test(ch)).join("");
  return stripped.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function levenshtein(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => {
    const row = new Array(b.length + 1);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
    }
  }
  return m[a.length][b.length];
}

function ratio(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function closest(folded, candidates, cutoff) {
  let best = null;
  let bestR = cutoff;
  for (const c of candidates) {
    const r = ratio(folded, c);
    if (r >= bestR) {
      bestR = r;
      best = c;
    }
  }
  return best;
}

function anchorLookup() {
  const table = { ...ALIASES };
  for (const name of TOP_30) table[fold(name)] = name;
  return table;
}

function resolveGeo(geo) {
  const folded = fold(geo);
  if (!folded) return DEFAULT_ANCHOR;
  const lookup = anchorLookup();
  if (lookup[folded]) return lookup[folded];
  const candidates = Object.keys(lookup);
  const match = closest(folded, candidates, 0.72);
  if (match) return lookup[match];
  const tokens = folded.split(" ");
  if (tokens.length > 1) {
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (lookup[tokens[i]]) return lookup[tokens[i]];
    }
    const m2 = closest(tokens[tokens.length - 1], candidates, 0.8);
    if (m2) return lookup[m2];
  }
  return DEFAULT_ANCHOR;
}

async function sha256Bytes(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function shake(basket, nonce, salt) {
  if (!basket.length) throw new Error("basket must not be empty");
  const scored = [];
  const enc = new TextEncoder();
  for (const item of basket) {
    const payload = new Uint8Array(nonce.length + salt.length + enc.encode(item).length);
    payload.set(nonce, 0);
    payload.set(salt, nonce.length);
    payload.set(enc.encode(item), nonce.length + salt.length);
    const digest = await sha256Bytes(payload);
    scored.push({ item, digest: [...digest].map((b) => b.toString(16).padStart(2, "0")).join("") });
  }
  scored.sort((a, b) => (a.digest < b.digest ? -1 : a.digest > b.digest ? 1 : 0));
  return scored[0].item;
}

async function pickIndex(n, nonce, salt) {
  if (n <= 0) throw new Error("n must be positive");
  const payload = new Uint8Array(nonce.length + salt.length);
  payload.set(nonce, 0);
  payload.set(salt, nonce.length);
  const digest = await sha256Bytes(payload);
  let n64 = 0n;
  for (let i = 0; i < 8; i++) n64 = (n64 << 8n) + BigInt(digest[i]);
  return Number(n64 % BigInt(n));
}

function windowFor(region) {
  return OVERRIDES[region] || DEFAULT_WINDOW;
}

function slotsIn(window, step = 15) {
  const [sh, sm] = window[0].split(":").map(Number);
  const [eh, em] = window[1].split(":").map(Number);
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  const out = [];
  for (let m = startM; m <= endM; m += step) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

async function pickTime(region, nonce) {
  const slots = slotsIn(windowFor(region));
  return slots[await pickIndex(slots.length, nonce, new TextEncoder().encode("time"))];
}

function localDate(iana) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: iana,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function record(name) {
  return INDEX.anchors[name];
}

function dialectsFor(language) {
  return INDEX.languages[language] ? [...INDEX.languages[language]] : [];
}

function findLanguage(name) {
  if (!name) return null;
  const folded = fold(name);
  for (const lang of Object.keys(INDEX.languages)) {
    if (fold(lang) === folded) return lang;
  }
  return null;
}

async function advise(geo, languageHint, dialectHint) {
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const anchor = resolveGeo(geo);
  const basket = [...record(anchor).basket];
  const chosen = await shake(basket, nonce, new TextEncoder().encode("geo"));
  const rec = record(chosen);
  let language = rec.language;
  const hintedLang = findLanguage(languageHint);
  if (hintedLang) language = hintedLang;
  let dialect;
  const dialects = dialectsFor(language);
  if (dialectHint) {
    const folded = fold(dialectHint);
    dialect = dialects.find((d) => fold(d) === folded) || dialectHint;
  } else {
    dialect = dialects.length ? await shake(dialects, nonce, new TextEncoder().encode("dialect")) : "";
  }
  const clock = await pickTime(chosen, nonce);
  const day = localDate(String(rec.iana));
  const advisory = {
    geo_location_chosen: chosen,
    optimal_time: clock,
    optimal_date: day,
    primary_language: language,
    dialect_section: dialect,
  };
  const payload = {};
  for (const k of OUTPUT_FIELDS) payload[k] = advisory[k];
  payload.motto = MOTTO;
  payload.product = PRODUCT;
  payload.version = VERSION;
  payload.author = AUTHOR;
  payload.note = "Companion advisory. ChronoLock is the related window product. Author Aziel Eliab.";
  return payload;
}

function listAnchors() {
  return {
    product: PRODUCT,
    version: VERSION,
    motto: MOTTO,
    note: "Top-30 companion anchors. Author Aziel Eliab.",
    anchors: TOP_30.map((name) => ({
      name,
      iana: INDEX.anchors[name].iana,
      language: INDEX.anchors[name].language,
    })),
  };
}

function canonicalClickJson(click, second, action, source, prevHash) {
  return JSON.stringify({
    action,
    click,
    prev_hash: prevHash,
    second,
    source,
  });
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function utcSecond() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function createClick(n, action, source, prevHash, second) {
  const text = String(action || "").trim();
  if (!text) throw new Error("action is required");
  const src = String(source || "local").trim() || "local";
  const sec = second || utcSecond();
  const hash = await sha256Hex(canonicalClickJson(n, sec, text, src, prevHash));
  return { click: n, second: sec, action: text, source: src, prev_hash: prevHash, hash };
}

function asClicks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => ({
    click: Number(row.click),
    second: String(row.second || ""),
    action: String(row.action || ""),
    source: String(row.source || "local"),
    prev_hash: String(row.prev_hash || ""),
    hash: String(row.hash || ""),
  }));
}

async function verifyClicks(clicks) {
  const errors = [];
  for (let i = 0; i < clicks.length; i++) {
    const tick = clicks[i];
    const expected = await sha256Hex(
      canonicalClickJson(tick.click, tick.second, tick.action, tick.source, tick.prev_hash),
    );
    if (tick.hash !== expected) errors.push(`index ${i}: stored hash ${tick.hash} != recomputed ${expected}`);
    if (tick.click !== i + 1) errors.push(`index ${i}: click ${tick.click} != ${i + 1}`);
    if (i === 0) {
      if (tick.prev_hash !== GENESIS_PREV_HASH) errors.push("index 0: prev_hash != genesis zeros");
    } else if (tick.prev_hash !== clicks[i - 1].hash) {
      errors.push(`index ${i}: prev_hash != previous.hash`);
    }
  }
  return {
    ok: errors.length === 0,
    length: clicks.length,
    first_hash: clicks.length ? clicks[0].hash : null,
    last_hash: clicks.length ? clicks[clicks.length - 1].hash : null,
    errors,
  };
}

async function appendClick(existing, action, source, second) {
  const clicks = asClicks(existing);
  const prev = clicks.length ? clicks[clicks.length - 1].hash : GENESIS_PREV_HASH;
  const tick = await createClick(clicks.length + 1, action, source, prev, second);
  const next = clicks.concat([tick]);
  return { click: tick, clicks: next, verify: await verifyClicks(next) };
}

function hookStatus(clicks) {
  const n = clicks.length;
  return {
    ok: true,
    hook: "azos",
    product: PRODUCT,
    author: AUTHOR,
    principle: "Integrity precedes execution.",
    exec: false,
    remote_shell: false,
    rollbacks: false,
    clicks: n,
    last_hash: n ? clicks[n - 1].hash : null,
    note: "Records actions into the StaticClock timeline. Does not exec.",
  };
}

function openapiSpec() {
  const obj = { type: "object" };
  return {
    openapi: "3.1.0",
    info: {
      title: "StaticClock runtime",
      version: VERSION,
      description: "Action-based immutable timeline. No rollbacks. AZ-OS hook. " + MOTTO,
    },
    servers: [{ url: HOST }],
    paths: {
      "/v1/skill": {
        get: {
          operationId: "staticclock_skill",
          summary: "Return skill markdown. Does not increment download KV.",
          responses: { "200": { description: "markdown" } },
        },
      },
      "/v1/health": {
        get: { operationId: "health", summary: "Liveness", responses: { "200": { description: "ok", content: { "application/json": { schema: obj } } } } },
      },
      "/v1/example": {
        get: { operationId: "example", summary: "Sample click payload. Does not increment download KV.", responses: { "200": { description: "example", content: { "application/json": { schema: obj } } } } },
      },
      "/v1/anchors": {
        get: { operationId: "anchors", summary: "List Top-30 geographic anchors.", responses: { "200": { description: "anchors", content: { "application/json": { schema: obj } } } } },
      },
      "/v1/click": {
        post: {
          operationId: "click",
          summary: "Append one immutable gear click. Send existing clicks to continue a chain.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["action"], properties: { action: { type: "string" }, source: { type: "string" }, second: { type: "string" }, clicks: { type: "array" } } } } } },
          responses: { "200": { description: "click", content: { "application/json": { schema: obj } } } },
        },
      },
      "/v1/hook": {
        post: {
          operationId: "hook",
          summary: "AZ-OS hook. Records a principle-bound action. Does not exec.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["action"], properties: { action: { type: "string" }, session: { type: "string" }, principle: { type: "string" }, second: { type: "string" }, clicks: { type: "array" } } } } } },
          responses: { "200": { description: "hook click", content: { "application/json": { schema: obj } } } },
        },
      },
      "/v1/verify": {
        post: {
          operationId: "verify",
          summary: "Recompute hashes. Anyone can verify. No rollback.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { clicks: { type: "array" } } } } } },
          responses: { "200": { description: "verify", content: { "application/json": { schema: obj } } } },
        },
      },
      "/v1/advisory": {
        post: {
          operationId: "advisory",
          summary: "Companion advisory for a last-known geo. Optional language/dialect hints.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["geo"],
                  properties: {
                    geo: { type: "string" },
                    language: { type: "string" },
                    dialect: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "companion advisory", content: { "application/json": { schema: obj } } } },
        },
      },
    },
  };
}

function aiHtml() {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>StaticClock — use with Grok, ChatGPT, Venice</title>
<style>
  :root { color-scheme: dark; }
  body { font: 16px/1.45 system-ui, sans-serif; max-width: 42rem; margin: 3rem auto; padding: 0 1.25rem; background: #0e1014; color: #e8eaef; }
  code { background: #151922; padding: .15rem .4rem; border-radius: 4px; }
  a { color: #c9d4ff; }
  .motto { color: #9aa3b2; font-style: italic; }
</style>
<body>
  <h1>StaticClock live API</h1>
  <p class="motto">${MOTTO}</p>
  <p>Action-based immutable timeline. No rollbacks. AZ-OS hook. Author Aziel Eliab.</p>
  <h2>ChatGPT (GPT Actions)</h2>
  <p>Paste this OpenAPI URL into GPT Actions:</p>
  <p><code>${HOST}/openapi.json</code></p>
  <h2>Grok / xAI</h2>
  <p>Custom tool pointing at <code>POST ${HOST}/v1/click</code>, <code>POST ${HOST}/v1/hook</code>, and <code>POST ${HOST}/v1/verify</code>.</p>
  <h2>Venice</h2>
  <p>Custom HTTP tool from the same OpenAPI URL.</p>
  <h2>MCP catalog</h2>
  <p>The shared catalog (ships separately) is <code>https://aziel-runtime.vibelock.workers.dev/mcp</code>.</p>
  <p><a href="/openapi.json">openapi.json</a> · <a href="/v1/health">health</a> · <a href="/">downloads</a></p>
</body>
</html>`;
}

export async function handleRuntimeApi(request, url) {
  const path = url.pathname;
  const isApi = path === "/v1" || path.startsWith("/v1/") || path === "/openapi.json" || path === "/ai";
  if (!isApi) return null;
  if (path === "/v1/health" && request.method === "GET") {
    return json({
      ok: true,
      product: PRODUCT,
      version: VERSION,
      author: AUTHOR,
      motto: MOTTO,
      identity: "action-based immutable timeline",
      rollbacks: false,
      azos_hook: true,
    });
  }
  if (path === "/v1/skill" && request.method === "GET") {
    return new Response(SKILL, {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "private, no-store", ...corsHeaders() },
    });
  }
  if (path === "/v1/example" && request.method === "GET") {
    const sample = await appendClick([], "opened the ledger", "local", "2026-09-04T12:00:00Z");
    return json({
      product: PRODUCT,
      version: VERSION,
      author: AUTHOR,
      motto: MOTTO,
      clicks: sample.clicks,
      note: "Sample genesis click. Hosted API is stateless. Author Aziel Eliab.",
    });
  }
  if (path === "/openapi.json" && request.method === "GET") return json(openapiSpec());
  if (path === "/ai" && request.method === "GET") {
    return new Response(aiHtml(), { headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() } });
  }
  if (path === "/v1/anchors" && request.method === "GET") return json(listAnchors());
  if ((path === "/v1/rollback" || path === "/v1/rewind") && request.method === "POST") {
    return json({ error: "the gear does not rewind", rollbacks: false, author: AUTHOR }, 400);
  }
  if (path === "/v1/click" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON body required" }, 400); }
    const action = body && body.action != null ? String(body.action) : "";
    if (!action.trim()) return json({ error: "action is required" }, 400);
    try {
      const out = await appendClick(body.clicks, action, body.source || "local", body.second);
      return json({ product: PRODUCT, version: VERSION, author: AUTHOR, motto: MOTTO, ...out });
    } catch (err) {
      return json({ error: String(err.message || err) }, 400);
    }
  }
  if (path === "/v1/hook" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON body required" }, 400); }
    let action = body && body.action != null ? String(body.action).trim() : "";
    if (!action) return json({ error: "action is required" }, 400);
    const session = body && body.session ? String(body.session).trim() : "";
    const principle = body && body.principle ? String(body.principle).trim() : "";
    if (session) action = `${action} [session:${session}]`;
    if (principle && principle !== "Integrity precedes execution.") action = `${action} [principle:${principle}]`;
    try {
      const out = await appendClick(body.clicks, action, "azos", body.second);
      return json({
        product: PRODUCT,
        version: VERSION,
        author: AUTHOR,
        motto: MOTTO,
        ...out,
        hook: hookStatus(out.clicks),
      });
    } catch (err) {
      return json({ error: String(err.message || err) }, 400);
    }
  }
  if (path === "/v1/verify" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON body required" }, 400); }
    const result = await verifyClicks(asClicks(body && body.clicks));
    return json({ product: PRODUCT, version: VERSION, author: AUTHOR, ...result });
  }
  if (path === "/v1/advisory" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON body required" }, 400); }
    const geo = body && body.geo != null ? String(body.geo) : "";
    if (!geo.trim()) return json({ error: "geo is required" }, 400);
    const advisory = await advise(geo, body.language, body.dialect);
    return json(advisory);
  }
  return json({ error: "not found" }, 404);
}
