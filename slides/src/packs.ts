// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Language packs (docs/i18n-packs.md): fetching them, and carrying them in
// the file.
//
// A PACK LIVES IN THE FILE. Nowhere else.
//
// An earlier version of this also let a pack be installed into localStorage
// "on this computer". It was removed, because localStorage is scoped per
// ORIGIN and that is fatally misaligned with how Bento is actually used: the
// download comes from bento.page (an https origin), and the file is then
// opened from disk (a file:// origin). A language added on the website was
// therefore GONE the moment the user saved the deck and reopened it locally —
// the exact journey the product encourages. "I added Korean and it vanished"
// is not a bug a user can diagnose, and no amount of wording fixes it.
//
// Keeping one home also matches the rest of Bento: the file IS the software,
// so a language belongs to the deck. The trade is that adding a language
// requires saving the file — which the UI states plainly rather than hiding.

import { addPack, removePack, type LanguagePack } from '../../kernel/src/i18n.ts'
import { readShellBlocks, type ShellBlock } from '../../kernel/src/save.ts'
import { PACKED } from './i18n/packed'

/**
 * Where the release channel publishes the pack index and the packs.
 * Dev override: localStorage 'bento-packs-url' — the same convention the
 * updater uses for 'bento-update-url', so a local channel can be pointed at
 * without a rebuild. (A URL, not pack data: nothing durable lives here.)
 */
const channel = (): string =>
  localStorage.getItem('bento-packs-url') ?? 'https://bento.page/releases/slides'

export interface PackListing {
  lang: string
  label: string
  /** absolute, or relative to the channel */
  url: string
  /** app version the pack was built against, for display */
  version?: string
}

export type PackError = 'offline' | 'bad-pack' | 'wrong-app'

/** The block type carrying a pack inside a saved shell. */
export const PACK_BLOCK_TYPE = 'application/bento+lang'
const blockId = (lang: string) => `bento-lang-${lang}`

/** Packs destined for the file: those already in it, plus any staged since. */
const inFile = new Map<string, LanguagePack>()
/** Which of those were NOT in the file as loaded — i.e. need a save. */
const pending = new Set<string>()

/**
 * Read packs already embedded in this file and register them. Runs at boot
 * from the i18n facade, before the first t(): a deck that arrives carrying
 * Japanese must show Japanese immediately, offline, with nothing fetched.
 */
export function readPacksFromShell(): number {
  let n = 0
  for (const { body } of readShellBlocks(PACK_BLOCK_TYPE)) {
    try {
      const pack = JSON.parse(body) as LanguagePack
      if (pack?.lang && pack.strings && addPack(pack, 'slides')) {
        inFile.set(pack.lang, pack)
        n++
      }
    } catch {
      // a corrupt block must not stop the app booting — skip it
    }
  }
  return n
}

/**
 * How much of the app's CURRENT interface a pack actually covers.
 *
 * Measured, not inferred from the version number. A pack built for an older
 * release may still cover everything — if that release added no strings, the
 * version differs and nothing is missing — while a same-version pack could be
 * incomplete. What the reader cares about is how much English they will see,
 * so count that directly. PACKED's keys are exactly the strings the running
 * app asks for.
 */
export function packCoverage(pack: LanguagePack): { missing: number; total: number } {
  const keys = Object.keys(PACKED)
  let missing = 0
  for (const k of keys) if (!pack.strings[k]) missing++
  return { missing, total: keys.length }
}

/** Packs in the file, flagged if they are still waiting for a save. */
export function packsInFile(): Array<LanguagePack & { pending: boolean }> {
  return [...inFile.values()].map((p) => ({ ...p, pending: pending.has(p.lang) }))
}

