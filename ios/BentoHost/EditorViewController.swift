// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors

import UIKit
import WebKit
import UniformTypeIdentifiers

/// Hosts one open deck in a WKWebView and bridges saving to UIDocument.
///
/// TWO decisions here carry the design:
///
/// 1. The deck is served through a CUSTOM SCHEME, never `loadFileURL`. A
///    file:// page in WKWebView gets an opaque, unstable origin, which makes
///    localStorage and IndexedDB unreliable — that would silently break the
///    autosave backstop, the per-device collab member key, and the language and
///    reduce-motion preferences. A custom scheme is a stable secure origin, and
///    it keeps cross-origin fetches to the sync relay well-defined rather than
///    arriving as `Origin: null`.
///
/// 2. The web content is the DOCUMENT'S OWN runtime. The app bundles no shell
///    for rendering and has no opinion about which version a deck carries, so a
///    deck self-updates through Bento's normal signed channel and iOS users get
///    the same release as everyone else on the same day — no App Store
///    submission per release, no drift. What the app ships is file access.
final class EditorViewController: UIViewController, WKScriptMessageHandler, WKURLSchemeHandler {
    private let document: BentoDocument
    private var webView: WKWebView!

    /// Has the open document been handed to the web app yet? Bento only reaches
    /// a picker when it holds no handle — afterwards ⌘S, autosave write-back and
    /// in-place update all reuse it. So the FIRST request targets this document
    /// and needs no UI; any later one is a genuine Save-As or export and must
    /// not overwrite it. Comparing filenames instead would fail: Bento derives
    /// its suggested name from the deck TITLE, so it rarely matches.
    private var openDocumentVended = false
    private var pendingExportName: String?

    init(document: BentoDocument) {
        self.document = document
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidLoad() {
        super.viewDidLoad()
        let cfg = WKWebViewConfiguration()
        cfg.setURLSchemeHandler(self, forURLScheme: "bento-app")
        cfg.userContentController.add(self, name: "bentoFile")

        // .atDocumentStart is required, not stylistic: Bento decides whether it
        // can save during boot, so a bridge injected later arrives after the
        // editor has already concluded it cannot.
        if let js = Bundle.main.url(forResource: "bridge", withExtension: "js"),
           let src = try? String(contentsOf: js, encoding: .utf8) {
            cfg.userContentController.addUserScript(
                WKUserScript(source: src, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }

        webView = WKWebView(frame: view.bounds, configuration: cfg)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.allowsBackForwardNavigationGestures = false
        view.addSubview(webView)
        webView.load(URLRequest(url: URL(string: "bento-app://deck/index.html")!))
    }

    // MARK: - serving the deck

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        let resp = HTTPURLResponse(url: task.request.url!, statusCode: 200, httpVersion: "HTTP/1.1",
                                   headerFields: ["Content-Type": "text/html; charset=utf-8",
                                                  "Content-Length": String(document.html.count)])!
        task.didReceive(resp)
        task.didReceive(document.html)
        task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    // MARK: - the save bridge

    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let m = message.body as? [String: Any],
              let id = m["id"] as? Int, let op = m["op"] as? String else { return }

        switch op {
        case "begin":
            if !openDocumentVended {
                openDocumentVended = true
                reply(id, ok: true, value: document.fileURL.lastPathComponent)
            } else {
                // A copy/template/read-only export. Ask where it goes; it must
                // never land on the open document.
                pendingExportName = (m["suggestedName"] as? String) ?? "deck.bento.html"
                reply(id, ok: true, value: pendingExportName!)
            }

        case "write":
            let text = (m["text"] as? String) ?? ""
            let name = (m["name"] as? String) ?? ""
            if name == document.fileURL.lastPathComponent {
                document.html = Data(text.utf8)
                // updateChangeCount + autosave is the sanctioned path: it
                // coordinates with iCloud and file coordination rather than
                // writing behind UIDocument's back.
                document.updateChangeCount(.done)
                document.save(to: document.fileURL, for: .forOverwriting) { [weak self] ok in
                    self?.reply(id, ok: ok, value: ok ? nil : "write failed")
                }
            } else {
                exportCopy(named: name, text: text) { [weak self] ok, err in
                    self?.reply(id, ok: ok, value: err)
                }
            }

        default:
            reply(id, ok: false, value: "unknown op")
        }
    }

    private func reply(_ id: Int, ok: Bool, value: String?) {
        let arg = value.map { "\"\($0.replacingOccurrences(of: "\"", with: "\\\""))\"" } ?? "null"
        webView.evaluateJavaScript("window.__bentoNativeReply(\(id), \(ok), \(arg))")
    }

    /// Write an exported copy to a temp file and let the user place it. Kept
    /// separate from the open document on purpose — a share export carries
    /// different credentials (a read-only copy has the owner keys stripped), so
    /// overwriting the original with one would be a real data loss.
    private func exportCopy(named name: String, text: String, done: @escaping (Bool, String?) -> Void) {
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        do { try Data(text.utf8).write(to: tmp) } catch { done(false, "\(error)"); return }
        let picker = UIDocumentPickerViewController(forExporting: [tmp], asCopy: true)
        present(picker, animated: true) { done(true, nil) }
    }
}
