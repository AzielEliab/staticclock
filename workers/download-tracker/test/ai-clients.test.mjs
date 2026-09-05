import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const runtimeSrc = readFileSync(join(here, "../src/runtime.js"), "utf8");

const CLIENTS = [
  "ChatGPT (GPT Actions / OpenAI)",
  "Grok (xAI)",
  "Venice",
  "Claude (Anthropic)",
  "Cursor (MCP)",
  "Glama (MCP)",
  "Perplexity",
  "Microsoft Copilot / Bing",
  "Google Gemini / Vertex",
  "Mistral",
  "Meta AI",
  "Apple Intelligence surfaces",
  "Amazon Q tooling",
  "DuckAssist",
  "You.com",
  "Cohere",
];

function assertFullList(text, label) {
  const compact = String(text).replace(/\s+/g, " ");
  for (const name of CLIENTS) {
    assert.match(
      compact,
      new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `${label} missing ${name}`,
    );
  }
  assert.doesNotMatch(text, /Use with Grok, ChatGPT, Venice/);
  assert.doesNotMatch(text, /Use with Grok \/ ChatGPT \/ Venice/);
  assert.doesNotMatch(text, /use with Grok, ChatGPT, Venice/);
}

test("README lists the full AI assistant set", () => {
  const md = readFileSync(join(root, "README.md"), "utf8");
  assert.match(md, /## Use with AI assistants/);
  assertFullList(md, "README");
});

test("SKILL.md lists the full AI assistant set", () => {
  const md = readFileSync(join(root, "SKILL.md"), "utf8");
  assert.match(md, /## Use with AI assistants/);
  assertFullList(md, "SKILL.md");
});

test("Worker skill + /ai copy lists the full AI assistant set", () => {
  assert.match(runtimeSrc, /<title>StaticClock — use with AI assistants<\/title>/);
  assert.match(runtimeSrc, /## Use with AI assistants/);
  assertFullList(runtimeSrc, "runtime.js");
  const disk = readFileSync(join(root, "SKILL.md"), "utf8");
  const match = runtimeSrc.match(/const SKILL = "((?:\\.|[^"\\])*)"/);
  assert.ok(match, "SKILL constant present");
  const embedded = JSON.parse(`"${match[1]}"`);
  assert.equal(embedded, disk);
});
