// microCMS からリリースノート(product_release)を取得する薄いクライアント
const DOMAIN = import.meta.env.VITE_MICROCMS_DOMAIN || "plainer-service";
const KEY = import.meta.env.VITE_MICROCMS_API_KEY;
const BASE = `https://${DOMAIN}.microcms.io/api/v1/product_release`;

function headers() {
  return { "X-MICROCMS-API-KEY": KEY };
}

// 単一コンテンツ取得（画面プレビュー用: contentId + draftKey）
export async function fetchOne(contentId, draftKey) {
  const q = draftKey ? `?draftKey=${encodeURIComponent(draftKey)}` : "";
  const res = await fetch(`${BASE}/${contentId}${q}`, { headers: headers() });
  if (!res.ok) throw new Error(`microCMS ${res.status}`);
  return res.json();
}

// 最新1件（月降順）
export async function fetchLatest() {
  const res = await fetch(`${BASE}?orders=-month&limit=1`, { headers: headers() });
  if (!res.ok) throw new Error(`microCMS ${res.status}`);
  const data = await res.json();
  return data.contents?.[0] ?? null;
}

// 一覧（月降順）
export async function fetchAll() {
  const res = await fetch(`${BASE}?orders=-month&limit=100`, { headers: headers() });
  if (!res.ok) throw new Error(`microCMS ${res.status}`);
  return (await res.json()).contents ?? [];
}
