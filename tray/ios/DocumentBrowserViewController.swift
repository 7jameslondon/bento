// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors

import UIKit

/// The app's root: the system document browser. Opening IN PLACE is the whole
/// point — the user picks a deck wherever it already lives (Files, iCloud,
/// Dropbox, a Downloads folder) and edits travel back to that same file.
final class DocumentBrowserViewController: UIDocumentBrowserViewController,
                                           UIDocumentBrowserViewControllerDelegate {
    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self
        allowsDocumentCreation = true
        allowsPickingMultipleItems = false
    }

    /// A new document is seeded from the bundled starter shell.
    ///
    /// The document is placed OURSELVES and handed back with `.none` ("already
    /// in its final location") rather than handing the browser a temp file to
    /// import. Two reasons, both found by testing on iOS 26:
    ///
    /// 1. `didImportDocumentAt` IS NEVER CALLED for the creation flow. The
    ///    creation handler fires and the file lands correctly, but the delegate
    ///    callback never arrives — so the editor never opened and "+" appeared
    ///    to do nothing while silently creating files. Placing the file means we
    ///    hold the URL and can open it directly, depending on no callback.
    /// 2. Naming collisions become ours to control. Letting the system rename
    ///    produced "Untitled.bento 2.html", because it reads `.bento.html` as
    ///    the name "Untitled.bento" plus extension "html" and inserts the
    ///    counter before the last extension only. Ours reads "Untitled 2".
    ///
    /// The bundled seed is the only Bento version this app ships and it ages
    /// harmlessly: a new document self-updates through the normal signed
    /// channel the first time it checks.
    func documentBrowser(_ c: UIDocumentBrowserViewController,
                         didRequestDocumentCreationWithHandler handler:
                         @escaping (URL?, UIDocumentBrowserViewController.ImportMode) -> Void) {
        guard let seed = Bundle.main.url(forResource: "starter", withExtension: "bento.html"),
              let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
        else { handler(nil, .none); return }

        var dest = docs.appendingPathComponent("Untitled.bento.html")
        var n = 2
        while FileManager.default.fileExists(atPath: dest.path) {
            dest = docs.appendingPathComponent("Untitled \(n).bento.html")
            n += 1
        }
        do { try FileManager.default.copyItem(at: seed, to: dest) } catch { handler(nil, .none); return }

        handler(dest, .none)
        // Next runloop: the browser is mid-transition when the handler returns,
        // and presenting into that animation is how a present() silently fails.
        DispatchQueue.main.async { [weak self] in self?.openEditor(dest) }
    }

    /// Still implemented for documents imported from ELSEWHERE (dragged in,
    /// opened from another app) — that path does deliver the callback.
    func documentBrowser(_ c: UIDocumentBrowserViewController, didImportDocumentAt sourceURL: URL,
                         toDestinationURL destinationURL: URL) {
        openEditor(destinationURL)
    }

    func documentBrowser(_ c: UIDocumentBrowserViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else { return }
        openEditor(url)
    }

    private func openEditor(_ url: URL) {
        // Security-scoped access: a document opened in place lives outside the
        // app container, so the URL must be scoped for the whole editing
        // session and released when the editor closes.
        let scoped = url.startAccessingSecurityScopedResource()
        let doc = BentoDocument(fileURL: url)
        doc.open { [weak self] ok in
            guard let self, ok else {
                if scoped { url.stopAccessingSecurityScopedResource() }
                return
            }
            let editor = EditorViewController(document: doc)
            editor.modalPresentationStyle = .fullScreen
            self.present(editor, animated: true)
        }
    }
}
