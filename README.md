# おはようニュース (ohayo-news)

Claudeに「おはよう」と話しかけると、GitHub Trending・Hacker News・Zenn・Qiitaから
今日の技術系トレンド記事をまとめて教えてくれる、リモートMCPサーバーです。

## 仕組み

- Cloudflare Workers上で動くMCP (Model Context Protocol) サーバーとして実装
- Claudeアプリ（スマホ含む）から「カスタムコネクタ」として接続することで、いつでもどこからでも利用可能
- ニュースの要約自体はClaude Pro/Maxの通常のチャット機能で行われるため、追加のAPI利用料はかからない

参考記事: [Claude Codeで毎朝の技術ニュースを自動要約する仕組みを作った](https://qiita.com/iineineno03k/items/810f73deb31fba8617c2)
この記事のアイデアをベースに、シェルスクリプトの代わりにリモートMCPサーバーとして実装し直しました。

## 取得しているニュースソース

各ソース3件ずつ取得します。

- GitHub Trending (RSS)
- Hacker News (Algolia API)
- Zenn (公式API)
- Qiita (公式API v2、ストック数3件以上・直近2日以内の記事という条件で候補を30件取得し、その中からいいね数が多い順に3件を選定。他の3ソースが「今まさにホットなもの」を扱うのに対し、期間を合わせつつ、いいねが付くまでの時間差を考慮している)

※ Redditは2026年5月にReddit側が未認証JSON APIを廃止したため、対応を見送っています。

ツールが返す内容には「記事を省略せず、リンクと4〜5文程度の詳しい解説を付けて紹介してほしい」という指示も含めており、Claudeが自然に短くまとめすぎないよう工夫しています。

## セットアップ

必要なもの: Node.js、Cloudflareアカウント（無料枠でOK）

```bash
git clone https://github.com/Choki05/ohayo-news.git
cd ohayo-news
npm install
cp .dev.vars.example .dev.vars
# .dev.vars内のAUTH_TOKENを好きなランダムな文字列に書き換える
npx wrangler dev
```

デプロイ:

```bash
npx wrangler login
npx wrangler secret put AUTH_TOKEN
npx wrangler deploy
```

## Claudeアプリへの登録

デプロイ後に表示されるURLに、`AUTH_TOKEN`をクエリパラメータとして付けたものを、
Claudeのカスタムコネクタ（設定 → コネクタ → カスタムコネクタを追加）として登録してください。

```
https://<デプロイ後のURL>/mcp?token=<AUTH_TOKENの値>
```
