import Foundation
import Network

/// Stable loopback origin preserves WKWebView saves and supports ES modules/Web Locks.
final class LocalServer: @unchecked Sendable {
    private var listener: NWListener?
    private let queue = DispatchQueue(label: "heritage.loopback")
    private let root = Bundle.main.url(forResource: "Web", withExtension: nil)!
    func start(completion: @escaping @Sendable (String?) -> Void) {
        do {
            let params = NWParameters.tcp
            params.requiredLocalEndpoint = .hostPort(host: "127.0.0.1", port: 18761)
            let listener = try NWListener(using: params)
            self.listener = listener
            listener.stateUpdateHandler = { state in
                switch state {
                case .ready: completion(nil)
                case .failed(let error): completion(error.localizedDescription)
                default: break
                }
            }
            listener.newConnectionHandler = { [weak self] connection in
                guard let self else { connection.cancel(); return }
                connection.start(queue: self.queue)
                self.receive(connection, accumulated: Data())
                self.queue.asyncAfter(deadline: .now() + 10) { connection.cancel() }
            }
            listener.start(queue: queue)
        } catch { completion(error.localizedDescription) }
    }
    private func receive(_ connection: NWConnection, accumulated: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] data, _, complete, error in
            guard let self else { return }
            var buffer = accumulated
            if let data { buffer.append(data) }
            guard buffer.count <= 16384 else { connection.cancel(); return }
            if let text = String(data: buffer, encoding: .utf8), text.contains("\r\n\r\n") {
                self.respond(connection, request: text)
            } else if !complete && error == nil { self.receive(connection, accumulated: buffer) }
            else { connection.cancel() }
        }
    }
    private func respond(_ connection: NWConnection, request: String) {
        let tokens = request.components(separatedBy: "\r\n")[0].split(separator: " ")
        guard tokens.count >= 2, ["GET", "HEAD"].contains(String(tokens[0])) else { connection.cancel(); return }
        let raw = String(tokens[1]).components(separatedBy: "?")[0]
        guard let path = raw.removingPercentEncoding, !path.contains("\0"), !path.split(separator: "/").contains("..") else { connection.cancel(); return }
        let relative = path.hasSuffix("/") ? path + "index.html" : path
        let url = root.appendingPathComponent(relative.trimmingCharacters(in: CharacterSet(charactersIn: "/"))).standardizedFileURL
        guard url.path.hasPrefix(root.path + "/") else { connection.cancel(); return }
        let data = try? Data(contentsOf: url)
        let body = data ?? Data("Not found".utf8)
        let mime = ["html":"text/html; charset=utf-8", "js":"text/javascript; charset=utf-8", "css":"text/css; charset=utf-8", "jpg":"image/jpeg", "png":"image/png", "svg":"image/svg+xml", "json":"application/json", "txt":"text/plain; charset=utf-8"][url.pathExtension] ?? "application/octet-stream"
        var response = Data("HTTP/1.1 \(data == nil ? "404 Not Found" : "200 OK")\r\nContent-Type: \(mime)\r\nContent-Length: \(body.count)\r\nCache-Control: no-cache\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n\r\n".utf8)
        if tokens[0] != "HEAD" { response.append(body) }
        connection.send(content: response, completion: .contentProcessed { _ in connection.cancel() })
    }
}
