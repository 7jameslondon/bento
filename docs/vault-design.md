# bento/vault — design

*Design document, July 2026. Status: **proposed** — nothing built. Companion
to `collab-design.md` (which solves a different problem: live multiplayer on
one document) and to `PLATFORM.md` (the invariants every Bento app honours).*

## What it is, in one sentence

**Cloud services without a cloud**: your documents live on hardware you own,
and vault gives you the things people go to clouds for — reachability from
every device, search across everything, cross-document references, shareable
links, version history — without any of it running on someone else's computer.

This is explicitly **not** a sync service. Dropbox and iCloud are the wrong
comparison; the closer references are Tailscale (coordination server plus
direct connections) and a homelab Nextcloud that someone else made painless.

## Two products, not one

The single most important boundary in this document.

| | **bento/vault** | **bento relay** |
|---|---|---|
| What | The personal server: storage, index, search, services, clients | Rendezvous plumbing |
| Runs on | Your desktop / NAS / homelab box | Cloudflare (hosted, for the masses) **or** self-hosted |
| Knows | Everything — it holds your documents in the clear | Nothing — ciphertext and routing only |
| Released | Its own train | Its own train |

The relay is *infrastructure*, deliberately dumb. Vault is the *product*.
Serious self-hosters run their own relay; everyone else uses the hosted one at
`bento.page`. Either way they run the same vault.

The relay's own spec is `relay-design.md`. Note that **the relay is always in
the path** — clients never speak to a vault directly, even when both run on
the same box — so the vault never accepts an inbound connection.

### The relay stays dumb — non-negotiable

The relay does exactly three things:

1. **Rendezvous** — help two devices that trust each other find each other
   through NAT (signalling for a direct connection; fall back to relaying
   ciphertext when hole-punching fails).
2. **Optional encrypted dead-drop** — hold ciphertext blobs with a TTL so a
   phone can fetch a document while the home machine is asleep (see
   *Availability*).
3. **Presence** — which of my devices are reachable right now.

It never sees plaintext, never indexes, never searches, never renders, never
runs a model. **Every actual service runs on the personal server.**

The reason is not purity. If the hosted relay accretes features, the
self-hosted relay can't match it, self-hosting silently becomes second-class,
and we lose the audience this product is for. Keeping the relay tiny is also
what makes maintaining two implementations affordable.

### Two implementations, because one runtime isn't self-hostable

The existing `server/sync-worker/` is Cloudflare-specific: Durable Object
bindings, the WebSocket Hibernation API, and SQLite-backed DO classes. A
homelabber cannot `docker run` that. `workerd` is the nominal answer but it is
an unusual deployment and its parity on hibernation / SQLite-backed classes
needs *testing*, not assuming.

So the relay ships twice:

- **Hosted**: Cloudflare Worker + DO (+ R2 for the dead-drop). The reference
  deployment, what `bento.page` runs.
- **Portable**: a plain Node or Go binary in a Docker image. One process, one
  config file, no cloud account.

Both implement the same wire protocol. This is affordable *only* because the
relay is dumb — protect that.

> **Action item, independent of vault:** the r/selfhosted copy already claims
> the collab relay is self-hostable. Test that under standalone `workerd`
> before anyone takes us up on it, and soften the claim or build the portable
> twin.

### Independent release trains force a negotiated protocol

Today the app and the relay are deployed by the same person, so "deploy the
relay before shipping the client" is a workable rule (and is written down in
`CLAUDE.md`). **That rule dies here.** A self-hoster's relay might be a year
old when a new vault client ships, and we have no way to make them upgrade.

Therefore, from the first commit:

- Every relay connection begins with a **capability handshake**: protocol
  version plus a set of named capabilities (`rendezvous`, `deaddrop`,
  `presence`). Clients degrade rather than fail — no dead-drop means "your
  phone syncs when your desktop is awake", not an error dialog.
- **Never remove or repurpose a wire field**; add. Unknown fields are ignored,
  as everywhere else in Bento.
- The client surfaces the relay's version and capabilities in the UI, so a
  self-hoster can see *why* something is unavailable.

## Availability: the hard problem

A cloud is reachable because the server never sleeps. Your desktop closes its
lid. This — not background execution — is the real constraint.

Two deployment profiles, one protocol:

- **Always-on box** (NAS, homelab, VPS): no dead-drop needed. Devices reach
  the vault directly via rendezvous. This is what serious self-hosters get,
  and it is the ideologically clean path.
- **Laptop-only** (most people): the hosted relay offers an **encrypted
  dead-drop** — the vault pushes ciphertext blobs of recently-changed
  documents, and phones fetch from there when the laptop is asleep. The relay
  still cannot read anything; it is a cache, not a service.

The dead-drop is an *optional relay capability*, so the protocol does not
depend on it and the self-hosted profile is not a degraded one.

### Background execution: don't fight the platform

