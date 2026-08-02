#!/usr/bin/env bash
#
# 月次リリースノートを microCMS から取得して「下書きの見た目そのまま」の
# 静的スナップショットを作り、plainer-prototypes(GitHub Pages) に配置する。
#
# 使い方:
#   ./snapshot-to-pages.sh <contentId> <YYYY-MM> [一覧の説明文]
#   例) ./snapshot-to-pages.sh 7s0bf14k06h 2026-07 "A/Bテスト機能の強化（操作デモ付き）"
#
# ポイント:
#   - 内容はビルド時に焼き込むので、公開バンドルに microCMS の fetch/APIキーは残らない。
#   - 読み取りキーは product-update-lp/.env.local からのみ使い、画面・ログには出さない。
#   - push はしない（本番URLを目視確認してから手動で commit & push する）。
#
set -euo pipefail

LP_DIR="$HOME/learningsales/product-update-lp"
PAGES_ROOT="$HOME/plainer-prototypes"
PAGES_DIR="$PAGES_ROOT/product-update"

CONTENT_ID="${1:?使い方: snapshot-to-pages.sh <contentId> <YYYY-MM> [説明文]}"
MONTH_DIR="${2:?使い方: snapshot-to-pages.sh <contentId> <YYYY-MM> [説明文]}"
DESC="${3:-操作デモ付き}"

# YYYY-MM の形式チェック
[[ "$MONTH_DIR" =~ ^[0-9]{4}-[0-9]{2}$ ]] || { echo "第2引数は YYYY-MM 形式で指定してください（例: 2026-08）"; exit 1; }

cd "$LP_DIR"

# 読み取りキーを .env.local から読み込む（値は表示しない）
set -a; . ./.env.local; set +a
DOMAIN="${VITE_MICROCMS_DOMAIN:-plainer-service}"

echo "▶ 1/4 microCMS から取得 (contentId=$CONTENT_ID)"
code=$(curl -s -o src/release-data.json -w "%{http_code}" \
  -H "X-MICROCMS-API-KEY: $VITE_MICROCMS_API_KEY" \
  "https://${DOMAIN}.microcms.io/api/v1/product_release/${CONTENT_ID}")
[ "$code" = "200" ] || { echo "  ✗ 取得失敗 HTTP $code"; exit 1; }
echo "  ✓ 取得OK ($(wc -c < src/release-data.json | tr -d ' ') bytes)"

echo "▶ 2/4 静的ビルド"
npx vite build --config vite.config.static.js >/dev/null
echo "  ✓ dist-static 生成"

echo "▶ 3/4 Pages へ配置: product-update/$MONTH_DIR/"
DEST="$PAGES_DIR/$MONTH_DIR"
mkdir -p "$DEST"
rm -rf "$DEST/assets"
cp -R dist-static/assets "$DEST/"
cp dist-static/favicon.png dist-static/favicon.svg dist-static/icons.svg dist-static/plainer_logo.svg "$DEST/"
cp dist-static/index.static.html "$DEST/index.html"
echo "  ✓ 配置完了"

echo "▶ 4/4 一覧(index.html)にリンク追加（重複時はスキップ）"
python3 - "$PAGES_DIR/index.html" "$MONTH_DIR" "$DESC" <<'PY'
import sys, re
index_path, month_dir, desc = sys.argv[1], sys.argv[2], sys.argv[3]
y, m = month_dir.split("-")
label = f"{int(y)}年{int(m)}月"
html = open(index_path, encoding="utf-8").read()
if f'href="{month_dir}/"' in html:
    print("  ・既にリンクあり → スキップ")
else:
    li = f'<li><a href="{month_dir}/">{label}</a> <span class="s">— {desc}</span></li>'
    # <ul> の直後（＝最新が先頭）に差し込む
    html2 = re.sub(r'(<ul>)', r'\1' + li, html, count=1)
    open(index_path, "w", encoding="utf-8").write(html2)
    print(f"  ✓ 追加: {label}")
PY

echo ""
echo "── 完了 ──"
echo "本番URL(反映まで1分程): https://makinanishi-create.github.io/plainer-prototypes/product-update/$MONTH_DIR/"
echo ""
echo "目視OKなら push:"
echo "  cd $PAGES_ROOT && git add product-update && git commit -m \"product-update: ${label:-$MONTH_DIR}号を追加\" && git push"
