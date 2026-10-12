# hal7000-s / 個人研究室

新しい個人ポートフォリオサイトの初期版。既存の `website01` は編集せず、アーカイブへのリンクだけを設置しています。GitHubへのリポジトリ作成・push・Pages設定変更はまだ行っていません。

## 開発

Node.js 22.22.2以上の22系、24.15.0以上の24系、または26以上とnpmを使用します（DOM検証のjsdomの要件）。今回の確認環境はNode.js 24.15.0です。

```sh
npm ci
npm run dev
```

表示URLは `http://127.0.0.1:5173/`。`npm run typecheck` は型確認、`npm run build` は型確認と静的ビルド、`npm run check` は静的出力・DOM動作・HTTP直接アクセスを確認します。`npm run preview` でビルド結果を確認できます。

## 構成と採用理由

```text
index.html                 Home入口
works/index.html           Works入口
games/index.html           Games入口
articles/index.html        Articles入口
records/index.html         Records入口
src/
  main.ts                  共通レイアウト・各ページ・記事絞り込み
  data.ts                  プロフィール・作品・ゲーム・記事・記録
  avatar.ts                仮3D / GLBロード / 2Dフォールバック
  style.css                共通デザイン・レスポンシブ対応
public/
  favicon.svg
  models/                  将来のGLB置き場
content/articles/          将来のMarkdown記事用（変換は未実装）
scripts/check-build.mjs     静的出力検証
scripts/check-dom.mjs       表示・絞り込み・2Dフォールバック検証
scripts/check-http.mjs      直接アクセス・再リクエスト検証
.github/workflows/deploy.yml
vite.config.ts
```

- **Vite**：シンプルな開発サーバーと静的ビルド。`base: '/'`。
- **TypeScript**：コンテンツの項目や状態を型で管理。
- **Three.js**：仮案内人と将来のGLB表示。Homeだけで遅延読込。
- **Reactは不使用**：5ページの表示と小規模な絞り込みには不要。
- **複数HTML入口**：各ディレクトリに `index.html` を生成するため、Pagesで `/works/` などに直接アクセス・再読込できる。SPA用の404リダイレクトは不要。

外部API・CMS・DB・Webフォントへの依存はありません。画面の図形はCSSとThree.jsで生成しています。

## コンテンツ更新

`src/data.ts` の配列を編集してください。仮データは掲載枠であり、本人の実績・制作状況を確定したものではありません。Worksの「保留（仮）」も初期データです。公開前に実情報で置換してください。

- Works：`id`, `title`, `summary`, `category`, `updatedAt`, `status`, `technologies`。任意で `period`, `role`, `thumbnail`, `url`。
- Games：`url` を省略すると「制作中・公開URL未定」。外部ゲームは確定した独立したGitHub Pages URLを登録し、ゲームのソースやアセットは入れない。このサイト内の軽量な静的デモは `/demos/.../index.html` も指定できる。`status` は任意で「公開可能」または「制作中」。
- Articles：`category`, `publishedAt`（任意）, `updatedAt`, `url`（任意）など。カテゴリーのボタンはデータから自動生成。外部本文は複製しない。
- Records：作った・学んだ・手放した、の記録を追加。未提供の個人情報は登録しない。
- 全エントリ：`id` は一意で安定した英数字・ハイフンにする。日付は `YYYY-MM-DD`。画像は `public/images/` へ置き `/images/name.webp` のように指定。
- Home更新：4つの配列の `updatedAt` を降順に並べ、同日はID順で直近5件を表示。履歴の別管理は不要。各掲載枠へのアンカーリンク付き。
- 連絡先：現在はGitHubプロフィールのみ。メール等は本人が提供した内容を追加する。

GLBの差し替えは `public/models/README.md` を参照。未指定時は仮ロボット、読込失敗・WebGL非対応・コンテキスト喪失時は2D表示。OSの動きを減らす設定を尊重し、手動停止も可能です。

色・字体は `src/style.css` 冒頭のCSS変数で変更できます。

## GitHub Pagesへの公開（手動で行う作業）

公開先は **https://hal7000-s.github.io/**。ユーザーサイト用リポジトリ名は **hal7000-s.github.io** です。すでに同名のリポジトリがある場合は内容と公開状況を確認し、上書きせず調整してください。

