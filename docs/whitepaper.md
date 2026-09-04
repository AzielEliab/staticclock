# THE STATICCLOCK

**An Action-Based Immutable Timeline**

Aziel Eliab
2026
License: Apache-2.0

> Every action is a gear click. Time only locks forward.

---

## Abstract (v0.2)

StaticClock is an action-based immutable timeline. Every action is a
gear click — a second that locks forward. There are no rollbacks. The
AZ-OS hook records principle-bound actions into this gear. It does not
execute a remote shell.

The question it answers is:

**What happened, in order, as actions that cannot rewind?**

A companion chrono-linguistic advisory (sections 1–13) remains in this
tree. ChronoLock is the related public advisory-window product.
TemporalLock is observation receipts. This document specifies
StaticClock as implemented by the `staticclock` Python package, version
0.2.0. Author: Aziel Eliab. Forks are welcome and always allowed.

---

## Abstract (v0.1, historical)

StaticClock began as a software-only advisory system. Given a last-known
geography, it names a least-distorting, most analytically stable
*release window* for information — a place, a local clock time, a local
date, a primary language, and a dialectal register. Closed internal
logic produces one advisory for one moment; `forget()` drops the nonce
and inputs. That companion still exists. It is no longer the product
identity.

---

## 1. Purpose

Information is not received in a vacuum. It lands in a timezone, a
language, and a dialect. Those three facts change how a sentence is
held: as something to think with, or as something to react to.

Most “best time to post” systems optimize the second outcome. They
search for peaks of attention. StaticClock refuses that search. It
advises a window in which attention is more likely to be *analytical* —
early enough in a local working morning that the reader still has the
day, late enough that the day has started — and a linguistic register
that does not yank the text into a more distorting vernacular than it
needs.

The purpose is advisory hygiene, not strategy.

---

## 2. What this is not

StaticClock is not:

- a scheduler
- a targeting system
- an analytics product
- a user-profile tool
- a reach / virality / engagement optimizer
- a translator
- a model that learns from outcomes

It does not queue messages, pick audiences, score posts, or remember
what it said yesterday. A fork that adds those things has left this
spec.

---

## 3. Design constraints

The implementation enforces these in code.

1. **No memory persistence.** Session state is in-memory. `forget()`
   drops nonce and inputs. There is no sqlite store, no `.staticclock`
   directory of past advisories.
2. **No user identification.** Last-known geo is a free-text string, not
   a profile, cookie, or account.
3. **No behavioral learning.** The shake is a one-shot nonce, not a
   fitted weight. Outcomes are not fed back.
4. **No explanation in the user-facing report.** The report has no
   scores, no confidence, no alternatives, no “because”. Tests may
   inspect internals. CLI and JSON may not.
5. **No record after forget.** Inputs and nonce are gone. The caller
   holds the Advisory snapshot; the engine does not.

---

## 4. Geographic input

Input is **last-known geo** (free text) *or* an anchor chosen from the
Top 30 countries:

United States, United Kingdom, Germany, France, Spain, Italy, Brazil,
Mexico, Canada, India, China, Japan, South Korea, Australia, New
Zealand, South Africa, Nigeria, Egypt, Israel, Turkey, Russia, Ukraine,
Poland, Netherlands, Sweden, Norway, Finland, Argentina, Chile, Saudi
Arabia.

Unknown or partial strings (for example `Indiana`) map to the nearest
anchor by alias or fuzzy match. Mapping never crashes. Empty or
unrecognizable input defaults to United States. Resolution is a function
of the string, not of a person.

---

## 5. Polarize

From the resolved anchor, StaticClock polarizes **five**
geographically or culturally adjacent regions into a basket (the anchor
and four neighbors, recorded in the static index). It **shakes** the
basket with a one-shot session nonce (`secrets.token_bytes`) and picks
one.

The nonce is not a user id. The shake is not an engagement optimizer.
The output field is **Geo Location Chosen**.

