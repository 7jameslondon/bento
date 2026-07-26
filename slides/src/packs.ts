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
const BLOCK_TYPE = 'application/bento+lang'
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
  for (const { body } of readShellBlocks(BLOCK_TYPE)) {
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
    type: BLOCK_TYPE,
    body: JSON.stringify(p),
    attrs: { 'data-lang': p.lang },
  }))
}

/**
 * Packs on offer from the release channel, minus those the file already has.
 * Returns [] when the index isn't published yet or the network is unavailable
 * — "no packs to offer" is a normal state, not an error worth shouting about.
 */
export async function availablePacks(): Promise<PackListing[]> {
  try {
    const res = await fetch(`${channel()}/packs.json`, { cache: 'no-store' })
    if (!res.ok) return []
    const list = (await res.json()) as PackListing[]
    if (!Array.isArray(list)) return []
    return list.filter((p) => p?.lang && p?.url && !inFile.has(p.lang))
  } catch {
    return []
  }
}
