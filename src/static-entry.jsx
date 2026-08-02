// 静的スナップショット用エントリ。microCMS fetch を使わず、
// ビルド時に焼き込んだ release-data.json を ReleaseLP に直接渡す（GitHub Pages 配置用）。
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReleaseLP from "./ReleaseLP";
import data from "./release-data.json";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReleaseLP data={data} />
  </StrictMode>,
);