---

## 6. Chronolect

Prefer the local analytical window **08:30–10:30** unless a regional
norm overrides. v0.1 documents three overrides; all other anchors use
the default:

| Region | Window | Note |
|--------|--------|------|
| Spain | 09:30–11:30 | later Mediterranean morning |
| Argentina | 09:30–11:30 | Rioplatense later cultural start |
| Egypt | 09:00–11:00 | later administrative morning |

A clock time is picked inside the window (for example 09:15). The pick
is nonce-derived so a pinned nonce is deterministic. This is not a
scheduler: it names a time, it does not fire a job.

---

## 7. Glossa

Region maps to a primary language from a **static bundled index**
(`staticclock/data/index.json`). v0.1 is not a 100+ language product.
It covers the Top-30 anchors and a few dialects each. A full 100+ index
is a replacement update of that JSON, not a runtime fetch and not a
learned model.

---

## 8. Dialect section

Each language in the index carries **five** dialectal variants. One is
picked with the same basket-randomization as geography (same nonce,
different salt). Among the options, where relevant:

- English includes **UK Midlands** and **Northern Neutral**
- Spanish includes **Rioplatense Neutral**

The user-facing field is `dialect_section`. It is a name, not a score.

---

## 9. Timezone reference

`list_timezones()` returns IANA zones for the Top-30 anchors with
*computed* current local times, using `zoneinfo` and the host tz
database. No network.

CLI `staticclock zones` is read-only. Listing zones does not mint a
nonce and does not change an advisory. The local UI shows the same
table as a read-only panel.

---

## 10. User-facing output

Exactly these fields, and no others:

- `geo_location_chosen`
- `optimal_time` (local to the chosen region, inside the analytical window)
- `optimal_date` (local date)
- `primary_language`
- `dialect_section`

No scores, no confidence, no alternatives, no reasoning dump.

---

## 11. Session, nonce, forget

A `StaticClock` session draws a nonce from `secrets.token_bytes` unless
a test hook pins one. `advise(geo)` produces one `Advisory`. `forget()`
drops nonce and last inputs. A context manager forgets on exit.

One advisory output for one moment, then forget. Closed internal logic:
the caller is not shown the basket, the hash, or the window arithmetic.

---

## 12. Interface

Library: `staticclock.engine.StaticClock.advise(geo: str) -> Advisory`.

CLI:

```
staticclock version
staticclock anchors
staticclock advise --geo "United States"
staticclock advise --geo "Indiana"
staticclock zones
staticclock ui
staticclock serve
```

`advise` prints the five fields only (plain text or JSON `--json`).

UI (`staticclock ui` / `serve`): last-known-geo input, Top-30 country
dropdown, the five output fields, and a read-only timezone panel.
Self-contained CSS. No CDN. Bound to **127.0.0.1 only**. The server
does not remember past advisories: each POST is a new session that
forgets.

---

## 13. Closing

StaticClock will not make a message famous. It will not find the hour
when a feed is loudest. It will not learn who you are.

It will name a place, a morning, a language, and a dialect in which a
sentence is more likely to be read as a sentence.

It does not help messages travel farther. It helps them arrive intact.

Aziel Eliab
2026
Apache-2.0
Forks are welcome and always allowed.

---

## 14. Elevation (v0.2)

Product identity is the gear, not the five-field advisory.

StaticClock is an **action-based immutable timeline**. Like a
mechanical clock, the gear clicks forward. Each action is one tooth —
one second — and that tooth does not come back. There is no rewind,
no pop, no rewrite of an earlier click. A later action that mentions
an earlier hash is a new click. The old click stays.

ChronoLock remains the related advisory-window product (Temporal
Neutral Window 08:30–10:30 local). TemporalLock remains observation
receipts. StaticClock is the action ledger.

## 15. Gear-click ledger

A click has these core fields:

