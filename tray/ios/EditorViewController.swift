// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors

import UIKit
import WebKit
import UniformTypeIdentifiers
import CryptoKit

/// Hosts one open deck in a WKWebView and bridges saving to UIDocument.
///
/// TWO decisions here carry the design:
///
/// 1. The document is served through a CUSTOM SCHEME, never `loadFileURL`. A
///    file:// page in WKWebView gets an opaque, unstable origin, which makes
///    localStorage and IndexedDB unreliable — that would silently break the
///    autosave backstop, the per-device collab member key, and the language and
///    reduce-motion preferences. A custom scheme is a stable secure origin, and
///    it keeps cross-origin fetches to the sync relay well-defined rather than
///    arriving as `Origin: null`.
///
///    The host is PER DOCUMENT, derived from the file's own path, not a single
///    shared `deck`. This app opens ANY self-contained HTML document, not only
///    Bento's, so a shared origin would let one document read another's
///    localStorage and IndexedDB — fine when every file is yours, a real leak
///    between unrelated third-party apps. Derived rather than random because
///    the origin IS the storage boundary: a fresh host per launch would wipe
///    that storage on every open. The trade is that moving or renaming a file
///    gives it a new origin and orphans its local state; that state is a
///    cache-and-backstop, never the document itself, which is why this is the
///    right way round.
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

    /// Stable per-document host: a truncated SHA-256 of the file's path. Hex
    /// only, so it is always a valid host component.
    private lazy var originHost: String = {
        let path = document.fileURL.standardizedFileURL.path
        let digest = SHA256.hash(data: Data(path.utf8))
        return digest.compactMap { String(format: "%02x", $0) }.joined().prefix(24).description
    }()

    /// Called when the user leaves the document. The browser owns teardown —
    /// closing the UIDocument and releasing the security scope — because it
    /// owns both of those.
    var onDone: (() -> Void)?

    init(document: BentoDocument) {
        self.document = document
        super.init(nibName: nil, bundle: nil)
    }

    @objc private func doneTapped() { onDone?() }

    /// Fallback exit for when the nav bar is hidden (landscape).
    ///
    /// Deliberately DARK, not a light translucent pill: the first attempt used
    /// 70%-white on Bento's white editor and was invisible on screen.
    ///
    /// Bottom-leading, not top-leading. Bento's editor occupies every top edge
    /// — logo, toolbar, thumbnail rail — so a control up there lands on the
    /// wordmark. Any host control overlaps SOMETHING while the page's own
    /// chrome is this dense; the bottom-left corner is the quietest, and it is
    /// where a thumb rests when a phone is held sideways.
    private lazy var floatingExit: UIButton = {
        let b = UIButton(type: .system)
        var cfg = UIButton.Configuration.filled()
        cfg.image = UIImage(systemName: "chevron.left",
                            withConfiguration: UIImage.SymbolConfiguration(weight: .semibold))
        cfg.cornerStyle = .capsule
        cfg.baseBackgroundColor = UIColor.label.withAlphaComponent(0.55)
        cfg.baseForegroundColor = .systemBackground
        cfg.contentInsets = .init(top: 10, leading: 12, bottom: 10, trailing: 12)
        b.configuration = cfg
        b.accessibilityLabel = NSLocalizedString("Documents", comment: "back to the file browser")
        b.addTarget(self, action: #selector(doneTapped), for: .touchUpInside)
        b.isHidden = true
        return b
    }()

    /// Hide the bar whenever height is scarce, and show the floating exit
    /// instead. Done EXPLICITLY: `hidesBarsWhenVerticallyCompact` was tried
    /// first and simply did not fire for a modally-presented navigation
    /// controller — the bar stayed put in landscape.
    private func syncChrome() {
        let short = traitCollection.verticalSizeClass == .compact
        navigationController?.setNavigationBarHidden(short, animated: false)
        floatingExit.isHidden = !short
        view.bringSubviewToFront(floatingExit)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        syncChrome()
    }

    override func traitCollectionDidChange(_ previous: UITraitCollection?) {
        super.traitCollectionDidChange(previous)
        if traitCollection.verticalSizeClass != previous?.verticalSizeClass { syncChrome() }
    }
    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidLoad() {
        super.viewDidLoad()
        let cfg = WKWebViewConfiguration()
        // Element fullscreen. iPhone SAFARI has never offered this to web pages,
        // which is why Bento's present mode falls back to filling its view — but
        // WKWebView exposes it as an opt-in, so a hosted document can present
        // properly where the same file in the browser cannot. (Spotted in #87.)
        cfg.preferences.isElementFullscreenEnabled = true
        cfg.setURLSchemeHandler(self, forURLScheme: "bento-tray")
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
        webView.load(URLRequest(url: URL(string: "bento-tray://\(originHost)/index.html")!))

        view.addSubview(floatingExit)
        floatingExit.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            floatingExit.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 10),
            floatingExit.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -10),
            // Explicit size rather than relying on intrinsic content size.
            floatingExit.widthAnchor.constraint(equalToConstant: 44),
            floatingExit.heightAnchor.constraint(equalToConstant: 44),
        ])

        // A way BACK. Presented full screen with no chrome, a document was a
        // one-way trip: full-screen modals have no interactive dismiss, so the
        // only exit was force-quitting the app. The host has to supply this
        // itself — it cannot ask the page for a close button without assuming
        // what the page is.
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            title: NSLocalizedString("Documents", comment: "back to the file browser"),
            style: .plain, target: self, action: #selector(doneTapped))
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
