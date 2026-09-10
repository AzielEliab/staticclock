import assert from "node:assert/strict";
import test from "node:test";
import { CITE, PAGE_TITLE, SEO_DESCRIPTION, jsonLdDocument, renderHomepage } from "../src/homepage.js";

test("title is StaticClock — Aziel Eliab", () => {
  assert.equal(PAGE_TITLE, "StaticClock — Aziel Eliab");
  const html = renderHomepage({ views: 1, downloads: 2, breakdown: [], github: {}, asset: "staticclock-0.2.0.tar.gz" });
  assert.match(html, /<title>StaticClock — Aziel Eliab<\/title>/);
});

test("SEO, cite, and JSON-LD name Aziel Eliab only and invent no DOI", () => {
  assert.match(SEO_DESCRIPTION, /Aziel Eliab/);
  assert.equal(CITE.author, "Aziel Eliab");
  assert.equal(CITE.doi, null);
  assert.equal(CITE.license, "Apache-2.0");
  const ld = jsonLdDocument();
  assert.equal(ld["@type"], "SoftwareApplication");
  assert.equal(ld.author.name, "Aziel Eliab");
  assert.equal("identifier" in ld, false);
  const html = renderHomepage({ views: 0, downloads: 0, breakdown: [], github: {} });
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /10\.5281/);
  assert.doesNotMatch(html, /doi\.org/);
  assert.match(html, /Do not invent a Zenodo identifier/);
  assert.match(html, /Everblooming sigil/);
  assert.match(html, /Forks welcome/);
});

test("homepage keeps download, install, workspace, and honest banners", () => {
  const html = renderHomepage({
    views: 44,
    downloads: 27,
    breakdown: [{ owner: "AzielEliab", repo: "staticclock", branch: "main", fork: "0", count: 27 }],
    github: { stars: 1, forks: 0, watchers: 1, release_download_count: 0 },
    asset: "staticclock-0.2.0.tar.gz",
  });
  assert.match(html, /id="workspace"/);
  assert.match(html, /href="\/download\?asset=staticclock-0\.2\.0\.tar\.gz"/);
  assert.match(html, /id="install-btn"/);
  assert.match(html, /id="click-form"/);
  assert.match(html, /id="advise-form"/);
  assert.match(html, /THIS IS:/);
  assert.match(html, /THIS IS NOT:/);
  assert.match(html, /does not store a chain/);
  assert.match(html, /AzielEliab\/staticclock/);
  assert.match(html, /id="meshStrip"/);
  assert.match(html, /Live Nodes/);
  assert.match(html, /QNM-BUILD-1.0/);
  assert.match(html, /QNS-CD-1.0/);
  assert.match(html, /No Node Gate/);
  assert.match(html, /No public qnsd proxy/);
  assert.match(html, /Plain category \(not Lock\)/);
  assert.match(html, /href="\/v1\/mesh"/);
  assert.doesNotMatch(html, /id="node-gate"/);
});