- `click` — 1-based tooth index
- `second` — UTC second (`YYYY-MM-DDTHH:MM:SSZ`)
- `action` — what happened
- `source` — `local`, `azos`, or `advise`
- `prev_hash` — SHA-256 of the prior click (genesis is 64 zero hex chars)
- `hash` — SHA-256 of this click's canonical encoding

Canonical encoding is UTF-8 JSON with sorted keys and no extra
whitespace. Hashed fields: `action`, `click`, `prev_hash`, `second`,
`source`. The click's own `hash` is excluded.

`Timeline.click(action)` only. `rollback()`, `rewind()`, `pop()`,
`clear()`, `reverse()`, replace, and delete raise `NoRollbackError`.

Optional local JSONL is append-only (`mode 'a'`). Hosted `/v1` is
stateless: the caller sends existing `clicks`; the Worker does not
store a chain.

## 15a. Timeslate cross-hash (TemporalLock lattice)

StaticClock gear-clicks are the immutable ticks. TemporalLock
hash-chains those ticks into a timeslate lattice for AZ-OS system
integrity. This tree ships the StaticClock side only.

A **timeslate** is the bindable face of one click (schema
`staticclock-timeslate-v1`). Canonical fields, sorted JSON, no extra
whitespace:

- `click`
- `click_hash` (the click's own SHA-256)
- `product` (`staticclock`)
- `schema`
- `second`

`cross_hash` is SHA-256 of that encoding. `evidence` is one line
TemporalLock may put on a receipt:

```
schema=staticclock-timeslate-v1 product=staticclock lattice=temporallock click=N second=... click_hash=... cross_hash=...
```

`bind` is the TemporalLock-shaped payload: `summary`, `evidence`,
`confidence` 1.0, `timestamp` equal to the click's `second`.
`Timeline.timeslates()` returns one timeslate per click. Anyone can
`verify_timeslate`. StaticClock does not store TemporalLock receipts
and does not exec.

CLI: `staticclock timeslate`. Hosted: `POST /v1/timeslate`.

## 16. AZ-OS hook

AZ-OS is a principle-bound remote shell (integrity precedes
execution). StaticClock's hook is the recording surface:

- `AzosHook.record(action, session=..., principle=...)` appends one
  click with `source=azos`
- `AzosHook.status()` reports hook liveness
- `exec` is always false
- `remote_shell` is always false

The hook does not grant AZ-OS privileges and does not run commands.
It locks the action into time.

Hosted: `POST /v1/hook`. Local CLI: `staticclock hook`. Local UI:
Record via AZ-OS.

## 17. Forget versus rewind

`forget()` still drops the advisory nonce and last-known geo. That
is session hygiene for the companion advisory. It is not a rollback.
The gear keeps every click, including `advise <region>` clicks minted
when `advise()` runs.

## 18. Interface (v0.2)

Library: `Timeline.click`, `Timeline.verify`, `AzosHook.record`,
`StaticClock.advise`.

CLI:

```
staticclock version
staticclock click --action "opened the ledger"
staticclock hook --action "invite accepted"
staticclock genesis --timeline ticks.jsonl --action "first"
staticclock timeline --timeline ticks.jsonl
staticclock verify --timeline ticks.jsonl
staticclock timeslate --timeline ticks.jsonl
staticclock advise --geo "Indiana"
staticclock ui
```

UI (`staticclock ui` / `serve`): action input, AZ-OS hook, verify,
import/export, companion advisory, read-only timezone panel.
Self-contained CSS. No CDN. Bound to **127.0.0.1 only**. No rollback
route.

Hosted Worker: `GET /v1/health`, `GET /v1/skill`, `GET /v1/example`,
`GET /v1/anchors`, `POST /v1/click`, `POST /v1/hook`, `POST /v1/verify`,
`POST /v1/timeslate`, `POST /v1/advisory`. `POST /v1/rollback` returns 400.

Aziel Eliab
2026
Apache-2.0
Forks are welcome and always allowed.
