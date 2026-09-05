/**
 * StaticClock Worker homepage — complete human software surface.
 * Author: Aziel Eliab only. Apache-2.0. No invented DOI.
 */

export const HOST = "https://staticclock-download-tracker.vibelock.workers.dev";
export const GITHUB_REPO = "https://github.com/AzielEliab/staticclock";
export const CATALOG = "https://aziel-runtime.vibelock.workers.dev/";
export const PAGE_TITLE = "StaticClock — Aziel Eliab";
export const SEO_DESCRIPTION =
  "Action-based immutable timeline by Aziel Eliab. Every action is a gear click that locks forward. Companion advisory for a last-known geo. Not a scheduler, rollback clock, or ChronoLock.";

export const CITE = {
  author: "Aziel Eliab",
  title: "StaticClock",
  one_line: SEO_DESCRIPTION,
  github: GITHUB_REPO,
  download: HOST + "/download",
  doi: null,
  license: "Apache-2.0",
  catalog: CATALOG,
};

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function jsonLdDocument() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StaticClock",
    softwareVersion: "0.2.0",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cloudflare Workers",
    author: { "@type": "Person", name: "Aziel Eliab", url: "https://github.com/AzielEliab" },
    codeRepository: GITHUB_REPO,
    downloadUrl: HOST + "/download",
    license: "https://www.apache.org/licenses/LICENSE-2.0",
    url: HOST + "/",
    description: SEO_DESCRIPTION,
  };
}

function breakdownList(breakdown) {
  if (!Array.isArray(breakdown) || !breakdown.length) return "<li>none yet</li>";
  return breakdown
    .map((b) => {
      const owner = escapeHtml(b.owner);
      const repo = escapeHtml(b.repo);
      const branch = escapeHtml(b.branch);
      const fork = escapeHtml(b.fork);
      const count = escapeHtml(b.count);
      return `<li><code>${owner}/${repo}</code> branch <code>${branch}</code> fork=${fork} → ${count}</li>`;
    })
    .join("");
}

