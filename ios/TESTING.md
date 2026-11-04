# iOS検証記録

2026-11-04 / Xcode26.2 (17C52) / iOS26.2 (23C54)
専用端末: Heritage-iOS-Review / 0A9E1BBF-C20A-4509-9A46-88C2C447AC4C
同梱コミット: SOURCE_REVISION参照。個人の既存シミュレーター／保存データは使用していない。

- unsigned generic iOS Release archive: **ARCHIVE SUCCEEDED**, exit 0。`build/Heritage.xcarchive`。署名・インストール可能IPAではない。
- unsigned Simulator build: **BUILD SUCCEEDED**, exit 0
- 最終 XCTest: `TestResults-05.xcresult`、**TEST SUCCEEDED**, exit 0。2 tests / 0 failures / 0 skips。
  - 通信: 実際のPeerJS接続でルーム作成 → 待機表示 → 招待URLが公開HTTPS版であることを検証。
  - ソロ: 専用端末名ガード → 既存テスト保存がある場合は実際の新規開始操作 → サイコロ → 表示結果を取得 → 終了・再起動 → 続きから → 同じ結果を検証。今回の出目3+2=5、東の鉄道への移動を画像でも確認。
- 検証画像: `build/pass-05/E1E8BD13-0AD3-4098-8AAF-30026F829773.png`（xcresultから書き出し、目視確認済み）。
- 途中の失敗も保持: 01は初回ロード時の操作確認失敗。03/04は以前の保存が手番終了段階なのに最初からサイコロボタンが出ると想定していたテスト前提の誤り。専用端末のテスト保存だけをUIで新規開始し、結果を観測するテストへ修正。02の弱い確認だけを最終証拠にはしていない。
- 実機署名、TestFlight、App Store提出: 未実施
- ネイティブ通信ルーム作成と公開URL生成: XCTestで成功。対戦相手と実際に複数人で遊ぶ検証、携帯回線、iOS17、iPad、VoiceOver、音の実聴: 未検証
- 接続可能な実機: devicectlの登録端末はすべてunavailable。Apple Development証明書は存在するが、配布チーム選択・署名・App Store Connect連携は未実施。
