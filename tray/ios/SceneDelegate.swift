// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors

import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options: UIScene.ConnectionOptions) {
        guard let ws = scene as? UIWindowScene else { return }
        let w = UIWindow(windowScene: ws)
        w.rootViewController = DocumentBrowserViewController()
        w.makeKeyAndVisible()
        window = w
    }
}
