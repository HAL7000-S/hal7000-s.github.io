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
- Games：`url` を省略すると「制作中・公開URL未定」。確定した独立したGitHub Pages URLのみ登録。ゲームのソースやアセットは入れない。
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

## 動作確認と制限

- 型チェックとVite本番ビルドに成功。
- 5つのHTML入口と参照JS/CSSの存在を確認。
- jsdomで5ページの見出し・カード件数・共通ナビ・アーカイブリンクを確認。記事カテゴリーの絞り込みと全件への復帰、最近の更新5件とリンク先ID、未公開ゲームのリンク非表示を確認。
- WebGL非対応のエラー経路で2D表示へのフォールバックを確認。
- ビルド出力をSPAフォールバックなしの一時HTTPサーバーで配信し、5URLの直接アクセス・再リクエスト・アセット取得が200になることを確認。
- 操作可能なブラウザーが環境にないため、見た目・モバイル実機・実際のWebGL描画・GLBロードは未確認。レスポンシブCSSは実装済み。公開前にPCとスマートフォンで確認してください。
- Three.js/GLBローダーを含むHome用チャンクは約576KB（gzip約147KB）。Viteの500KB警告が出ます。他の4ページでは読み込みません。
- 既存サイトはWeb取得ツールで参照できなかったため、旧画面の細部を確認していません。既存サイトのファイル・リポジトリ・設定への操作はしていません。
