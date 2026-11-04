# 世界遺産トラベル — iOS検証版

SwiftUI + WKWebView の独立iOSアプリ。ペットゲームは含めません。既存JSのルール・演出・CPU・保存を同梱し、Swiftによるローカル配信と外部リンク表示で動かします。Swiftへの全ルール移植ではありません。公開Webサイトを開くだけのアプリではなく、ゲームと写真はオフライン同梱です。

[画面操作で遊ぶ手順](PLAY-IN-SIMULATOR.md) · [権利対応の実施状況](rights/README.md)

## 起動

Xcode 26.2で作成、iOS 17以上を対象（最低OSの実機検証は未実施）。追加の有料ライブラリ不要。

```sh
cd /path/to/night-arcade
python3 ios/scripts/sync-web.py
open ios/Heritage.xcodeproj
```

`Heritage` scheme と iPhone Simulator を選んで Run。プロジェクトは共有schemeを同梱。再生成が必要な時だけ `python3 ios/scripts/create-project.py` を使います。

- 同梱元は `ios/SOURCE_REVISION` のコミットに固定。自動改善中の未確定ファイルを混ぜません。
- `Resources/Web` は生成物。元コミットとスクリプトから再現できます。ネイティブ向け差分は招待URL・案内・プライバシー文言のみで、ルールエンジンは変更しません。
- 招待リンクは公開Web版のURLを使い、端末内127.0.0.1のURLを友だちに送りません。
- アプリのコンパスアイコンは独自の図形コードから生成した不透明1024px画像です。
- 保存はアプリの永続WKWebViewストレージ。ブラウザ版の保存を勝手に移行・上書きしません。アプリ削除時は保存も失われます。
- 127.0.0.1:18761だけで静的ファイルを配信。LANへサーバーを公開しません。ES modulesとWeb Locks、および再起動しても同じ保存originを保つための構成です。
- CPU対戦は通信不要。友達との対戦は従来のPeerJS/WebRTCを使用しネット接続が必要。iOS実機／携帯回線・復帰の品質は別途確認が必要です。
- 外部の写真原典やライセンスはSafariの画面に開き、元ゲームを保持します。

## 署名と配布

シミュレーターは `CODE_SIGNING_ALLOWED=NO` でビルドできます。実機やTestFlightは開発者自身のApple Developer TeamをSigning & Capabilitiesで設定し、固有Bundle ID／プロビジョニングを用意してください。秘密鍵や証明書はリポジトリに含めません。

これは審査提出済み・商用権利確認済み・全機能Swift移植済みという意味ではありません。[特許・権利レポート](PATENTS-AND-RELEASE.md) と既存の出荷前レビューを確認してください。単にSwiftで包むことはAppleの4.1/4.2/5.2への解決策ではありません。

## 検証コマンド

専用シミュレーターUUIDを使用（個人の端末を初期化しない）。

```sh
xcodebuild -project ios/Heritage.xcodeproj -scheme Heritage \
  -destination 'platform=iOS Simulator,id=YOUR_REVIEW_SIMULATOR_UUID' \
  -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/Heritage.xcodeproj -scheme Heritage \
  -destination 'platform=iOS Simulator,id=YOUR_REVIEW_SIMULATOR_UUID' \
  -derivedDataPath ios/build -resultBundlePath ios/Review.xcresult \
  -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO test
```

結果バンドルは毎回新しい名前にします。UIテストは実際のCPUボタン・サイコロ・再起動復帰を操作します。専用シミュレーター内のテスト用保存は、画面の「新しく始める（保存を置換）」で置換します。個人の端末・ブラウザ保存を削除しません。実機での音質、低メモリ、ロック復帰、VoiceOver、iPad、異なるネットワーク間対戦はシミュレーター成功だけで合格扱いしません。

## 実機用アーカイブ

```sh
xcodebuild -project ios/Heritage.xcodeproj -scheme Heritage \
  -destination 'generic/platform=iOS' -derivedDataPath ios/device-build \
  -archivePath ios/build/Heritage.xcarchive CODE_SIGNING_ALLOWED=NO archive
```

この未署名アーカイブはビルド確認用で、そのまま端末へインストール／App StoreへアップロードできるIPAではありません。配布時は正しいDeveloper Teamとプロビジョニングで署名したアーカイブを作り直します。開発証明書の存在だけで、配布権限・契約・App Store Connectの設定が済んでいるとは扱いません。
