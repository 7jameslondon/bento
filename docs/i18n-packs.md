# Language packs — design

*Design document, July 2026. Status: **agreed, not built**. Companion to
`PLATFORM.md` §6 (signed self-update) and §8 (i18n). The bundled-core half is
settled; the pack half is specified here and implemented incrementally.*

## The problem

Translations are the largest single thing in the shell — larger than any
dependency. Measured on v1.0.10, after the key-once packing landed:

| | stored in shell |
|---|---|
| all 7 non-English catalogs | **115,572 B** |
| Moveable stack (croact-moveable + ~12 satellites) | ~240 KB minified |
| Reveal.js | ~109 KB minified |

An English-only shell is **426,358 B against 598,457 B — 28.8% smaller.**

So every language we bundle is paid for by every user, in every saved file,
forever — including the ~99% of readers who will never switch to it. But the
languages we *don't* bundle are simply unavailable, and the format's whole
premise is that a file works offline with no server. That tension is what
packs resolve.

### Cost per language (measured, not estimated)

Marginal cost of each catalog, deflated then base64'd as the shell stores
payloads:

| language | chars | bytes/char | stored |
|---|---|---|---|
| zh-Hant | 8,436 | 2.60 | 11.4 KB |
| zh-Hans | 8,432 | 2.60 | 11.6 KB |
| Italian | 25,810 | 1.03 | 13.8 KB |
| Spanish | 26,142 | 1.03 | 14.3 KB |
| French | 27,004 | 1.05 | 15.3 KB |
| German | 25,954 | 1.04 | 16.4 KB |
| Japanese | 12,090 | 2.71 | 16.7 KB |

Counter-intuitively **CJK is the cheapest**: 2.6× the bytes per character, but
a third of the characters. The practical rule is that cost is flat —
**~14 KB per language regardless of script** — so budget per language and
don't agonise over which.

Two consequences worth recording, because both look like free wins and aren't:

- **Simplified↔Traditional conversion on the fly does not pay.** Only **43.3%**
  of characters are identical between the two catalogs, because the difference
  is largely *vocabulary*, not glyph form (软件/軟體, 鼠标/滑鼠, 网络/網路,
  打印/列印). Conversion is also not a bijection (发 → 發 or 髮; 干 → 乾/幹/干),
  so it needs word segmentation — which is why OpenCC's dictionaries run to
  hundreds of KB. Meanwhile deflate **already** recovers 2.2 KB of the genuine
  redundancy for free, because key-once packing puts each string's two variants
  adjacent, inside the 32 KB window. A conversion table would cost ~8–12 KB to
  replace an 11.4 KB catalog and produce text that reads as machine-converted
  to precisely the audience most sensitive to it.
- **Speaker counts are the wrong ranking metric.** What matters is the
  *English-proficiency gap in the segment that uses this tool* — professionals,
  students, educators. Bento's users in India, the Netherlands or Scandinavia
  are largely served by English already and often prefer an English UI, since
  the technical vocabulary is English. Brazil, Russia and Indonesia are the
  opposite. Hindi's 610M headline overstates its value here more than any other
  language's; it is also not politically neutral within India, where English is
  often the preferred link language in the south.

## The decision

**A bundled core, plus downloadable packs for everything else.**

- **Bundled (9):** English, Japanese, Simplified Chinese, Traditional Chinese,
  Spanish, French, German, Italian, **Portuguese**. The existing eight stay so
  that nothing regresses for current users; Portuguese is added because Brazil
  has a genuine English-proficiency gap and it is in the cheapest cost tier.
- **Packs (everything else):** signed, released centrally alongside each app
  release, fetched on demand and spliced into the file.

The bundled core is what makes this safe. It preserves the property in
`kernel/src/i18n.ts` — *"a deck authored in Tokyo opens with French chrome in
Paris"* — for the languages most likely to be encountered, and it keeps
bento.page's live demo working in those languages on first contact. Packs are
purely additive: a file that has never fetched one behaves exactly as today.

