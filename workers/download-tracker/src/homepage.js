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
  <a class="skip" href="#main">Skip to content</a>
  <div class="wrap">
  <main id="main">
  <header class="hero">
    <div class="hero-grid">
      <div>
        <div class="brandrow">
          <img class="brandmark" src="/sigil.png" width="40" height="40" alt="" decoding="async">
          <p class="stamp">Aziel Eliab</p>
          <p class="health" id="health-pill" aria-live="polite">checking API…</p>
        </div>
        <h1>StaticClock</h1>
        <p class="motto">Every action is a gear click. Time only locks forward.</p>
        <p class="lede">v0.2.0 hosted workspace by Aziel Eliab. Click the gear on this page, or install the package on this computer. Apache-2.0.</p>
        <div class="hero-actions">
          <a id="download" class="btn primary dl" href="/download?asset=${assetName}" aria-describedby="os-line download-note">Download</a>
          <button type="button" class="btn install" id="install-btn">One-click install</button>
        </div>
        <p class="os" id="os-line">One Python package for macOS, Linux, and Windows. Phone app sources stay in the repository.</p>
        <p class="asset-note" id="download-note"><code>${assetName}</code> · counted on this Worker for every branch and fork</p>
        <pre id="install-cmd">curl -fsSL ${HOST}/install.sh | bash</pre>
        <p class="kid">Then run <code>staticclock ui</code> and open http://127.0.0.1:8765 on this computer. Click the gear.</p>
      </div>
      <figure class="markplate">
        <div class="stage-top">
          <img src="/sigil.png" width="28" height="28" alt="" decoding="async">
          <span>On this page</span>
        </div>
        <ol>
          <li><b>1</b><span>Type an action and click the gear.</span></li>
          <li><b>2</b><span>The chain stays in this browser.</span></li>
          <li><b>3</b><span>Verify checks the hashes. Export saves JSON.</span></li>
        </ol>
        <figcaption>Hosted preview. After Download, <code>staticclock ui</code> listens on 127.0.0.1:8765.</figcaption>
      </figure>
    </div>
    <nav class="toc" aria-label="Product">
      <a href="#workspace">Workspace</a>
      <a href="#features">Features</a>
      <a href="#meshStrip">Live Nodes</a>
      <a href="#install">Downloads</a>
      <a href="#cite">Cite</a>
      <a href="${GITHUB_REPO}">GitHub</a>
    </nav>
  </header>

  <p class="banner" role="note">THIS IS: an action-based immutable timeline — every action is a gear click or second that locks forward. AZ-OS hook records; it does not exec. Companion advisory names five fields for a last-known geo. THIS IS NOT: a rollback clock, a remote shell, a scheduler, or ChronoLock. Related: ChronoLock (advisory window). Distinct from TemporalLock (observation receipts). Hosted <code>/v1</code> is stateless and does not store a chain. Author Aziel Eliab only.</p>

  <section class="block" id="features">
    <h2>What you can do</h2>
    <ul class="features">
      <li>
        <h3>Gear click</h3>
        <p>One action locks one UTC second forward. A later click may name an earlier hash. The old click stays.</p>
      </li>
      <li>
        <h3>AZ-OS hook</h3>
        <p>Records a principle-bound action into the timeline. It does not run the action and it does not open a shell.</p>
      </li>
      <li>
        <h3>Companion advisory</h3>
        <p>Names a last-known geo, a local time, a date, a language, and a dialect.</p>
      </li>
      <li>
        <h3>Timeslate</h3>
        <p>Each click has a cross-hash you can hand to TemporalLock. StaticClock does not store TemporalLock receipts.</p>
      </li>
    </ul>
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

  <div id="meshStrip" aria-label="Suite Live Nodes">
    <div class="live"><b id="meshLiveCount">0</b> Live Nodes</div>
    <div id="meshLine">Suite mesh: off (default). QNM-BUILD-1.0. QNS-CD-1.0. Not an anonymity network.</div>
    <div class="rollup">live <b id="qnmLive">0</b> · locked <b id="qnmLocked">0</b> · isolated <b id="qnmIsolated">0</b></div>
    <div>No Node Gate · No public qnsd proxy · QNS-CD-1.0 cite · No auto-heal · Plain category (not Lock) · Aziel Eliab only</div>
    <div class="mesh-actions">
      <input id="meshBearer" type="text" maxlength="80" placeholder="bearer (required to enable)" aria-label="mesh bearer">
      <button id="meshEnable" type="button" title="Enable suite mesh. Declared bearer required. Default off.">Enable</button>
      <button id="meshDisable" type="button" title="Disable suite mesh (always allowed)">Disable</button>
      <button id="meshJoin" type="button" title="Join as staticclock. Refused while mesh is OFF. No auto-join.">Join</button>
      <button id="meshLeave" type="button" title="Leave this node. No auto-heal.">Leave</button>
    </div>
    <p id="meshProducts">Catalog MCP mesh_* · FragGate slug=mesh · /v1/mesh/* PROXY · QNS-CD-1.0 cross-map · not AnonBroadcast · not AZMail ring · not a Node Gate · no public qnsd proxy · Plain (not Lock)</p>
  </div>

  <section class="card install" id="install">
    <h2>Counted downloads</h2>
    <p class="quiet-counts"><span><b>${v}</b> views</span><span><b>${n}</b> downloads</span></p>
    <p class="meta">The download count ticks on the Download click. The Worker serves the gzip (HTTP 200). No 302 to GitHub. Forks using this same link are counted automatically. ${assetName} — ${n} counted.</p>
    <p class="iso">Isolated counter: Worker <code>staticclock-download-tracker</code>, project <code>staticclock</code>, KV <code>STATICCLOCK_DOWNLOADS</code>. Not mixed with any other product. <code>/v1</code> does not increment downloads or views.</p>
    <p class="meta">GitHub: stars ${escapeHtml(gh.stars || 0)} · forks ${escapeHtml(gh.forks || 0)} · watchers ${escapeHtml(gh.watchers || 0)} · release assets ${escapeHtml(gh.release_download_count || 0)}</p>
    <h3>Per repo / branch / fork</h3>
    <ul class="breakdown">${rows}</ul>
  </section>

  <section class="cite" id="cite">
    <h2>How to cite</h2>
    <p>Aziel Eliab. StaticClock. ${GITHUB_REPO}. ${HOST}.</p>
    <p>Apache-2.0. No DOI on this record. Do not invent a Zenodo identifier.</p>
    <p><a href="${CATALOG}">Catalog</a> · <a href="${GITHUB_REPO}">GitHub</a> · <a href="${HOST}/download">Download</a> · <a href="${HOST}/cite.json">cite.json</a></p>
  </section>
  </main>

  <footer>
    <p>Every action is a gear click. Time only locks forward.</p>
    <p>Apache-2.0 · Aziel Eliab only · 2026 · Forks welcome and always allowed.</p>
    <p><a href="${GITHUB_REPO}">GitHub</a> · <a href="${GITHUB_REPO}/releases/latest">Releases</a> · <a href="/stats">JSON stats</a> · <a href="/openapi.json">OpenAPI</a> · <a href="/v1/mesh">/v1/mesh</a> · <a href="/v1/skill">Skill</a> · <a href="/ai">AI runtime</a> · <a href="${CATALOG}">Catalog</a></p>
  </footer>
  </div>
  <script src="/product.js"></script>
</body>
</html>`;
}