/** Download and validate a pack. Does not decide where it goes. */
export async function fetchPack(listing: PackListing): Promise<LanguagePack | PackError> {
  const url = /^https?:/.test(listing.url) ? listing.url : `${channel()}/${listing.url}`
  let pack: LanguagePack
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return 'offline'
    pack = (await res.json()) as LanguagePack
  } catch {
    return 'offline' // no network, blocked, or not JSON
  }
  if (!pack?.lang || !pack.strings || typeof pack.strings !== 'object') return 'bad-pack'
  if (pack.app && pack.app !== 'slides') return 'wrong-app'
  return pack
}

/**
 * Put a pack in the file. Registers it immediately so the editor can use it
 * right away; the FILE gains it on the next save.
 *
 * Staged rather than written-on-click because on every browser without File
 * System Access "write" means silently downloading a second copy of the
 * user's deck — a surprising thing to do to someone who asked for a language.
 */
export function stageForFile(pack: LanguagePack): boolean {
  if (!pack?.lang || !pack.strings) return false
  if (!addPack(pack, 'slides')) return false
  inFile.set(pack.lang, pack)
  pending.add(pack.lang)
  return true
}

/** Take a pack out of the file — also applied on the next save. */
export function unstageFromFile(lang: string): boolean {
  if (!inFile.has(lang)) return false
  inFile.delete(lang)
  pending.add(lang)
  removePack(lang)
  return true
}

/** Everything staged has now been written — called after a successful save. */
export function markFileSaved(): void {
  pending.clear()
}

/** The blocks the kernel writes into every saved shell. */
export function shellBlocksForPacks(): ShellBlock[] {
  return [...inFile.values()].map((p) => ({
    id: blockId(p.lang),
    type: PACK_BLOCK_TYPE,
    body: JSON.stringify(p),
    attrs: { 'data-lang': p.lang },
  }))
}

/** The channel's whole index, unfiltered. [] if unpublished or unreachable. */
async function fetchIndex(): Promise<PackListing[]> {
  try {
    const res = await fetch(`${channel()}/packs.json`, { cache: 'no-store' })
    if (!res.ok) return []
    const list = (await res.json()) as PackListing[]
    return Array.isArray(list) ? list.filter((p) => p?.lang && p?.url) : []
  } catch {
    return []
  }
}

/**
 * Packs on offer from the release channel, minus those the file already has.
 * "Nothing to offer" is a normal state, not an error worth shouting about.
 */
export async function availablePacks(): Promise<PackListing[]> {
  return (await fetchIndex()).filter((p) => !inFile.has(p.lang))
}

/**
 * Bring this file's packs up to a new app version, called from the update
 * flow once the release is verified.
 *
 * WHY THIS EXISTS. A pack is written into the file at the version it was
 * built for and then never changes, while the app around it keeps updating.
 * Every release that adds UI strings makes that pack a little more
 * incomplete — the new strings fall back to English, per string, silently.
 * Over a few releases a fully translated deck drifts back toward English
 * with nothing to fix it. Update is the one moment we know the version
 * changed, and the packs are on the same signed channel, so it is also the
 * cheapest moment to put them right.
 *
 * Refusing to fail is the whole point: any pack we cannot re-fetch is simply
 * KEPT at its current version. Degraded beats absent.
 */
export async function refreshPacksForVersion(version: string): Promise<{ refreshed: string[]; kept: string[] }> {
  const refreshed: string[] = []
  const kept: string[] = []
  const langs = [...inFile.keys()]
  if (!langs.length) return { refreshed, kept }

  const index = await fetchIndex()
  for (const lang of langs) {
    const listing = index.find((p) => p.lang === lang)
    if (!listing) { kept.push(lang); continue }
    const got = await fetchPack(listing)
    if (typeof got === 'string' || got.lang !== lang) { kept.push(lang); continue }
    // Only replace with something actually built for the incoming version —
    // a channel still serving the old pack should leave the file untouched.
    if (got.version && version && got.version !== version) { kept.push(lang); continue }
    inFile.set(lang, got)
    addPack(got, 'slides')
    refreshed.push(lang)
  }
  return { refreshed, kept }
}