export function renderHomepage({ views, downloads, breakdown, github, asset }) {
  const v = Number(views || 0).toLocaleString("en-US");
  const n = Number(downloads || 0).toLocaleString("en-US");
  const gh = github || {};
  const ld = JSON.stringify(jsonLdDocument());
  const rows = breakdownList(breakdown);
  const assetName = escapeHtml(asset || "staticclock-0.2.0.tar.gz");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${PAGE_TITLE}</title>
<meta name="description" content="${escapeHtml(SEO_DESCRIPTION)}">
<meta name="author" content="Aziel Eliab">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${HOST}/">
<link rel="icon" href="/sigil.png" type="image/png">
<link rel="sitemap" type="application/xml" href="${HOST}/sitemap.xml">
<link rel="alternate" href="/cite.json" type="application/json" title="Citation">
<link rel="alternate" href="/openapi.json" type="application/json" title="OpenAPI">
<meta property="og:type" content="website">
<meta property="og:title" content="${PAGE_TITLE}">
<meta property="og:description" content="${escapeHtml(SEO_DESCRIPTION)}">
<meta property="og:url" content="${HOST}/">
<meta property="og:site_name" content="Aziel Eliab">
<meta property="og:image" content="${HOST}/sigil.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${PAGE_TITLE}">
<meta name="twitter:description" content="${escapeHtml(SEO_DESCRIPTION)}">
<script type="application/ld+json">${ld}</script>
<link rel="stylesheet" href="/product.css">
</head>
<body>
  <header class="top">
    <div class="brandrow">
      <img class="brandmark" src="/sigil.png" width="40" height="40" alt="Everblooming sigil — Aziel Eliab" decoding="async">
      <div>
        <p class="stamp">Everblooming sigil · Aziel Eliab</p>
        <p class="tag">v0.2.0 · hosted workspace · AZ-OS hook · Apache-2.0</p>
      </div>
      <p class="health" id="health-pill" aria-live="polite">checking API…</p>
    </div>
    <h1>StaticClock</h1>
    <p class="byline">Aziel Eliab only</p>
    <p class="motto">Every action is a gear click. Time only locks forward.</p>
  </header>

  <p class="banner" role="note">THIS IS: an action-based immutable timeline — every action is a gear click or second that locks forward. AZ-OS hook records; it does not exec. Companion advisory names five fields for a last-known geo. THIS IS NOT: a rollback clock, a remote shell, a scheduler, or ChronoLock. Related: ChronoLock (advisory window). Distinct from TemporalLock (observation receipts). Hosted <code>/v1</code> is stateless and does not store a chain. Author Aziel Eliab only.</p>

  <section class="card install" id="install">
    <div class="nums">
      <p class="count">${v}<span>Views</span></p>
      <p class="count">${n}<span>Downloads</span></p>
    </div>
    <p class="kid"><strong>Counted download.</strong> Download saves the gzip (the Downloads number goes up). One-click install copies a Terminal command. After it finishes, type <code>staticclock ui</code>.</p>
    <div class="btns">
      <a class="btn primary dl" href="/download?asset=${assetName}">Download</a>
      <button type="button" class="btn install" id="install-btn">One-click install</button>
    </div>
    <pre id="install-cmd">curl -fsSL ${HOST}/install.sh | bash</pre>
    <p class="kid">Then run: <code>staticclock ui</code> and open http://127.0.0.1:8765 (this computer only). Click the gear. Optional AZ-OS hook.</p>
    <p class="meta">The download count ticks on the Download click. The Worker serves the gzip (HTTP 200). No 302 to GitHub. Forks using this same link are counted automatically. ${assetName} — ${n} counted.</p>
    <p class="iso">Isolated counter: Worker <code>staticclock-download-tracker</code>, project <code>staticclock</code>, KV <code>STATICCLOCK_DOWNLOADS</code>. Not mixed with any other product. <code>/v1</code> does not increment downloads or views.</p>
    <p class="meta">GitHub: stars ${escapeHtml(gh.stars || 0)} · forks ${escapeHtml(gh.forks || 0)} · watchers ${escapeHtml(gh.watchers || 0)} · release assets ${escapeHtml(gh.release_download_count || 0)}</p>
    <p class="meta"><a href="${GITHUB_REPO}">GitHub</a> · <a href="${GITHUB_REPO}/releases/latest">releases</a> · <a href="/stats">JSON stats</a> · <a href="/openapi.json">OpenAPI</a> · <a href="/v1/skill">Skill</a> · <a href="/ai">AI runtime</a> · <a href="${CATALOG}">Catalog</a></p>
    <h2>Per repo / branch / fork</h2>
    <ul class="breakdown">${rows}</ul>
  </section>

  <section class="card workspace" id="workspace">
    <div class="workhead">
      <h2>Workspace</h2>
      <p class="note">Live ops against this Worker’s <code>/v1</code> API. The chain stays in this browser. Hosted API does not store clicks.</p>
    </div>
    <div class="gear-head">
      <p class="count" id="click-count">0<span>clicks</span></p>
      <p class="note" id="verify-note">empty gear</p>
      <p class="note" id="timeslate-note">timeslate: —</p>
    </div>

    <form id="click-form" autocomplete="off">
      <label for="action"><span class="kicker">Action</span> One click. One second. It will not rewind.</label>
      <div class="inline">
        <input id="action" name="action" type="text" placeholder="opened the ledger" spellcheck="false">
        <button class="btn gold" type="submit" id="go-click">Click the gear</button>
      </div>
    </form>

    <form id="hook-form" autocomplete="off">
      <label for="hook-action"><span class="kicker">AZ-OS hook</span> Records into the timeline. Does not exec. Does not open a shell.</label>
      <div class="inline">
        <input id="hook-action" name="hook-action" type="text" placeholder="invite accepted" spellcheck="false">
        <input id="hook-session" name="hook-session" type="text" placeholder="session: azos-1" spellcheck="false">
        <button class="btn gold" type="submit" id="go-hook">Record via AZ-OS</button>
      </div>
    </form>

    <div class="ops" role="group" aria-label="Timeline ops">
      <button type="button" id="verify-btn">Verify</button>
      <button type="button" id="timeslate-btn">Timeslate</button>
      <button type="button" id="example-btn">Load sample</button>
      <button type="button" id="health-btn">Health</button>
      <label class="file">Import JSON <input type="file" id="import-json" accept="application/json,.json"></label>
      <button type="button" id="export-json">Export JSON</button>
    </div>

    <section class="output" aria-live="polite">
      <h3>Timeline</h3>
      <ol class="ticks" id="ticks"></ol>
      <p class="note">Append-only. A later click may mention an earlier hash. The old click stays. There is no rollback.</p>
    </section>

    <form id="advise-form" autocomplete="off">
      <h3>Companion advisory</h3>
      <p class="note">Five fields for a last-known geo. Not a scheduler. Hosted <code>/v1/advisory</code> does not click the gear and does not store a chain. Local <code>staticclock ui</code> also clicks the gear.</p>
      <label for="geo"><span class="kicker">Last-known geo</span> Free text (city, region, country). Not an identity.</label>
      <input id="geo" name="geo" type="text" placeholder="Indiana" spellcheck="false">
      <p class="or">or</p>
      <label for="anchor"><span class="kicker">Top-30 country</span> Anchor dropdown. Polarize a five-region basket from this.</label>
      <div class="inline">
        <select id="anchor" name="anchor">
          <option value="">— choose an anchor —</option>
        </select>
        <button class="btn gold" type="submit" id="go">Advise</button>
      </div>
    </form>

    <section class="output" aria-live="polite">
      <h3>Advisory result</h3>
      <dl class="fields">
        <dt>geo location chosen</dt>
        <dd id="out-geo" class="empty">—</dd>
        <dt>optimal time</dt>
        <dd id="out-time" class="empty">—</dd>
        <dt>optimal date</dt>
        <dd id="out-date" class="empty">—</dd>
        <dt>primary language</dt>
        <dd id="out-lang" class="empty">—</dd>
        <dt>dialect section</dt>
        <dd id="out-dialect" class="empty">—</dd>
      </dl>
    </section>

    <section class="output last">
      <h3>Last API result</h3>
      <p class="note" id="last-op">No op yet. Click the gear, record a hook, advise a geo, or run Health.</p>
      <pre id="last-json" hidden></pre>
    </section>
  </section>

  <section class="cite" id="cite">
    <h2>How to cite</h2>
    <p>Aziel Eliab. StaticClock. ${GITHUB_REPO}. ${HOST}.</p>
    <p>Apache-2.0. No DOI on this record. Do not invent a Zenodo identifier.</p>
    <p><a href="${CATALOG}">Catalog</a> · <a href="${GITHUB_REPO}">GitHub</a> · <a href="${HOST}/download">Download</a> · <a href="${HOST}/cite.json">cite.json</a></p>
  </section>

  <footer>
    <p><strong>Every action is a gear click. Time only locks forward.</strong></p>
    <p>Apache-2.0 · Aziel Eliab only · 2026 · Forks welcome and always allowed.</p>
  </footer>
  <script src="/product.js"></script>
</body>
</html>`;
}
