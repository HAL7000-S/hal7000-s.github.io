# Hand Joint Coordination

スマートフォンのカメラ映像から手の21ランドマークを推定し、横軸に手首、縦軸に人差し指のMCP/PIPの角度を表示する発表用デモです。映像・ランドマーク・角度履歴はブラウザ内で処理し、保存・アップロードしません。起動時に同じサイトからJS・WASM・モデルを取得します。バックエンドはありません。

## 起動と検証

リポジトリルートで実行します。既存サイトと同じNode.js要件を使います。

```sh
npm ci
npm run dev
# http://127.0.0.1:5173/hand-joint/
npm run build
npm run check
npm run preview
# http://127.0.0.1:4173/hand-joint/
```

`npm run check` は既存5ページのDOM・HTTP検証に加え、新規ページの出力・HTTP、角度計算、アスペクト比、校正、符号反転、不正入力、ミラー座標、履歴上限、ローカルモデルのSHA-256とWASMの同一性を確認します。

`npm run test:hand-browser` はインストール済みEdge/Chromeを独立した一時プロファイルでヘッドレス起動します。別環境では `HAND_TEST_BROWSER` にChromium系ブラウザの実行ファイルを指定してください。ブラウザ本体は自動インストールしません。実際のモデルとWASMの初期化・空画像の推論を検証し、さらに**人工のカメラ映像とランドマーク**で校正・切替・一時停止・再開・検出失敗時の分断・リセットをテストします。スクリーンショットは `artifacts/hand-joint/` に出力します。これは実カメラ精度やiOS/Android実機の検証ではありません。

環境変数 `HAND_TEST_DEV=1` では開発サーバーをテストします。サブパスビルドを確認する場合は `vite build --base=/demo/ --outDir artifacts/hand-joint/subpath-dist` の後、`HAND_TEST_BASE=/demo/` と `HAND_TEST_DIST=artifacts/hand-joint/subpath-dist` を設定して同じブラウザテストを実行できます。

## 既存サイトへの統合・公開

既存のVite MPAに `hand-joint/index.html` を追加し、出力先を `dist/hand-joint/index.html` としています。アプリ専用CSS/TSのみを読み込み、既存トップページへのリンクや既存デザインは変更していません。既存のGitHub Actionsはそのまま、`npm ci` → `npm run build` → `npm run check` → `dist` のアップロードを使います。

公開予定URLは **https://hal7000-s.github.io/hand-joint/**。公開にはユーザー確認後のcommit/pushが必要です。この実装作業ではpush・Pages設定変更は行いません。

モデル・WASMはページURLからの相対参照 `./vendor/`、WorkerとJS/CSSはViteのbase設定を使います。将来プロジェクトPagesのサブパスへ移す場合は既存サイト全体のbase設計を別途見直してください。アプリ自身は `vite build --base=/任意のサブパス/` に対応する相対モデル参照です。現在の `base: '/'` とユーザーPagesの公開方式は維持しています。

スマートフォンからのカメラ利用には**HTTPSの公開サイト**が必要です。PCのLAN内HTTPアドレスでは通常カメラを利用できません。

## 撮影と校正

1. 明るい場所で端末を固定し、前腕・手首・指先が映るよう、手を横から撮影します。前腕の肘全体が映る必要はありません。前腕上で肘寄りの点を指定できれば十分です。
2. 「カメラを起動」を押し、カメラ使用を許可します。背面を優先します。「前面に切替」で前面カメラを使用できます（前面はミラー表示）。切替時は再校正してください。
3. 手首・指を中立姿勢にし、「映像を静止・前腕軸を設定」を押します。推論結果も静止フレームに対応します。
4. 静止した映像上で**前腕の肘側 → 手首側**の2点をタップします。ベクトルは肘側から手首側を向きます。手ではなく前腕に合わせ、点を十分離してください。やり直す場合はライブ映像に戻ってから再度静止します。
5. 手が検出されている状態で「中立姿勢をゼロに設定」を押します。手首・MCP・PIP・DIPの現在の角度を同時にゼロ点として保持します。
6. 「計測開始」でライブ映像に戻り、記録を開始します。前腕・端末を固定したまま手首と指を動かします。
7. 背屈が正、掌屈が負、指の屈曲が正になるよう「手首の符号を反転」「指の符号を反転」を必要に応じて使います。符号は撮影する手・撮影方向で変わるため、実際の動作で確認してください。

## 操作

