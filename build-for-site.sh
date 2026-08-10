#!/usr/bin/env bash
#
# 月次リリースノートLPを「サイトのpublic配下に置ける形」で焼く。
#
# 使い方:
#   ./build-for-site.sh <YYYY-MM> <出力先ディレクトリ> [release-data.jsonのパス]
#   例) ./build-for-site.sh 2026-07 ~/learningsales/corporate-site-plainer/public/product-update
#
# 出力:
#   <出力先>/<YYYY-MM>.html        … LP本体（実体はファイル。ディレクトリにしない）
#   <出力先>/<YYYY-MM>/assets/…    … JS/CSS・ロゴ・favicon
#
# なぜディレクトリではなくファイルなのか:
#   Vercel は public 配下のディレクトリを index.html に解決しない。
#   ローカルの `next start` は解決するので、手元で確認できたのに本番で404になる
#   （2026-08-10 に実際に踏んだ）。ファイルとして置けばどちらでも確実に配信される。
#   拡張子なしのURLは、サイト側の rewrites で /product-update/:month → :month.html に橋渡しする。
#
# アセットのパスは絶対（/product-update/<月>/…）で焼く。相対にすると配置場所で1階層ずれる。
#
set -euo pipefail

LP_DIR="$(cd "$(dirname "$0")" && pwd)"
MONTH="${1:?使い方: build-for-site.sh <YYYY-MM> <出力先> [release-data.json]}"
DEST="${2:?使い方: build-for-site.sh <YYYY-MM> <出力先> [release-data.json]}"
DATA="${3:-}"

[[ "$MONTH" =~ ^[0-9]{4}-[0-9]{2}$ ]] || { echo "第1引数は YYYY-MM 形式で指定してください"; exit 1; }

BASE="/product-update/${MONTH}/"
cd "$LP_DIR"

if [ -n "$DATA" ]; then
  echo "▶ 1/3 号の内容を取り込む ($DATA)"
  cp "$DATA" src/release-data.json
else
  echo "▶ 1/3 号の内容は既存の src/release-data.json を使う"
fi
[ -s src/release-data.json ] || { echo "  ✗ src/release-data.json が空です"; exit 1; }

echo "▶ 2/3 静的ビルド (base=$BASE)"
npx vite build --config vite.config.static.js --base="$BASE" >/dev/null

# favicon だけは index.html に直書きの相対パスが残るので絶対パスへ寄せる
python3 - "$BASE" <<'PY'
import sys
base = sys.argv[1]
p = 'dist-static/index.static.html'
s = open(p, encoding='utf-8').read()
s = s.replace('href="./favicon.png"', f'href="{base}favicon.png"')
open(p, 'w', encoding='utf-8').write(s)
PY

echo "▶ 3/3 配置: $DEST"
mkdir -p "$DEST/$MONTH"
rm -rf "$DEST/$MONTH/assets"
cp -R dist-static/assets "$DEST/$MONTH/"
cp dist-static/plainer_logo.svg dist-static/favicon.png dist-static/favicon.svg dist-static/icons.svg "$DEST/$MONTH/"
cp dist-static/index.static.html "$DEST/$MONTH.html"

echo ""
echo "── 完了 ──"
echo "公開後のURL: /product-update/$MONTH"
