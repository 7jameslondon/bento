// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
//
// The ENTIRE web-side surface of the iOS host: a polyfill of the one File
// System Access call Bento tests for. Injected at .atDocumentStart, because
// capability is read during boot — inject it later and the editor has already
// decided it cannot save.
//
// Bento needs exactly this much of the API (kernel/src/save.ts):
//   showSaveFilePicker({suggestedName}) -> { name, createWritable() }
//   createWritable() -> { write(Blob|string), close() }
// ...and hasFsAccess() is just `typeof window.showSaveFilePicker === 'function'`.
//
// That is why the app needs NO changes to Bento and works with decks saved by
// any past version: every in-place path (⌘S, autosave write-back, self-update)
// already routes through this one function. A bespoke `window.__bentoHost`
// bridge would only have helped decks re-saved after it shipped.
(function () {
  const bridge = window.webkit && window.webkit.messageHandlers
    && window.webkit.messageHandlers.bentoFile
  if (!bridge) return // plain browser: leave the real API (or its absence) alone

  let seq = 0
  const pending = new Map()

  // native calls back into this
  window.__bentoNativeReply = (id, ok, value) => {
    const p = pending.get(id)
    if (!p) return
    pending.delete(id)
    ok ? p.resolve(value) : p.reject(new Error(value || 'cancelled'))
  }

  const call = (op, payload) => new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    bridge.postMessage(Object.assign({ id, op }, payload))
  })

  window.showSaveFilePicker = async (opts) => {
    const want = (opts && opts.suggestedName) || ''
    // Native decides what this call targets; the rule is DETERMINISTIC and lives
    // there, not here. Bento only reaches a picker when it holds no handle —
    // once it has one, ⌘S, autosave write-back and in-place update all reuse it
    // (kernel/src/save.ts). So the FIRST call is "the document already open in
    // the app" and resolves with no UI, and any LATER call is a genuine Save-As
    // or export (read-only copy, invite, template) that must not overwrite it.
    //
    // Do NOT try to infer this by comparing suggestedName to the open file:
    // Bento derives that name from the DECK TITLE, so it rarely matches the
    // filename and every save would wrongly prompt.
    const name = await call('begin', { suggestedName: want })
    return {
      name,
      createWritable: async () => {
        const parts = []
        return {
          async write(data) {
            parts.push(typeof data === 'string' ? data : await data.text())
          },
          async close() {
            await call('write', { name, text: parts.join('') })
          },
        }
      },
    }
  }
})()
