# bento/spaces

A Notion/notes-like Bento app: one HTML file that is the document, the viewer
and the editor. **This is currently a SCAFFOLD** — it is on-platform and it
works end to end, but the app itself is deliberately minimal (a flat list of
text blocks) so that the kernel seam is legible and the real app can be grown
from a known-good starting point.

If you are an agent picking up spaces work: read `AGENTS.md`,
`docs/PLATFORM.md` and `docs/PARALLEL-WORK.md` first. `spaces/` is your
ownership zone; `kernel/` is not (kernel changes are serialized).

## Run it

```sh
cd spaces
npm install
npm run dev            # dev server (port 5196 via .claude/launch.json)
npm run build:single   # → dist-single/Bento_Spaces.bento.html (the product)
```

## What's wired (the reference for any new Bento app)

- **Self-contained single-file build** — the same vite + `postbuild-compress`
  pipeline as slides, passing the splice conformance gate
  (`node scripts/shell-gate.mjs spaces/dist-single/Bento_Spaces.bento.html`).
- **`configureApp()`** — app id, display name, and the app's own update
  manifest path (`releases/spaces/manifest.json`).
- **Self-save** — `saveFile()` (File System Access, download fallback);
  ⌘S and the Save button. The serialized file keeps its compressed runtime.
- **Autosave + recovery** — kernel IndexedDB store keyed by `docId`, with a
  restore/discard banner when the last session ended unsaved.
- **i18n** — the kernel engine via a local facade; catalogs are empty for now,
  which is fine because English strings are the keys.
- **AI round-trip** — `window.bento` exposes `doc`, `serialize()`,
  `loadDoc(json)`.
- **Format discipline** — `parseDoc` validates `format === 'bento/spaces'`,
  mints a `docId` when absent, preserves unknown fields, and rejects other
  apps' documents.

## What is deliberately NOT wired yet

- **Collaboration.** No CRDT/relay. `docs/PLATFORM.md` §10 permits shipping
  without collab rather than with a half-secure version. The sync engine is
  currently slides-shaped (see `docs/DECISIONS.md`); genericizing it is its
  own project.
- **Password encryption UI.** The kernel writes `bento/enc` envelopes and this
  app detects them, but there is no unlock prompt yet — an encrypted file
  reports rather than pretending.
- **Rich text, nested blocks, embeds, references.** The block model is one
  flat `{id, text}` list. Grow it ADDITIVELY: every future version must still
  open documents this one wrote.
- **Update UI.** `configureApp` declares the manifest path, but nothing checks
  for updates yet, and no spaces release has been cut.