1. GitHub上に新規 `hal7000-s.github.io` リポジトリを作成する。旧 `website01` は変更しない。
2. この独立したローカルリポジトリから以下を実行する（リモート未設定であることを確認）。

```sh
git add .
git commit -m "Initialize personal portfolio"
git remote add origin https://github.com/hal7000-s/hal7000-s.github.io.git
git push -u origin main
```

3. **新規リポジトリだけ**の Settings → Pages → Build and deployment → Source で **GitHub Actions** を選択する。
4. Actionsの「Deploy portfolio to GitHub Pages」を手動実行する。その後はmainへのpushで自動更新。
5. 公開後、ルートと4つの下位URLを直接開いて再読み込みし、旧 `/website01/` も従来どおり表示されることを確認する。

独自ドメイン/CNAMEや旧サイトの設定は変更しません。プロジェクトPagesのサブパスへ公開する構成ではありません。

## 今後の作業

本人が確認したプロフィール・連絡先・作品画像・制作時期・技術・担当部分・記事URL・経験の追加。本物のGLBモデル、Markdown記事のビルド処理、任意のゲームiframeは今後の拡張です。AI会話・音声・ゲーム本体・大規模3D空間は今回実装していません。

## Bayesian MCMC Demo

`public/demos/bayesian-mcmc/index.html` に、提供されたHTMLをもとにした独立デモを配置。公開先は `/demos/bayesian-mcmc/index.html`（ユーザーサイト公開後は `https://hal7000-s.github.io/demos/bayesian-mcmc/index.html`）。Viteのpublicコピー機能を使い、そのままdistに含めます。追加のライブラリ・API・バックエンドはありません。

登録情報は `src/data.ts` の `games` に集約し、Gamesカードから同じタブで起動できます。実装は単一HTML内のスタイル・計算関数・描画関数・入力と表示の節に分け、将来CSS/JSを切り出せる構成です。

元コードの `logPosterior`、`normalRandom`、`mcmc`、`logFactorial`、`exactPdf` は変更していません。初期値θ=0.5、正規ランダムウォーク、範囲外提案の棄却、全反復での採択率、20%のburn-inも維持。入力の空欄・整数・範囲チェック、結果表示、軸・burn-in領域、戻るリンク、レスポンシブ表示を追加しています。20%の除外は収束を保証しません。

`npm run build` 後の `npm run check` で、デモのコピー一致・直接HTTPアクセス・再リクエスト・Gamesカードを検証。`scripts/check-mcmc.mjs` は既存DOMテストから実行され、ビルド済みHTMLの実行、4入力の反映、不正入力18ケース、グラフ描画呼び出し、Beta密度の積分と理論平均、burn-in、Canvas非対応時を確認します。乱数はテスト内だけ固定し、公開デモは元のMath.randomを使用します。

ブラウザーでもカードからの遷移、MCMC実行、H変更（理論平均0.75→0.25）、H>nの拒否、再読込、グラフ描画、390px幅で横スクロールが不要なことを確認。スマートフォン実機と公開後のGitHub Pagesは未確認です。

## 動作確認と制限

- 型チェックとVite本番ビルドに成功。
- 5つのHTML入口と参照JS/CSSの存在を確認。
- jsdomで5ページの見出し・カード件数・共通ナビ・アーカイブリンクを確認。記事カテゴリーの絞り込みと全件への復帰、最近の更新5件とリンク先ID、未公開ゲームのリンク非表示を確認。
- WebGL非対応のエラー経路で2D表示へのフォールバックを確認。
- ビルド出力をSPAフォールバックなしの一時HTTPサーバーで配信し、5URLの直接アクセス・再リクエスト・アセット取得が200になることを確認。
- 操作可能なブラウザーが環境にないため、見た目・モバイル実機・実際のWebGL描画・GLBロードは未確認。レスポンシブCSSは実装済み。公開前にPCとスマートフォンで確認してください。
- Three.js/GLBローダーを含むHome用チャンクは約576KB（gzip約147KB）。Viteの500KB警告が出ます。他の4ページでは読み込みません。
- 既存サイトはWeb取得ツールで参照できなかったため、旧画面の細部を確認していません。既存サイトのファイル・リポジトリ・設定への操作はしていません。
