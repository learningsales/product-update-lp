import { useEffect, useRef, useState } from "react";

// PLAINERデモの描画基準幅（サービスサイトと同値）。この幅で描画し、枠幅にscaleで縮小する
const DEMO_W = 1440;
const DEMO_H = 932;

const SECTION_ORDER = ["すぐ使える", "要契約"];
// 新機能を先、改善を後に並べる。セクション内で混在すると「これは新機能なのか
// 小さな改善なのか」が読み手に伝わらないため、タグごとに塊で見せる。
const TAG_ORDER = ["新機能", "改善"];
const TAG_META = {
  新機能: { cls: "new", lead: "今月から新しくお使いいただける機能です。" },
  改善: { cls: "imp", lead: "既存の機能をより使いやすくしました。" },
};
const SECTION_META = {
  すぐ使える: {
    flag: "ready",
    label: "追加のお手続きなくご利用いただけます",
    heading: "そのまま使えるアップデート",
    lead: "すべてのお客様が、追加のお手続きなくそのままご利用いただけます。",
  },
  要契約: {
    flag: "paid",
    label: "個別のお申し込み・設定が必要な機能",
    heading: "ご相談のうえご利用いただけるアップデート",
    lead: "以下の機能は、ご利用にあたって個別のお申し込み・設定が必要です（一部は有償で提供しているものもございます）。ご希望の場合は PLAINER の担当営業・CS までお問い合わせください。",
  },
};

function firstValue(v) {
  return Array.isArray(v) ? v[0] : v;
}

function ymLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`;
}

// "**ラベル**：説明" を 太字ラベル＋説明 に
function renderPoint(line, i) {
  const m = line.match(/^\s*\*\*(.+?)\*\*[：:]\s*(.*)$/);
  if (m) {
    return (
      <div className="pt" key={i}>
        <span className="ico">✓</span>
        <span className="pttx">
          <b>{m[1]}</b>：{m[2]}
        </span>
      </div>
    );
  }
  return (
    <div className="pt" key={i}>
      <span className="ico">✓</span>
      <span className="pttx">{line.replace(/\*\*/g, "")}</span>
    </div>
  );
}

function DemoFrame({ url, linkUrl, heading }) {
  // 飛び先は「実際に触れるデモ」を別に持たせる想定（demoLinkUrl）。
  // まだ用意できていない機能は、埋め込みと同じデモを実物大で開くところまでは担保する。
  //
  // ただし「見た目の変化」を見せる回など、そもそも遷移させたくない機能がある。
  // その場合は demoLinkUrl（トラッカーの「実デモURL」）に none と入れる。
  // 空にするだけだと埋め込みデモへのフォールバックが働いてリンクが出てしまう。
  const noLink = String(linkUrl || "").trim().toLowerCase() === "none";
  const openUrl = noLink ? null : linkUrl || url;
  const openLabel = linkUrl && !noLink ? "実際のデモを開く" : "別タブで大きく開く";
  const shellRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!url || !shellRef.current) return;
    const el = shellRef.current;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [url]);

  const scale = width ? width / DEMO_W : 0;
  // デモ本体を position:fixed の内側iframeで包む（PLAINERデモの固定配置に対応・サービスサイトと同方式）
  const innerSrc = url
    ? "data:text/html;charset=utf-8," +
      encodeURIComponent(
        `<iframe style="border:none;width:100%;height:100%;position:fixed;top:0;left:0;" src="${url}" allowfullscreen></iframe>`
      )
    : null;

  return (
    <div className="demo">
      <div className="demo-label">
        <span className="rec" />
        <span>{url ? "操作デモ（触って試せます）" : "デモ準備中"}</span>
        {openUrl && (
          <a className="demo-open" href={openUrl} target="_blank" rel="noopener noreferrer">
            {openLabel}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <div className="frame">
        <div className="chrome">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          {openUrl ? (
            <a className="url" href={openUrl} target="_blank" rel="noopener noreferrer">
              product.plainer.co.jp
            </a>
          ) : (
            <span className="url">product.plainer.co.jp</span>
          )}
          <span className="live">DEMO</span>
        </div>
        {url ? (
          <div className="demo-shell" ref={shellRef}>
            {scale > 0 && (
              <iframe
                className="demo-embed"
                title={heading}
                src={innerSrc}
                style={{ width: DEMO_W, height: DEMO_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
                allow="fullscreen; autoplay"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <div className="demo-empty">
            <div className="demo-empty-icon">▶</div>
            <p>この機能の操作デモは準備中です</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureBlock({ feature, index, reversed }) {
  const tag = firstValue(feature.tag);
  const points = (feature.points || "").split("\n").map((l) => l.trim()).filter(Boolean);
  // デモが無い機能は、デモ枠ごと出さない。
  // 「操作デモ（触って試せます）」も「デモ準備中」も、デモが無いのに枠だけ残ると
  // 顧客からは「いつまで準備中なのか」に見える。
  // demoUrl が空（未納品）でも none（作らないと決めた回）でも、扱いは同じ。
  const noDemo = !String(feature.demoUrl || "").trim()
    || String(feature.demoUrl).trim().toLowerCase() === "none";
  return (
    <article className={`feat${reversed ? " rev" : ""}${noDemo ? " no-demo" : ""}`}>
      <div className="feat-grid">
        <div className="feat-txt">
          <span className="num">
            <b>{index}</b>
            <span className={`tag ${tag === "新機能" ? "new" : "imp"}`}>{tag}</span>
          </span>
          <h3>{feature.heading}</h3>
          {feature.body && <p className="body">{feature.body}</p>}
          {points.length > 0 && <div className="points">{points.map(renderPoint)}</div>}
        </div>
        {!noDemo && (
          <DemoFrame url={feature.demoUrl} linkUrl={feature.demoLinkUrl} heading={feature.heading} />
        )}
      </div>
    </article>
  );
}

export default function ReleaseLP({ data }) {
  const [theme, setTheme] = useState(null);
  const features = data.features || [];

  // セクション内をタグ（新機能 / 改善）で塊に分ける。通し番号は並べ替え後の順に振るので、
  // 目次の番号と本文の番号が必ず一致する。
  const grouped = SECTION_ORDER.map((sec) => {
    const inSec = features.filter((f) => firstValue(f.section) === sec);
    const known = TAG_ORDER.flatMap((t) => inSec.filter((f) => firstValue(f.tag) === t));
    const unknown = inSec.filter((f) => !TAG_ORDER.includes(firstValue(f.tag)));
    const items = [...known, ...unknown].map((f, i) => ({ feature: f, num: i + 1 }));
    return { sec, items };
  }).filter((g) => g.items.length > 0);

  function toggleTheme() {
    const cur = theme || (window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }

  const Logo = ({ h = 26 }) => (
    <img className="logo-img" src={`${import.meta.env.BASE_URL}plainer_logo.svg`} alt="PLAINER" style={{ height: h }} />
  );

  return (
    <>
      <header className="top">
        <div className="wrap">
          <Logo />
          <nav>
            <button className="toggle" onClick={toggleTheme} aria-label="テーマ切替" title="ライト / ダーク">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <span className="badge-month">
            <span className="dot" />
            PRODUCT UPDATE ・ {ymLabel(data.month)}
          </span>
          <h1>
            プロダクトアップデート
            <br />
            <span className="yr">{ymLabel(data.month)}</span>
          </h1>
          {data.leadText && <p className="lede">{data.leadText}</p>}
        </div>
      </section>

      <main>
        <div className="wrap">
          {grouped.map(({ sec, items }) => {
            const meta = SECTION_META[sec];
            return (
              <section key={sec}>
                <div className="sec-head">
                  <span className={`sec-flag ${meta.flag}`}>{meta.label}</span>
                  <h2>{meta.heading}</h2>
                  <p>{meta.lead}</p>
                  <div className="index">
                    {items.map(({ feature: f, num }) => {
                      const t = firstValue(f.tag);
                      return (
                        <a className="ix-card" key={num}>
                          <span className="ix">{num}</span>
                          <span className="tx">{f.heading}</span>
                          <span className={`tag ${TAG_META[t]?.cls || "imp"}`}>{t}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
                {TAG_ORDER.map((t) => {
                  const group = items.filter(({ feature: f }) => firstValue(f.tag) === t);
                  if (group.length === 0) return null;
                  return (
                    <div className="tag-group" key={t}>
                      <div className="tag-group-head">
                        <span className={`tag ${TAG_META[t].cls}`}>{t}</span>
                        <span className="tag-group-count">{group.length}件</span>
                        <span className="tag-group-lead">{TAG_META[t].lead}</span>
                      </div>
                      {group.map(({ feature: f, num }, i) => (
                        <FeatureBlock key={num} feature={f} index={num} reversed={i % 2 === 1} />
                      ))}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </main>

      <footer className="foot">
        <div className="wrap">
          <Logo h={20} />
          <span>© 2024 PLAINER Co., Ltd. ・ プロダクトにしゃべらせよう</span>
        </div>
      </footer>
    </>
  );
}
