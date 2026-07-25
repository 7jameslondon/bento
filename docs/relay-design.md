# bento relay — design

*Design document, July 2026. Status: **proposed** — nothing built. The relay
is a product in its own right, separate from `bento/vault` (see
`vault-design.md`) and with its own release train. Today's collab relay
(`server/sync-worker/`) is a narrower ancestor of this; the two converge —
see* Relationship to the collab relay *below.*

## What it is

Rendezvous plumbing. It lets a **client** (desktop UI, phone, web app) reach a
**vault** (the personal server holding a user's documents) without either side
needing a public address, a static IP, or a forwarded port.

It is deliberately the dumbest component in the system. It never sees
plaintext, never indexes, never searches, never renders, never runs a model.
Every actual service runs on the vault.

## The relay is always in the path

Even when a homelabber runs the relay and the vault on the same box, clients
still speak to the vault *through* the relay. This is a design decision, not
an accident, and it buys four things:

1. **The vault never accepts inbound connections.** It dials out to the relay
   and keeps that channel open. No port forwarding, no DDNS, no inbound
   firewall rule, nothing exposed to the internet. This is the single biggest
   security and setup win available, and it is why the model works for
   non-experts.
2. **One client code path.** No "am I local or remote?" branching, no
   discovery fallback matrix, no separate LAN protocol. A client is configured
   with a relay URL and a vault identity; everything else is the same.
3. **One auth model**, applied in one place.
4. **Uniform testing** — the localhost deployment exercises the same protocol
   as the hosted one.

**Control plane always, data plane when necessary.** The relay always brokers
identity, discovery and session setup. Bulk data should travel *directly*
between client and vault whenever the two can reach each other (same LAN, or
after successful hole-punching), falling back to relayed ciphertext when they
cannot. Same split as Tailscale: coordination is centralised, traffic is not.

## Identity and addressing

Reuse the shipped owner→invite→member chain from `collab-design.md` rather
than inventing a second one.

- A vault has an **owner keypair** (ECDSA P-256). Its address commits to the
  public key: `v` + base64url(sha256(ownerPubRaw)). The relay can therefore
  verify trustlessly who may announce as that vault — exactly the trick the
  `w`-rooms already use.
- **Devices are members.** Each device mints its own keypair, never leaving
  the device, and is admitted by an owner-signed delegation. Pairing a new
  phone is the same operation as inviting a collaborator.
- **Revocation** is the existing owner-signed `rev.${pub}` path.

The relay verifies signatures to decide *who may connect to what*. It learns
public keys and connection metadata; it learns nothing about content.

## Wire protocol

### Capability handshake — first message, always

Vault and relay ship on **independent release trains**, and a self-hoster's
relay may be a year older than the client talking to it. There is no way to
enforce deploy order, so negotiation is mandatory from the first commit:

```
→ hello   { pv: 1, role: "vault"|"client", vault: "v<hash>", pub, sig }
← welcome { pv: 1, caps: ["rendezvous", "presence", "deaddrop"], limits: {...} }
```

- Clients **degrade, never fail**, on a missing capability. No `deaddrop`
  means "your phone reaches the vault when the vault is awake" — not an error.
- **Never remove or repurpose a field**; only add. Unknown fields are ignored,
  as everywhere else in Bento.
- The client surfaces the relay's version and capabilities in its UI, so a
  self-hoster can see *why* something is unavailable rather than filing a bug.

### Operations

| Message | From | Purpose |
|---|---|---|
| `announce` | vault | "I am online and reachable", with connection candidates |
| `resolve` | client | "Is vault V online? How do I reach it?" |
| `offer` / `answer` / `candidate` | both | Session negotiation, relayed verbatim |
| `presence` | both | Which of my devices are currently connected |
| `frame` | both | Opaque ciphertext, when a direct path could not be established |
| `drop.put` / `drop.get` | both | Encrypted dead-drop, if the capability is offered |

Everything carrying user content is ciphertext the relay cannot read. The
relay's entire job is routing envelopes and checking signatures.

### Data path

- **Direct** — preferred. Native clients (desktop agent, mobile) can hole-punch
  and speak directly to the vault. On a LAN this is trivially fast.
- **WebRTC data channels** — the only P2P option available to *browser*
  clients, since a web page cannot open arbitrary sockets. The relay acts as
  the signalling channel.
- **Relayed** — the fallback, and the only path when a symmetric NAT defeats
  hole-punching. Ciphertext only, and metered (see *Abuse*).

For v1 it is acceptable for web clients to always take the relayed path;
documents are small and the dead-drop absorbs bulk transfer.

## The dead-drop (optional capability)

A vault on a laptop is asleep most of the day. The dead-drop is an encrypted
blob store with a TTL that lets a phone fetch recent documents while the vault
is unreachable. It is a **cache, not a service**: the vault remains the
authority, and the relay still cannot read anything.

Self-hosters on always-on hardware do not need it, which is exactly why it is
a *capability* and not part of the core protocol.

## What the relay must never do

Search. Index. Store plaintext. Parse documents. Render. Run a model. Hold
authoritative state. Know a document's title.

The reason is structural, not ideological: if the hosted relay accretes
features, the self-hosted relay cannot match it, self-hosting silently becomes
second-class, and we lose the users this exists for. Keeping the relay tiny is
also the only thing that makes maintaining two implementations affordable.

## Two implementations

- **Hosted** — Cloudflare Worker + Durable Object (+ R2 for the dead-drop).
  Reference deployment; what `bento.page` runs, for people who will never run
  a server.
- **Portable** — a single Node or Go binary in a Docker image. One process,
  one config file, no cloud account. This is what a homelabber runs, very
  often on the same box as their vault.

Both implement this document. Any behaviour that cannot be expressed in both
does not belong in the relay.

> **Prerequisite, worth doing before writing either:** verify whether the
> existing `server/sync-worker/` actually runs under standalone `workerd`. It
> depends on Durable Object bindings, the WebSocket Hibernation API and
> SQLite-backed DO classes, and the r/selfhosted copy already claims it is
> self-hostable. That test tells us whether the portable twin is a nice-to-have
> or the only real self-host path.

## Abuse, quotas, and honesty

The hosted relay is a public service and will be abused. It needs, from day
one: per-vault and per-IP rate limits, a dead-drop size and TTL cap, relayed
bandwidth metering, and a documented policy for what happens when a limit is
hit (degrade, don't silently drop).

**Metadata leakage, stated plainly** — the hosted relay operator can see
public keys, IP addresses, connection times, blob sizes and traffic timing. It
cannot see documents, titles, or the index. This should be written in the
user-facing docs, not buried here; "we can't read your files" is true and
"we see nothing" is not.

## Relationship to the collab relay

`server/sync-worker/` already does a narrow version of this: blind ciphertext
routing between peers, with key-committed room ids and signature-verified
writes. Vault rendezvous is the same shape with a bigger job.

**Recommendation: one relay, two capabilities** — collab rooms and vault
rendezvous served by the same process, advertised through the same capability
handshake. A self-hoster then runs one box, not two, and the identity chain is
shared rather than duplicated. This argues for growing `sync-worker` into the
relay rather than starting a second service beside it.

## Sequencing

1. **Capability handshake + identity verification.** Nothing else works
   without it, and retrofitting negotiation is the expensive mistake.
2. **Announce / resolve / relayed frames.** Correct but slow: everything
   proxied. Enough to make a desktop agent reachable from a phone.
3. **Direct path** (hole-punching, then WebRTC for browsers) as an
   optimisation over a protocol that already works.
4. **Dead-drop**, for the laptop-only profile.
5. **Portable implementation** — no later than step 3, because the second
   implementation is what keeps the first honest.
