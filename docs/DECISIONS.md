# Decision log

Append-only. Newest first. One entry per settled decision that a parallel
agent (or future session) might otherwise re-open or contradict. Keep entries
to a few lines: **what** was decided, **why**, and where the details live.
Reversing a decision = a new entry that supersedes the old one, not an edit.

Format:

```
## YYYY-MM-DD — Title
Decision. Why. Pointers.
```

---

## 2026-07-26 — Side-loaded artifacts: sign the index, pin the bytes, fail closed

Language packs are fetched over the network, so they get the **same two-step
the app shell's own update already gets**: an envelope signed with the release
key (`{payload, sig}`, ECDSA P-256 / SHA-256) whose payload pins each
artifact's `sha256`, and a download that is accepted only if its bytes hash to
that pin. Signature over the pin, pin over the bytes. **No second key and no
second trust root** — `PUBLIC_KEY_JWK` in `kernel/src/update.ts` is it.

The mechanism lives in the kernel (`verifySigned`, `fetchPinned`) because it is
the same for anything side-loaded; the *policy* stays in the app
(`slides/src/packs.ts`). Keep that boundary: the kernel helpers verify BYTES,
they do not decide what is safe to use. Packs are DATA with a bounded failure
mode (wrong words on screen), which is why a pack that fails a refresh is kept
at its existing version rather than dropped. Anything side-loaded that ever
carries CODE needs stricter policy — pinned at install, never auto-refreshed —
and must not inherit the pack rules by reusing the same fetch.

**Fail closed, no legacy path.** An unsigned or unpinned index yields no
listings at all. Nothing is published yet, so there is no permissive fallback
to keep — and one added later would mean whoever answers for the channel picks
the strings in the UI.

**A pack already inside a file is NOT re-verified** (`readPacksFromShell`). It
was verified at the door, and once spliced it carries exactly the trust the
document does — anyone who can rewrite that block can rewrite the checking
code too. Re-verifying would need the network at boot, which breaks offline
use. Proof rig: `node scripts/test-packs.ts` (throwaway key, real crypto).

## 2026-07-25 — i18n: a bundled core of 9 languages, everything else a signed pack

The 7 non-English catalogs cost **115,572 B** of the shell even after key-once
packing — more than any dependency, and an English-only shell is 28.8%
smaller. But we want *more* languages, not fewer. So: **bundle a core, ship
everything else as signed downloadable packs.**

- **Bundled (9):** the existing 8 (en, ja, zh-Hans, zh-Hant, es, fr, de, it)
  plus **Portuguese**. Nothing regresses for current users; Portuguese is
  added because Brazil has a real English-proficiency gap and it is in the
  cheapest cost tier.
- **Everything else:** a pack, signed with the existing release key and
  released centrally alongside each app release, fetched only on explicit user
  action and spliced into the file.

