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

    /// A new deck is seeded from a bundled starter shell. That bundled copy is
    /// the ONLY Bento version the app ships, and it ages harmlessly: a new deck
    /// self-updates through the normal signed channel the first time it checks,
    /// so the seed drifting behind a release does not strand anyone.
    func documentBrowser(_ c: UIDocumentBrowserViewController,
                         didRequestDocumentCreationWithHandler handler:
                         @escaping (URL?, UIDocumentBrowserViewController.ImportMode) -> Void) {
        guard let seed = Bundle.main.url(forResource: "starter", withExtension: "bento.html") else {
            handler(nil, .none); return
        }
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent("Untitled.bento.html")
        try? FileManager.default.removeItem(at: tmp)
        do { try FileManager.default.copyItem(at: seed, to: tmp) } catch { handler(nil, .none); return }
        handler(tmp, .move)
    }

    func documentBrowser(_ c: UIDocumentBrowserViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else { return }
        openEditor(url)
    }

    func documentBrowser(_ c: UIDocumentBrowserViewController, didImportDocumentAt sourceURL: URL,
                         toDestinationURL destinationURL: URL) {
        openEditor(destinationURL)
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
