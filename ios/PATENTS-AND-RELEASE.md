# 特許・権利の追加確認（2026-11-04）

## 判断

1935年のDarrowの米国特許が現在もゲーム方式を独占している、という状況ではない。ただし、**これを根拠に現行アプリ全体を商用配布してよいとは判断しない**。本ビルドは内部レビュー用。ストアへの提出・権利者への連絡は実施していない。

- 原公報 **US2,026,082「Board game apparatus」** は1935年12月31日発行。旧米国制度の原則は登録から17年であり、この歴史的特許の通常の満了は1952年12月31日。現在の「出願から20年」を1935年の特許へそのまま当てはめない。[原公報PDF](https://patentimages.storage.googleapis.com/8f/57/15/f84ec1a9b1bce9/US2026082.pdf)、[USPTOの存続期間説明](https://www.uspto.gov/patents/laws/patent-term-calculator)。Google PatentsのExpired表示は補助情報であって法的鑑定ではない。
- 後続技術まで不存在とはしていない。限定的キーワード検索（Hasbro / property trading / game）では **US20110115157A1 / US8328613B2「Game tower」** など後年の出願も見つかる。登録公報の独立請求項1・9・14は光源・筐体・凸面鏡・反射要素等を組み合わせた物理的装置／方法を記載する。現アプリにその光学装置はないため、この文献を単に「モノポリーを電子化すると侵害」と読むのは不適切。ただし他の請求項・均等論・他の特許を含む非侵害鑑定ではない。日本・米国・配布予定地域の有効な請求項、権利経過、ファミリーを網羅したFTO調査は未完了。[公開公報](https://patents.google.com/patent/US20110115157A1/en)、[登録公報・請求項](https://patents.google.com/patent/US8328613B2/en)
- 特許と商標・著作権・商品表示は別。Hasbroは名称、ロゴ、特徴的盤面、四隅等の権利を主張している。[Hasbro公式資料](https://www.hasbro.com/common/assets/image/Printables/dad288661c4311ddbd0b0800200c9a66/3BA69B8250569047F513A43FE38BE736/3BB6FBBA50569047F53476FB46A7ECAE.pdf)。名称や通貨だけの変更では解消したと扱わない。
- 米著作権局は遊びの方法と、説明文・図画等の表現を区別する。この説明は商標や他国法まで免除しない。[米著作権局](https://www.copyright.gov/register/tx-games.html)

## App Store前に残るもの

1. 現行40マス・価格体系・色組等を含む表現／外観の独自化、または対象市場での専門家確認と必要な許諾。新しい題名も正式商標調査は未実施。
2. 写真の商用用途、施設側条件、CC BY-SA／FALと配布条件の照合。特にUluru、Sydney Opera House、Taos Puebloについて既存報告の確認事項が残る。ライセンス表記があるだけで商用権利確認済みとはしない。
3. Apple Developerチームによる署名、実機、TestFlight、App Privacy・サポート情報・審査用メタデータ。現在のSwiftUI/WebKit構成が4.2の十分な機能性を満たすかは別審査。[Appleガイドライン](https://developer.apple.com/app-store/review/guidelines/)

詳しい写真・日本法・プライバシーの根拠は [既存出荷前レビュー](../docs/APPSTORE-READINESS.md)。同文書の「iOS成果物なし」「ソロ保存なし」は作成時点の記述で、現在の実装状況は本ディレクトリのREADMEを優先する。これは法律意見書や非侵害保証ではない。