- MCP/PIP切替：同時に保持した同じ測定データから縦軸を切り替えます。履歴は維持します。
- 一時停止・再開：カメラは継続し、測定点の追加だけ停止します。再開時は履歴を保持し、区間を分けます。
- 軌跡をリセット：カメラ・校正結果・計測中の状態を維持し、履歴だけを消します。計測中なら直後から新たな点が追加されます。
- 映像静止・前腕軸設定：計測を停止し、校正と履歴を初期化します。新しい軸を指定してください。
- ゼロ点・符号の変更：履歴をクリアして通知します。異なる校正条件の点が混ざることを防ぎます。
- カメラ停止・切替：MediaStreamを解放し、Workerを終了します。再起動後は校正が必要です。
- 推論頻度：5 / 10 / 15 fps。初期10 fps、グラフ更新は約6回/秒です。推論はWorkerで実行し、同一動画フレーム・重複推論を避けます。端末が重い場合は5 fpsに下げてください。
- 検出失敗：点を追加せず、前後の軌跡を分断します。画面が非表示になった場合も計測を一時停止し、手動再開します。
- 長時間使用：履歴は最新6,000点まで（10 fpsでは約10分）。古い点から削除し、メモリ増加を抑えます。

## 角度の定義

正規化されたMediaPipe座標を**元動画の幅・高さで別々にピクセルへ変換**して計算します。ミラー表示は表示上だけ適用し、計算は元座標を使います。

```text
h = P5 - P0  （手首 → 人差し指MCP）
a = P6 - P5  （MCP → PIP）
b = P7 - P6  （PIP → DIP）
c = P8 - P7  （DIP → 指先）
angle(u,v) = atan2(u.x*v.y-u.y*v.x, u.x*v.x+u.y*v.y) * 180/pi
f = 手動指定した手首側点 - 肘側点
wrist = angle(f,h)
MCP = angle(h,a), PIP = angle(a,b), DIP = angle(b,c)
表示角度 = wrap(raw - 中立姿勢のraw) * 符号（+1 または -1）
```

差分を[-180,180)度へ折り返します。ゼロ長ベクトル・NaNなどは無効として破棄します。DIPは内部保持しますが、グラフ選択はMCP/PIPです。各サンプルにtimestamp（単調増加のブラウザ時刻ms）、wristAngle、mcpAngle、pipAngle、dipAngle、区間番号を保持します。

## 固定アセットと再取得

- `@mediapipe/tasks-vision`: **0.10.32**
- `plotly.js-basic-dist-min`: **3.3.0**
- Hand Landmarker: **float16/1**、同梱モデルのSHA-256は `public/hand-joint/vendor/manifest.json` に記載。
- モデルとSIMD/非SIMD両方のWASMは `public/hand-joint/vendor/` に同梱し、Viteがdistへコピーします。実行時にCDNは利用しません。

依存の同一バージョンからWASMとESMラッパーを再生成するには `npm run prepare:hand-assets`。モデルも再取得する場合は `npm run prepare:hand-assets -- --download-model`（ネット接続が必要）。ESMラッパーは配布元のJSに `self.ModuleFactory = ModuleFactory;` のみを追記したものです。Module WorkerではimportScriptsを使えないため先にESMで読み込み、MediaPipeへ工場関数を渡します。SIMD選択はFilesetResolverに従います。

技術仕様は[Google公式Hand Landmarker Webガイド](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)に基づき、VIDEOモード・numHands=1・detectForVideoを使います。依存とモデルの出典・ライセンスはvendor/NOTICE.mdを参照してください。

## この変更での検証結果

- TypeScript型検査・本番ビルド・既存サイトの全checkに成功。
- `/hand-joint/` の出力・直接HTTPアクセス・JS/CSS参照を確認。
- Edgeのヘッドレスブラウザで、PC/390px画面の描画と操作テストに成功。
- 実モデルとローカルWASMを使うWorkerの初期化・空画像推論に成功。
- 開発サーバーでもWorker初期化と同じ操作テストに成功。Worker専用依存を事前最適化し、初回カメラ起動時の依存追加によるページ再読込を防いでいます。
- `/demo/hand-joint/` の別ビルドでも、Worker・モデル・WASMの初期化と操作テストに成功。既存の公開base設定は変更していません。
- GitHubへのpushや公開サイトの変更は実施していません。公開済みURLの検証は未実施です。

## 計測上の限界・公開前の実機確認

これは2次元画像平面への**投影角度**であり、3次元の解剖学的角度・診断用の計測ではありません。横からの撮影では指が重なりやすく、推定が途切れたり、関節位置がずれたりします。前腕の自動追跡は行いません。前腕・端末が動いたとき、カメラ切替・動画解像度の変更時は再校正が必要です。追加の平滑化は行っていません。

iOS Safari / Android Chromeの実カメラ、前背面切替、回転、権限拒否と再許可、画面復帰、長時間使用、動作に対する符号と角度、HTTPSの公開URLでのモデル/WASM読み込みは**実機で未検証**です。iOSはModule Worker・OffscreenCanvas・WebAssembly対応の新しいSafariを使ってください。正式な対応バージョンや端末ごとの性能は実機確認後に確定してください。

Plotlyの本体により新規ページ用JSは約1.13 MB（gzip約380 KB）。既存HomeのThree.jsにも従来のチャンクサイズ警告があります。警告はビルド失敗ではありません。
