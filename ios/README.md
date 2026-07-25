# bento/host — iOS

A thin native host that runs **any self-contained HTML document** and lets it
**save itself in place** on iOS.

Bento decks are the reason it exists, but nothing in the Swift is Bento-specific
— it never parses the document, it is a courier. Any single-file HTML app that
saves itself through the File System Access API works the same way, which on iOS
is otherwise impossible: every browser there is WebKit and none of them ship
that API.

## Why this exists

Every browser on iOS is WebKit, so the File System Access API does not exist
there — not in Safari, not in Chrome or Firefox, which are WKWebView underneath.
Without it Bento can only hand back downloaded copies: no in-place save, no
silent autosave write-back, no in-place self-update. `UIDocument` is the only
way to write back to the user's actual file, and only a native app can use it.

## What it is, and what it deliberately is not

The app supplies **file access and nothing else**. It bundles no runtime for
rendering and has no opinion about which version of Bento a deck carries.

That is the decision everything else follows from. The deck runs **its own
embedded runtime**, exactly as it would in Safari, so it self-updates through
Bento's normal signed channel — iOS users get the same release as everyone else,
the same day, with no App Store submission per release and no second release
train to keep in step.

The alternative (bundling a shell and rendering every deck with it) would have
put iOS behind an App Store review queue forever and made the bundled copy drift
from the current release. It is not needed: Apple's rule is about downloading
code that changes the features **of the app**, and the app here behaves
identically whatever a document contains. What updates is user content, the same
as any page a browser renders.

## How saving works — no changes to Bento

`kernel/src/save.ts` tests exactly one thing: `typeof
window.showSaveFilePicker === 'function'`, and needs only

```
showSaveFilePicker({suggestedName}) -> { name, createWritable() }
createWritable() -> { write(Blob|string), close() }
```

So `Resources/bridge.js` polyfills that over a `UIDocument` bridge — three
methods. Two consequences:

- **No web-side changes at all.** Every in-place path (⌘S, autosave write-back,
  self-update, the capability-aware messaging) already routes through that one
  function.
- **Every deck ever saved works**, including files whose embedded runtime
  predates this app. A bespoke `window.__bentoHost` bridge would only have helped
  decks re-saved after it shipped — which is to say, none of the existing ones.

### Which file a save targets

Bento only reaches a picker when it holds **no handle**; afterwards ⌘S, autosave
and in-place update all reuse it. So the rule is deterministic:

- **first** `begin` → the document already open in the app, resolved with no UI
- **any later** `begin` → a genuine Save-As or export (read-only copy, invite,
  template), which gets a real picker and must never overwrite the open file

Do **not** infer this by comparing `suggestedName` to the open filename. Bento
derives that name from the deck TITLE, so it rarely matches — an early version
of this bridge did exactly that and prompted on every single save.

## Two implementation details that carry weight

- **The document is served through a custom scheme** (`bento-app://`), never
  `loadFileURL`. A `file://` page in WKWebView gets an opaque, unstable origin,
  which makes `localStorage` and IndexedDB unreliable — silently breaking the
  autosave backstop, the per-device collab member key, and language/motion
  preferences. It also keeps relay fetches from arriving as `Origin: null`.
- **The host is PER DOCUMENT**, a truncated SHA-256 of the file's path, not a
  shared `deck`. Since this app opens any HTML document, a shared origin would
  let one document read another's `localStorage` and IndexedDB — fine when every
  file is yours, a real leak between unrelated third-party apps. Derived rather
  than random because the origin IS the storage boundary: a random host per
  launch would wipe that storage on every open. The trade is that moving or
  renaming a file gives it a new origin and orphans its local state — which is a
  cache and a backstop, never the document itself.
- **`bridge.js` is injected `.atDocumentStart`.** Bento decides whether it can
  save during boot; injected later, the editor has already concluded it cannot.

## Building

Needs **full Xcode** (Command Line Tools alone is not enough) and XcodeGen:

```sh
brew install xcodegen
cd ios && xcodegen && open BentoHost.xcodeproj
```

`BentoHost.xcodeproj` is generated, never committed — a `.pbxproj` in git is a
merge-conflict magnet.

## State: scaffold, not shippable

Verified — the save contract, exercised against the **real** Bento build in a
browser with the native side emulated (`begin`/`write` over the same protocol):

- ⌘S writes the open document, no export prompt, 899KB of valid HTML with the
  `#bento-doc` block intact and no stray script-close
- autosave write-back reuses the handle and writes again silently
- "Save a copy…" prompts for a destination and leaves the open document
  untouched

Also verified — the Swift **typechecks against the real iOS 26.5 simulator SDK**
(`swiftc -typecheck -sdk $(xcrun --sdk iphonesimulator --show-sdk-path)`), so
UIKit, WebKit, `UIDocument`, `WKURLSchemeHandler` and every protocol conformance
resolve. That is full semantic analysis, not a syntax pass.

Not verified — **the app has never been linked, launched or run.** Typechecking
stops before codegen and linking, and nothing has exercised the bridge on an
actual device or simulator. Runtime behaviour — the scheme handler serving
bytes, security-scoped access, the save round trip reaching disk — is still
unproven.

Still to do:

- App icon, launch screen, signing, an Apple Developer account ($99/yr).
- Decide whether a `.bento.html` UTI is worth declaring over plain `public.html`.