**No further languages get bundled by default** — demand declares itself
through contributions (#17 offers Korean), and a pack can be revised without
cutting an app release.

Measured facts worth not re-deriving: cost is **~14 KB per language regardless
of script** (CJK is the *cheapest* — 2.6× the bytes per character but a third
of the characters). Simplified↔Traditional conversion on the fly does **not**
pay: only 43.3% of characters match, because the difference is vocabulary
(软件/軟體) not glyph form, and deflate already recovers the genuine redundancy.
Rank candidate languages by the **English-proficiency gap in the segment that
uses this tool**, not by speaker counts — which is why Hindi is not in the core
despite 610M speakers.

Full design, risks and status: **`docs/i18n-packs.md`**. The risk that will
ship broken if ignored: **self-update must carry packs forward** — `update.ts`
re-splices the document into a *new shell*, and packs live in the shell.

## 2026-07-25 — Every PR gets human review before merging to main (for now)

At this stage of development the maintainer reviews **every** PR before it
lands on `main`, including agent-authored ones. No auto-merge. The point is
visibility into what the agents are actually producing while the multi-agent
workflow is still being shaken out — the cost is throughput, and that is
currently the right trade.

Supporting config, already in place: `main` is branch-protected with one
required approval, and CI (`validate`) is a **required status check**, so a red
build cannot merge. Admin bypass stays enabled for the maintainer.

### FUTURE ACTION — revisit when review becomes the bottleneck

When PR volume outgrows one reviewer, consider auto-merging **app-zone** PRs on
green CI. If that happens, these paths must **always** require human review
regardless, because a bad merge is either silent or catastrophic:

- **`kernel/src/`** — every app depends on it.
- **`slides/src/sync/`, above all `crdt.ts`** — convergence bugs are silent and
  corrupt documents. The rig is necessary but not sufficient: it only generates
  short strings, which is why it missed the large-text stack overflow (#47).
- **`server/`** — one bad deploy breaks live collaboration for everyone at
  once, and there is no per-user rollback.
- **`scripts/release.mjs` / `sign-release.mjs` / `keygen.mjs`** — the signing
  and release path.
- **Anything touching the `#bento-doc` splice contract or the update-manifest
  shape** (`PLATFORM.md` §2, §6) — these brick files already on users' disks.

Do not enable auto-merge without that exclusion list encoded somewhere
enforceable, not just written down here.

## 2026-07-24 — Naming: the platform is `bento`, the mark is `bento/.`, all lowercase
Settled after working through the whole namespace. **Do not reopen these** —
each rejected candidate was rejected for a specific reason, recorded below.

- **Platform: `bento`** (lowercase). Not "Bento Box", not "Bento Suite" — the
  bare word is the family, and `bento/<app>` reads as members of it.
- **Wordmark: `bento/.`** — the trailing dot stands for the platform (the apps
  complete the slash). This is a MARK, not a name: `/` is a path separator and
  is illegal in filenames, URLs, package names and social handles, and
  punctuation is disregarded for trademark purposes. Anywhere a name must be
  stored or typed, it is `bento`.
- **Casing: lowercase everywhere**, brand and machine alike. This deliberately
  collapses the usual split (`Docker` the brand / `docker` the command)
  because the lowercase form is already the file's own identity — `doc.type`
  is `bento/slides`, the MIME type is `application/bento+json`.
- **Apps:** `bento/slides` (shipped), `bento/spaces` (Notion/notes-like),
  `bento/dash` (spreadsheet + tables + dashboards — absorbs what would have
  been a separate database app), `bento/vault` (document library / personal
  storage). A word-processor app is planned; **`bento/folio` is the proposed
  name, NOT yet confirmed** (alternatives considered: draft, prose, write —
  `pages` and `docs` are unusable, being Apple's and Google's).

**Rejected, with reasons:** `box` — the natural collective noun, and Box, Inc.
is a cloud-storage company; keep it as an informal collective at most.
`base` — retired once dash absorbed tables; also reads as "database", which
this platform does not have. `bits` — generic, tonally wrong for an editorial
brand, and pushes search toward snack food. `page`/`pages` — reserved: it is
the best name for a future web-publishing app, and Apple Pages owns the
word-processor association. `shelf`/`library` — weaker than vault, and library
reads as "code library" to this audience.

**Note on the crowded namespace:** several unrelated SaaS products are called
Bento (email automation, link-in-bio, analytics, a dead FileMaker database).
The field is crowded, which weakens everyone's claim — including ours. The
practical cost is discoverability, not legal exposure. Mitigation is the
`bento/<app>` form, the `bento.page` domain, and always carrying the
descriptor. Get real clearance before commercialising; a bare wordmark would
be hard to register, a composite (mark + logo) much less so.

## 2026-07-25 — bento/vault is a personal server; the relay is a separate product
**Supersedes the "map, not the keys" entry below.** Vault is not an index and
not a sync service — it is "cloud services without a cloud": your documents
live on hardware you own (desktop / NAS / homelab) and it provides
reachability, search, cross-document references and version history without
any of it running on someone else's computer. The closer reference is
Tailscale, not Dropbox.

Vault and the **relay** are separate products with separate release trains.
The relay is dumb infrastructure — rendezvous, an optional encrypted
dead-drop, presence, nothing else — hosted on Cloudflare for the masses and
self-hosted by serious users. Every actual service runs on the personal
server; if the hosted relay ever accretes features, self-hosting becomes
second-class and we lose the audience this is for.

Consequences captured in `docs/vault-design.md`: the relay needs a portable
(Docker) implementation because the current Worker+DO+hibernation stack is not
realistically self-hostable; independent release trains require a versioned
capability handshake (we can no longer control deploy order); background
execution is unreliable on every platform so the protocol must be correct
after unbounded offline periods; mobile uses iOS File Provider /
Android DocumentsProvider rather than a background daemon; and the agent syncs
a FOLDER, so no Bento app needs any changes. Retained from the superseded
entry: the relay only ever sees ciphertext, and **export-to-standalone-file
always works** — that invariant is what keeps "your data is a file you own"
true while vault holds it.

## 2026-07-24 — [SUPERSEDED] bento/vault holds the map, not the keys
The document library must not become a custody service. It stores an encrypted
index of what documents exist and how they reference each other; each document
keeps its own encryption password and collab credentials. Compromising the
vault reveals *what you have*, not what is in it, and losing the vault loses an
index, not your work. This preserves the property that makes the relay
defensible — files stay authoritative, server loss is survivable — and keeps
the name an honest promise. Any sync tier is E2EE and optional (DO for
coordination + R2 for encrypted blobs; never D1/plaintext), and self-hostable.

## 2026-07-24 — Suite expansion: bento/spaces and bento/dash
Two new apps begin: **bento/spaces** (Notion/notes-like) and **bento/dash**
(spreadsheet + tables). Development fans out across parallel
agents and multiple tools (Claude Code, Codex, Antigravity) — coordination
rules in `docs/PARALLEL-WORK.md`, platform contract in `docs/PLATFORM.md`.
Planned pre-fan-out groundwork: extract the shared kernel (monorepo layout,
apps beside `slides/`), add per-PR CI validation gates (typecheck +
build:single + splice conformance + test-sync). Releases stay local/signed
regardless of CI.

## 2026-07-24 — Hold marketing-surface i18n
Don't localize the bento.page landing page or README yet: the landing page
will be rebuilt around the multi-app suite, so translations now would only
drift. App UI i18n (7 locales) is the localization that matters and already
ships. Revisit once the new landing page is stable.

## 2026-07-24 — No bot/AI-agent identities in git history
External PRs get provenance review before merge (`gh api users/<login>`);
scatter-bot/AI-agent contributions are declined. A bot's merged PR was
scrubbed from history via filter-repo + force-push, and `main` is now
branch-protected (1 required review, no force-pushes). Human contributors'
authorship is preserved normally.

## 2026-07-22 — v1.0.7 launch (Show HN) and post-launch fixes
Launched publicly (#1 on HN, ~1000 pts). Post-launch priorities were driven
by thread feedback: collab focus-steal fix, chart zero-baseline for negative
values, mobile-Safari pinch, reduce-motion mode — all shipped in v1.0.8
alongside panel UI for community format features (text gradient, text-stroke,
blur/blend, backdrop-filter). Community format features are accepted when
additive + composable (unknown fields preserved; effects compose).

## v1.0.7 — Morph identity decoupled from element id
Elements carry optional `morphId` overriding the morph pairing;
`data-flip-id = morphId || id`. `id` stays the stable identity (selection,
anchors, CRDT). Chosen over mutating ids, which would have broken comment
anchors and collab node identity. Details: CLAUDE.md (render.ts section).

## v0.9.x — Charts are in-house (ECharts removed)
ECharts was 630KB (~47% of the shell); replaced with charts-lite interpreting
the same option SHAPE (pure JSON, no functions). Exotic configs degrade
gracefully rather than crash. Don't re-add a chart dependency; extend
charts-lite instead. Details: CLAUDE.md (charts section).

## v0.9.x — Collab credentials mint-at-creation, dormant until shared
Decks are born collab-capable but never auto-connect unless the doc arrived
carrying collab or the user opted in — fresh templates/demos must never phone
home. Read-only and writer roles are enforced cryptographically at the blind
relay, not honour-system. Spec: docs/collab-design.md.

## v0.x — Releases are cut locally, never in CI
The signing key never leaves the maintainer's machine; the signed bytes are
the served bytes. CI may validate (typecheck/build/gates) but never signs,
publishes, or deploys. Runbook: docs/RELEASING.md.

## v0.x — Single-file architecture is the product
One HTML file = document + viewer + editor, working offline from file://.
The splice contract on `#bento-doc` is frozen forever (shipped updaters
depend on it). Everything else is negotiable; this isn't. See
docs/PLATFORM.md §1–2.

## 2026-07-25 — Large assets travel out-of-band; the relay stays blind

Assets over 64KB (`BLOB_INLINE_MAX`) no longer ride inside CRDT ops. They are
encrypted client-side, uploaded once to the relay's R2 bucket, and referenced
from the document by a content-addressed key; peers fetch and decrypt on
receipt. This was forced by measurement, not preference: Durable Object storage
values cap at ~2MB, so the previous inline path produced frames the relay
accepted-then-dropped, and the client re-sent forever. Details and threat model
in `docs/blob-offload.md`.

Three properties are load-bearing and must not be traded away:

- **The relay cannot read a blob.** It pipes ciphertext without buffering. The
  key is `HMAC(roomKey, sha256(plaintext))`, so identical bytes dedupe *within*
  a room and are unlinkable *across* rooms — a plain content hash would have
  let the relay confirm two rooms hold the same file.
- **R2 is optional.** Absent binding = `/b/` answers 501, clients inline small
  assets and same-origin tabs still resolve from the local cache. A
  self-hoster without a bucket degrades; they are not broken. This follows
  from the relay being dumb infrastructure (see the vault entry).
- **Failures are visible, never silent-but-wrong.** An unresolved blob leaves
  the asset absent and renders empty rather than blank-looking-fine. The whole
  change set exists because the old failure mode was invisible.

Operational consequence: the relay must be deployed **before** a client that
depends on the blob endpoints — the standing rule for this split, same as the
keepalive and access-verification changes.

## 2026-07-25 — Solo review model: PR + green CI, zero required approvals

**Amends the entry below** ("Every PR gets human review before merging"). The
intent stands — every change lands via PR and the maintainer reads it — but the
*mechanism* was wrong and was quietly defeating the CI gate.

`main` required 1 approving review. GitHub forbids approving your own PR, so on
a one-person project that requirement is unsatisfiable and **every** merge had
to use `--admin`. Admin bypass skips *all* branch protection, including the
required `validate` status check. Net effect: the CI gate was decorative, and a
red build could land on `main` with nothing to stop it.

Now: `required_approving_review_count: 0`, PRs still required, `validate` still
a required status check, force-pushes and deletions still blocked. A normal
`gh pr merge` works and genuinely cannot merge a red build. Admin bypass stays
*available* (`enforce_admins: false`) but is now an exception rather than the
daily path — if you find yourself reaching for `--admin`, that is a signal
something is actually failing.

Human review is a practice, not a GitHub setting, for as long as the team is
one person. Restore a real approval count the moment a second reviewer exists;
the future-action exclusion list in the amended entry still applies.
