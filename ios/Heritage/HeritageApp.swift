import SwiftUI
import WebKit
import SafariServices

@main
struct HeritageApp: App {
    var body: some Scene { WindowGroup { GameScreen() } }
}
@MainActor
final class GameHost: ObservableObject {
    @Published var ready = false
    @Published var error: String?
    let server = LocalServer()
    init() {
        server.start { [weak self] error in
            Task { @MainActor in self?.error = error; self?.ready = error == nil }
        }
    }
}
struct GameScreen: View {
    @StateObject private var host = GameHost()
    @State private var loading = true
    @State private var webError: String?
    var body: some View {
        ZStack {
            Color(red: 0.96, green: 0.95, blue: 0.91).ignoresSafeArea()
            if host.ready {
                GameWebView(loading: $loading, error: $webError)
                if loading { ZStack { Color(red: 0.96, green: 0.95, blue: 0.91); ProgressView("ゲームを読み込み中…") } }
                if let webError { ContentUnavailableView("読み込めませんでした", systemImage: "exclamationmark.triangle", description: Text(webError)) }
            }
            else if let error = host.error {
                ContentUnavailableView("ゲームを起動できません", systemImage: "wifi.exclamationmark", description: Text("アプリを開き直してください。\n\(error)"))
            } else { ProgressView("旅の準備中…") }
        }
    }
}
struct GameWebView: UIViewRepresentable {
    @Binding var loading: Bool
    @Binding var error: String?
    func makeCoordinator() -> Coordinator { Coordinator(loading: $loading, error: $error) }
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.isOpaque = false
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.accessibilityIdentifier = "heritageGame"
        #if DEBUG
        view.isInspectable = true
        #endif
        view.load(URLRequest(url: URL(string: "http://127.0.0.1:18761/estates/")!))
        return view
    }
    func updateUIView(_ view: WKWebView, context: Context) {}
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        @Binding var loading: Bool
        @Binding var error: String?
        init(loading: Binding<Bool>, error: Binding<String?>) { _loading = loading; _error = error }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { loading = false }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError failure: Error) { error = failure.localizedDescription; loading = false }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError failure: Error) { error = failure.localizedDescription; loading = false }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { error = "表示処理が停止しました。アプリを開き直してください。CPU対戦は保存から再開できます。"; loading = false }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "http", url.host == "127.0.0.1", url.port == 18761 { decisionHandler(.allow); return }
            decisionHandler(.cancel)
            if action.navigationType == .linkActivated, ["https", "http"].contains(url.scheme ?? "") { present(url, from: webView) }
        }
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url, ["https", "http"].contains(url.scheme ?? "") { present(url, from: webView) }
            return nil
        }
        private func present(_ url: URL, from view: WKWebView) {
            guard let controller = view.window?.rootViewController, controller.presentedViewController == nil else { return }
            controller.present(SFSafariViewController(url: url), animated: true)
        }
    }
}