Chrome freezes and discards background tabs; iOS suspends within seconds and
grants only opportunistic `BGAppRefreshTask` windows; Android batches
`WorkManager` jobs under Doze. Nothing reliable exists on any of them.

The design consequence: **the protocol must be correct after an arbitrary,
unbounded offline period.** No leases, no heartbeats, no "last seen"
assumptions. Sync is triggered by foreground, by explicit action, and by
pre-suspension flush (`freeze` / `pagehide` / `applicationDidEnterBackground`);
anything the OS grants beyond that is a bonus that may never arrive.

The desktop agent is the exception and the reason it exists: a real background
process on a machine that is already awake.

## Clients

- **Desktop agent** — the heart of "set and forget". A tray app that watches a
  folder, encrypts client-side, maintains the index, and serves the vault.
  Leaning **Tauri** (small binary, tray, filesystem watching, settings UI in
  one codebase), with the same core compiled **headless** for NAS/server use.
- **Mobile** — *not* a background daemon; that fight is unwinnable. Use the
  platform-sanctioned providers instead: **iOS File Provider extension** and
  **Android DocumentsProvider (SAF)**. Documents appear in the system file
  browser, the OS materialises them on demand and wakes the extension when the
  user touches them. Plus sync-on-foreground in the app itself.
- **Web** — the existing single-file apps, unchanged (see below).

## The apps need no changes

If the agent syncs a **folder**, then slides, spaces and dash require zero
integration work. You save a `.bento.html` into `~/Bento` exactly as you do
today and it is in the vault. The file remains the interface.

This is deliberate: vault can be built entirely in parallel with the app
fan-out, blocking nothing and coupling to no app's format.

## Data model (sketch)

- **Blobs**: content-addressed, client-side encrypted, chunked so a change
  moves a delta rather than a whole document. R2 or any S3-compatible store
  for the dead-drop; plain filesystem on the vault itself.
- **Index**: the authority on what documents exist, their `docId`, titles,
  timestamps, tags and references. Small enough to sync eagerly. Concurrent
  device edits reconcile with LWW registers plus tombstones — **do not** reach
  for the slides CRDT here; a file list is not a rich-text document.
- **Identity**: reuse the shipped owner→invite→member key chain from
  `collab-design.md`. A new device is paired the same way a collaborator is
  invited; per-device keys never leave the device.

## Search and local models

The differentiator, and the reason to design the index for it from day one
rather than retrofitting: a vault that indexes every document can answer
questions across all of them **locally** — including via a local model
(Ollama is already referenced in the README). "Find the deck where I showed Q3
churn", "summarise these six notes."

No cloud can offer this without taking your data. It also reframes mobile:
the phone is not syncing a library, it is *querying your box* — far less data
movement, and a query is a foreground action by definition, so the background
problem evaporates.

Implication for the index: store extracted plain text per document alongside
the metadata, and leave room for an embedding vector per document (or per
block) even if v1 only does keyword search.

## Invariants

1. **Export always works.** Any document is exportable as a standalone
   `.bento.html` from any client at any time. This is what keeps "your data is
   a file you own" true while vault holds it. Without this we have built
   Notion with extra steps.
2. **The relay only ever sees ciphertext.** Both deployments, no exceptions.
3. **Vault is optional.** Every Bento app works fully with no vault, forever.
   Vault is a convenience over something that already functions alone.
4. **Losing the vault loses convenience, not work** — the files are still
   files.

## Threat model (first pass)

- **Hosted relay operator (us)** — sees ciphertext, blob sizes, timing, device
  presence, and IPs. Cannot read documents, titles, or the index. Metadata
  leakage is real and should be documented honestly, not hand-waved.
- **Network attacker** — sees TLS. Rendezvous must not leak the index.
- **Stolen device** — per-device keys are revocable via the existing
  owner-signed revocation path; a revoked device loses access to future
  content but obviously retains what it already had.
- **Compromised vault host** — total loss for that user; the vault holds
  plaintext by design. Document this plainly. Full-disk encryption is the
  user's responsibility, as with any personal server.

## Out of scope for v1

Real-time collaboration through the vault (that is `collab-design.md`'s job
and it already works), team/multi-user vaults, public web publishing, mobile
editing beyond what the apps already do in a browser, and Windows/Linux
desktop builds before macOS is proven.

## Sequencing

1. **Desktop agent, one folder, macOS, always-on-box profile.** No dead-drop,
   no mobile. This alone delivers the promise for daily personal use and
   proves the data model.
2. **Relay: capability handshake + rendezvous**, hosted implementation first,
   portable twin immediately after (not "later" — the second implementation is
   what keeps the first honest).
3. **iOS File Provider** against a data model the agent has already proven.
4. **Dead-drop** for the laptop-only profile.
5. Search, then local-model queries.
6. Everything else.

Step 1 needs no changes to any Bento app, so it can proceed alongside the
spaces/dash fan-out without contention.