**No new languages get bundled by default.** Demand declares itself through
contributions (issue #17 is a volunteer offering Korean); a pack can ship and
be revised without cutting an app release.

## Design

### Pack format

A pack is one language for one app at one app version:

```
bento-slides-1.0.11-ko.pack.json
{ "app": "slides", "version": "1.0.11", "lang": "ko",
  "label": "한국어", "strings": { "<english key>": "<translation>", … } }
```

Per-language maps, not the bundled positional-array shape: a pack is edited
and reviewed as one language, and positional arrays would couple every pack to
a column order.

### Signing and release — the signed pack index

Packs reuse the existing release machinery **exactly** — ECDSA P-256 /
SHA-256, verified against the `PUBLIC_KEY_JWK` already embedded in every shell
(`PLATFORM.md` §6). The private key stays offline and `release.mjs` runs
locally. No new trust root, no second key.

**The INDEX is signed; individual packs are not.** `release.mjs` emits the
packs and then signs one index over all of them:

```
https://bento.page/releases/slides/
  manifest.json                          signed — the app shell
  packs.json                             signed — the pack index
  packs/bento-slides-1.0.11-ko.pack.json  the packs themselves
```

`packs.json` is the same envelope as the manifest, produced by the same code
(`scripts/sign-payload.mjs`, shared by `sign-release.mjs` and `sign-packs.mjs`):

```json
{ "payload": "<the exact json string that was signed>", "sig": "<base64>" }
```

and the payload is

```json
{ "app": "bento-slides", "version": "1.0.11", "at": "<iso>",
  "packs": [ { "lang": "ko", "label": "한국어", "version": "1.0.11",
               "url": "packs/bento-slides-1.0.11-ko.pack.json",
               "sha256": "<hex, lowercase>", "bytes": 60114 } ] }
```

`sig` is ECDSA P-256 / SHA-256 over `payload`'s **UTF-8 string bytes**, IEEE
P1363 (raw r‖s), base64 — byte-identical in construction to the manifest, so
the client verifies both with the same handful of lines.

The client's job is therefore the same two-step the shell already performs for
its own update: **verify the index signature once, then hash each downloaded
pack against its signed `sha256`.** A pack that does not match its pinned hash
is refused. `url` is relative to the channel unless absolute — so a dev
channel (`localStorage 'bento-packs-url'`) serves its own packs rather than
silently reaching back to bento.page.

Two reasons this is a separate artifact from `manifest.json` rather than a
`packs` array inside it:

- **Packs publish on their own clock.** A corrected translation is not a new
  app version — but shipped files ignore a manifest that is not strictly
  *newer* than themselves (downgrade-replay protection), so a hash carried in
  the manifest could never be corrected *between* releases. A separate index is
  re-issuable any day.
- **The manifest keeps meaning one thing:** here is the app shell. The update
  channel ships signed *code*; the pack channel ships signed *data*.

`publish-site.mjs` gates on this before pushing: every indexed pack must exist
and match its signed hash, no published pack may be missing from the index, and
staged packs without an index refuse to publish at all. Signed bytes are served
bytes — for the index exactly as for the shell.

### Loading

`registerI18n` already accepts a packed table (kernel). Pack loading adds a
merge step: a pack's strings layer over the bundled core for its language.
Lookup misses fall back per string to the English key, which is what makes a
partial or stale pack degrade gracefully rather than break.

### Incorporation into the file

A pack is fetched **only on explicit user action** ("Add language…"), verified,
then spliced into the shell as an additional payload block and written out as
a new file — the same fetch → verify → re-splice flow `update.ts` already
performs. Nothing phones home by default; a file that never adds a language
never talks to the network. Once spliced, the pack travels with the file and
works offline forever, like everything else.

## Risks

**Self-update must carry packs forward — this is the one that will ship broken
if it isn't designed in.** `update.ts` fetches a *new shell* and re-splices the
current *document* into it. Packs live in the shell, not the document, so the
naive path hands a Korean user back an English file after an update, silently
and with no error to describe. Pack migration is part of the update path, not
a follow-up.

**Pack/app version coupling.** Every release adds strings. A 1.0.10 pack in a
1.1.0 shell must degrade per string to English, never fail to load. The
manifest is versioned per pack; the policy for "pack older than app" is
load-and-degrade.

**Splice contract.** Packs are additional payload blocks. `#bento-doc` stays
plaintext and the file must still survive `DOMParser → outerHTML`
(`PLATFORM.md` §2). `shell-gate.mjs` must cover a shell carrying packs — the
gate is what protects updaters already frozen in the wild.

**RTL is not a pack.** Arabic, Urdu, Persian and Hebrew are among the largest
gaps by population, but they need bidi and mirroring work in the CSS. Ranking
them by catalog bytes flatters them badly. Treat RTL as its own project; a pack
alone will not make the UI usable.

**Translation quality is the real constraint, not size.** The catalogs are
machine-drafted with "native review welcome" in their headers. Packs improve
this: a pack can be corrected and re-released without an app release, which
turns native review into a continuous process instead of a release blocker.

## Open questions

- Does bento.page's download page pre-splice the visitor's likely locale
  (client-side, since Pages is static)? Optional given the bundled core, but it
  would help first contact for pack-only languages.
- Do packs cover kernel strings shared across apps, or is each app's pack
  self-contained? Slides, Spaces and Dash have overlapping but distinct string
  sets.
- Should a saved deck record which packs it carries, for the People/About UI?

## Splicing a pack into a file — compress it

Measured on the Korean pack: **56.8 KB raw JSON, 26.4 KB** through the
deflate+base64 pipeline the shell already uses for its runtime payloads.

Leave the artifact on the CDN **uncompressed** — GitHub Pages gzips it in
transit anyway (17–20 KB on the wire), and a readable `.json` is worth keeping
for translators. But the splice step MUST compress, because a spliced pack
lives in every saved copy of that file forever: **30 KB per file, per
language, permanently**, and unfixable once files are in the wild. Reuse
`postbuild-compress.mjs`'s existing block format rather than inventing a
second one.

## Status

- [x] Key-once packing of the bundled catalogs — #75
- [x] Portuguese catalog, bundled — #79
- [x] Pack format + `build-i18n.mjs --packs` emitting them — #81
- [x] Kernel `addPack()` loading path — #81
- [x] Korean, the first pack (662/662) — #81
- [x] `release.mjs` emits packs and publishes `packs.json`, a **signed index**
      pinning each pack's sha256 — same envelope, same offline key, no second
      trust root. Gated at publish time.
- [ ] Client: verify the index signature + each pack's pinned hash
      (`slides/src/packs.ts` — the shape it must expect is specified above)
- [ ] In-app "Add language…" (fetch → verify → splice, compressed)
- [ ] **Update carries packs forward**
- [ ] Shell smoke check covers a pack-carrying shell (note: `shell-gate.mjs`
      deliberately checks only the splice contract — it passed a build with a
      silently corrupted stylesheet, so it is the wrong place for this)
