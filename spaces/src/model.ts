// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// The bento/spaces document model. This JSON is what lives inside the
// #bento-doc block — the format IS the product (docs/PLATFORM.md §3).
//
// SCAFFOLD: deliberately minimal — a flat list of text blocks. The real app
// grows a nested block tree, rich text, embeds and references. Grow it
// ADDITIVELY: every future version must still open documents written by this
// one, and unknown fields must be preserved rather than stripped.

export const FORMAT = 'bento/spaces'
export const FORMAT_VERSION = 1

export interface Block {
  id: string
  /** Plain text for now; rich inline content comes later, additively. */
  text: string
}

export interface SpacesDoc {
  format: typeof FORMAT
  version: number
  /** Stable uuid, minted once and NEVER regenerated — the kernel envelope
   *  keys autosave/recovery and (later) sync on it. */
  docId: string
  title: string
  modified?: string
  blocks: Block[]
  /** Anything a newer version wrote that this one doesn't understand is
   *  carried through untouched — see parseDoc. */
  [extra: string]: unknown
}

export const uid = (p = 'b'): string =>
  `${p}-${Math.random().toString(36).slice(2, 10)}`

const newDocId = (): string =>
  (globalThis.crypto?.randomUUID?.() ?? uid('doc'))

/**
 * Parse + validate a document from the data block. Returns null if this is
 * not a bento/spaces document at all. Forward-compatible on purpose: unknown
 * top-level fields survive the round-trip, and a missing docId is minted
 * rather than treated as fatal.
 */
export function parseDoc(json: string): SpacesDoc | null {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  if (d.format !== FORMAT || !Array.isArray(d.blocks)) return null
  return {
    ...d,
    format: FORMAT,
    version: typeof d.version === 'number' ? d.version : FORMAT_VERSION,
    docId: typeof d.docId === 'string' && d.docId ? d.docId : newDocId(),
    title: typeof d.title === 'string' ? d.title : 'Untitled',
    blocks: (d.blocks as unknown[]).map((b, i) => {
      const blk = (b ?? {}) as Record<string, unknown>
      return {
        ...blk,
        id: typeof blk.id === 'string' && blk.id ? blk.id : uid(`b${i}`),
        text: typeof blk.text === 'string' ? blk.text : '',
      } as Block
    }),
  } as SpacesDoc
}

/** What a freshly built bento/spaces file opens with. */
export function starterDoc(): SpacesDoc {
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    docId: newDocId(),
    title: 'Untitled space',
    blocks: [
      { id: uid(), text: 'This whole page — the text, the editor, the app — is one HTML file.' },
      { id: uid(), text: 'Type to edit. ⌘S saves the file back to disk, with your writing inside it.' },
      { id: uid(), text: 'Press ⏎ at the end of a block to add another; ⌫ on an empty block removes it.' },
    ],
  }
}

/** The content that matters for "did this change" — excludes volatile fields
 *  (modified) that churn without a real edit. Per-app by design: the kernel
 *  must not know what counts as content here (docs/PLATFORM.md §9). */
export function docContentKey(doc: SpacesDoc): string {
  return JSON.stringify([doc.title, doc.blocks])
}
