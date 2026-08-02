# product-update-lp

月次プロダクトアップデート（リリースノート）を、**顧客が各機能をその場で触れる公開LP**として表示するレンダラ。
microCMS から内容を取得して描画する Vite + React アプリ。

## 位置づけ

- **内容（何を載せるか・文面）はここでは決めない。** 生成は `plainer-slack-bot` の月次ジョブが行い、
  判断ルールは `plainer-backend` の `.claude/skills/monthly-update-draft` が正
- ここが持つのは**見せ方（レイアウト・区分の表現）だけ**

## 使い方

```bash
npm install
npm run dev          # http://localhost:5173
```

`.env.local` に読み取り用の設定が要る（**キーはコミットしない**）:

```
VITE_MICROCMS_DOMAIN=plainer-service
VITE_MICROCMS_API_KEY=...   # product_release の GET 権限のみ
```

画面プレビュー用に `?contentId=xxx&draftKey=yyy` に対応している。

## 表示の考え方

- **区分（section）で2つのセクションに分ける**
  - すぐ使える → 「そのまま使えるアップデート」（追加のお手続き不要）
  - 要契約 → 「ご相談のうえご利用いただけるアップデート」（個別のお申し込み・設定が必要）
  - ※「要契約＝必ず課金」の印象を避けるため、有償である旨は断定せず「一部は有償で提供している
    ものもございます」に留める
- **セクション内はタグ（新機能 / 改善）で塊に分ける**（2026-08-02 追加）
  - 混在させると「今月の目玉なのか小さな改善なのか」が読み手に伝わらない
  - グループ見出しに件数と一言説明を出し、目次カードにもタグを表示する
  - **これにより「その他の改善」のような中身の見えないバケットが不要になった**。小粒な改善は
    「改善」グループに並ぶので、まとめて隠す必要がない（束ねると中身に何が混ざっているか
    気づけず、デモ作成トラッカーも1行に複数機能が入って破綻する）

## 公開（GitHub Pages への静的スナップショット）

Vercel 本番が立つまでの暫定ルート。内容をビルド時に焼き込むので、**公開バンドルに microCMS の
fetch も APIキーも残らない**（検証済）。

```bash
./snapshot-to-pages.sh <contentId> <YYYY-MM> "[一覧の説明文]"
```

取得〜ビルド〜配置〜一覧リンクまで自動・冪等。**push はしない**（本番URLを目視確認してから手動で
`~/plainer-prototypes` に commit & push）。

- 静的ビルド専用: `src/static-entry.jsx` / `index.static.html` / `vite.config.static.js` / `src/release-data.json`
- スナップショットは**自動追従しない**。microCMS で号を編集しても本番Pagesは変わらないので、
  更新時は同スクリプトを再実行して push し直す

## gotcha

- デモは PLAINER の固定キャンバス。生 iframe だと一部しか映らないので scale が要る。
  画面幅設定「自動」だと枠幅に追従する
- GitHub Pages は初回 deploy がコケる癖がある（空コミットで叩き直す）
