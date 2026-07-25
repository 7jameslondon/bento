// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Boot sequence for bento/spaces. Order matters: configure the app, then
// capture the pristine document BEFORE any DOM mutation — the captured copy
// is what gets re-serialized on save.
//
// SCAFFOLD: this is the reference wiring for a Bento app, deliberately small
// enough to read in one sitting. It exercises every kernel seam — app config,
// self-save, encryption-aware serialization, autosave/recovery, i18n, signed
// updates, the AI round-trip surface — so a new app can be grown from here
// rather than assembled from guesses. See docs/PLATFORM.md §10.

import './styles.css'
import { configureApp, appConfig } from '../../kernel/src/app.ts'
import {
  capturePristine, readEmbeddedDoc, serializeFile, serializeAuto,
  saveFile, parseEnvelope,
} from '../../kernel/src/save.ts'
import { putRecovery, getRecovery, clearRecovery, pruneOld } from '../../kernel/src/autosave.ts'
import { APP_VERSION } from '../../kernel/src/update.ts'
import { t } from './i18n'
import { parseDoc, starterDoc, docContentKey, uid, type SpacesDoc } from './model'

configureApp({
  appId: 'bento-spaces',
  appName: 'bento/spaces',
  manifestUrl: 'https://bento.page/releases/spaces/manifest.json',
})

capturePristine()

const embedded = readEmbeddedDoc()
// Encrypted files use the same bento/enc envelope as every Bento app; the
// scaffold has no password UI yet, so it reports rather than pretending.
if (embedded && parseEnvelope(embedded)) {
  document.body.innerHTML =
    `<div class="sp-gate"><h1>${t('This file is encrypted.')}</h1>` +
    `<p>${t('Password unlocking is not implemented in this build yet.')}</p></div>`
} else {
  boot((embedded && parseDoc(embedded)) || starterDoc())
}

function boot(doc: SpacesDoc) {
  document.title = `${doc.title} — ${appConfig().appName}`
  document.getElementById('bento-splash')?.remove()

  const app = document.getElementById('app')!
  app.innerHTML =
    `<header class="sp-bar">` +
    `<span class="sp-mark">bento<span>/</span>spaces</span>` +
    `<input class="sp-title" value="">` +
    `<button class="sp-save">${t('Save')}</button>` +
    `<span class="sp-ver">v${APP_VERSION}</span>` +
    `</header><main class="sp-doc"></main>`

  const titleInput = app.querySelector<HTMLInputElement>('.sp-title')!
  const main = app.querySelector<HTMLElement>('.sp-doc')!
  titleInput.value = doc.title

  let saveTimer: number | undefined
  /** Debounced autosave — a recovery snapshot survives a crash or tab close. */
  const touch = () => {
    doc.modified = new Date().toISOString()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void putRecovery(doc), 2500) as unknown as number
  }

  const render = () => {
    main.innerHTML = ''
    for (const block of doc.blocks) {
      const el = document.createElement('p')
      el.className = 'sp-block'
      el.contentEditable = 'true'
      el.textContent = block.text
      el.dataset.id = block.id
      el.addEventListener('input', () => {
        block.text = el.textContent ?? ''
        touch()
      })
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          const at = doc.blocks.indexOf(block)
          const fresh = { id: uid(), text: '' }
          doc.blocks.splice(at + 1, 0, fresh)
          touch()
          render()
          focusBlock(fresh.id)
        } else if (e.key === 'Backspace' && !el.textContent && doc.blocks.length > 1) {
          e.preventDefault()
          const at = doc.blocks.indexOf(block)
          doc.blocks.splice(at, 1)
          touch()
          render()
          focusBlock(doc.blocks[Math.max(0, at - 1)]?.id)
        }
      })
      main.appendChild(el)
    }
  }

  const focusBlock = (id?: string) => {
    if (!id) return
    const el = main.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  titleInput.addEventListener('input', () => {
    doc.title = titleInput.value || 'Untitled'
    document.title = `${doc.title} — ${appConfig().appName}`
    touch()
  })

  const save = async () => {
    const res = await saveFile(doc)
    if (res !== 'cancelled') void clearRecovery(doc.docId)
  }
  app.querySelector('.sp-save')!.addEventListener('click', () => void save())
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      void save()
    }
  })

  render()
  void checkRecovery()
  void pruneOld()

  /** If the last autosaved snapshot differs from the file we loaded, the
   *  previous session ended before a save — offer it back. */
  async function checkRecovery() {
    const snap = await getRecovery(doc.docId)
    if (!snap) return
    let prev: SpacesDoc | null = null
    try {
      prev = parseDoc(snap.json)
    } catch {
      return
    }
    if (!prev || docContentKey(prev) === docContentKey(doc)) return
    const bar = document.createElement('div')
    bar.className = 'sp-recover'
    bar.innerHTML = `<span>${t('Unsaved changes from your last session were found.')}</span>`
    const restore = document.createElement('button')
    restore.textContent = t('Restore')
    restore.addEventListener('click', () => {
      doc = prev!
      titleInput.value = doc.title
      render()
      bar.remove()
    })
    const discard = document.createElement('button')
    discard.textContent = t('Discard')
    discard.addEventListener('click', () => {
      void clearRecovery(doc.docId)
      bar.remove()
    })
    bar.append(restore, discard)
    document.body.appendChild(bar)
  }

  // AI/tooling round-trip (docs/PLATFORM.md §7): the document JSON is the
  // interchange unit, so agents can read and replace it without the file.
  ;(window as any).bento = {
    format: doc.format,
    get doc() {
      return doc
    },
    serialize: () => serializeFile(doc),
    serializeAuto: () => serializeAuto(doc),
    loadDoc(json: string): boolean {
      const next = parseDoc(json)
      if (!next) return false
      doc = next
      titleInput.value = doc.title
      document.title = `${doc.title} — ${appConfig().appName}`
      render()
      touch()
      return true
    },
  }
}
