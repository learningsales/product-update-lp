import { useEffect, useState } from "react";
import { fetchOne, fetchLatest } from "./microcms";
import ReleaseLP from "./ReleaseLP";
import "./styles.css";

export default function App() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contentId = params.get("contentId");
    const draftKey = params.get("draftKey");

    const load = contentId
      ? fetchOne(contentId, draftKey) // microCMS 画面プレビュー
      : fetchLatest(); // 通常表示は最新号

    load
      .then((data) => setState({ status: "ok", data, error: null }))
      .catch((error) => setState({ status: "error", data: null, error: String(error) }));
  }, []);

  if (state.status === "loading") return <div className="loading">読み込み中…</div>;
  if (state.status === "error")
    return (
      <div className="loading">
        取得に失敗しました：{state.error}
        <br />
        <span className="loading-sub">
          .env.local の VITE_MICROCMS_API_KEY（product_release の GET 権限）を確認してください
        </span>
      </div>
    );
  if (!state.data) return <div className="loading">まだ記事がありません</div>;

  return <ReleaseLP data={state.data} />;
}
