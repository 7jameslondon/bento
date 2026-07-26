// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Installing and removing language packs at runtime (docs/i18n-packs.md).
//
// WHERE AN INSTALLED PACK LIVES. In localStorage, not in the document.
// PLATFORM.md §3 is explicit that language never enters the document format —
// a deck authored in Tokyo opens with French chrome in Paris — and the locale
// preference itself is already a per-browser setting. A pack is the same kind
// of thing: it belongs to the reader, not to the file.
//
// That also makes install cheap and reversible: no shell re-splice, no new
// file, no touching a document the user may not even own. Making a pack travel
// WITH a file is a separate, heavier operation (re-splice on save) and is not
// what "add a language" should mean.
//
// Packs are ~60KB of JSON each. localStorage gives a few MB, so a handful is
// fine; a quota failure is caught and surfaced rather than left to throw.

import { addPack, removePack, type LanguagePack } from '../../kernel/src/i18n.ts'

/** Installed packs, keyed by language. */
const KEY = 'bento-packs'
/**
 * Where the release channel publishes the pack index and the packs.
 * Dev override: localStorage 'bento-packs-url' — the same convention the
 * updater uses for 'bento-update-url', so a local channel can be pointed at
 * without a rebuild.
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

type Store = Record<string, LanguagePack>

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {} // corrupt or unavailable — behave as if nothing is installed
  }
}

function write(s: Store): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
    return null
  } catch {
    // quota is the realistic failure: a pack is ~60KB and the budget is shared
    return 'no-space'
  }
}

/**
 * Re-register everything previously installed. Called at boot from the i18n
 * facade, BEFORE the first t() — same reason the facade owns registration.
 */
export function restoreInstalledPacks(): number {
  const s = read()
  let n = 0
  for (const pack of Object.values(s)) {
    if (addPack(pack, 'slides')) n++
  }
  return n
}

/** Languages installed from a pack on this browser. */
export function installedPacks(): LanguagePack[] {
  return Object.values(read())
}

/**
 * Fetch and install a pack. Returns null on success, else a reason the caller
 * can turn into a sentence (t() must run at display time, so no text crosses
 * this boundary — same contract as SyncNotice).
 */
export async function installPack(listing: PackListing): Promise<null | 'offline' | 'bad-pack' | 'wrong-app' | 'no-space'> {
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
  if (!addPack(pack, 'slides')) return 'wrong-app'

  const s = read()
  s[pack.lang] = pack
  const err = write(s)
  if (err) {
    // registered but not persisted: it works now and is gone after a reload.
    // Better to say so than to pretend it stuck.
    return 'no-space'
  }
  return null
}

/** Remove an installed pack and forget it. */
export function uninstallPack(lang: string): boolean {
  const s = read()
  if (!s[lang]) return false
  delete s[lang]
  write(s)
  removePack(lang)
  return true
}

/**
 * Packs on offer from the release channel, minus the ones already installed.
 * Returns [] when the index isn't published yet or the network is unavailable
 * — "no packs to offer" is a normal state, not an error worth shouting about.
 */
export async function availablePacks(): Promise<PackListing[]> {
  try {
    const res = await fetch(`${channel()}/packs.json`, { cache: 'no-store' })
    if (!res.ok) return []
    const list = (await res.json()) as PackListing[]
    if (!Array.isArray(list)) return []
    const have = new Set(Object.keys(read()))
    return list.filter((p) => p?.lang && p?.url && !have.has(p.lang))
  } catch {
    return []
  }
}
