import { useEffect, useState } from "react";
import Heatmap from "./components/Heatmap";
import type { CPIRecord } from "./types";
import { loadCpiLongCsv } from "./utils/loadCpi";

export default function App() {
  const [data, setData] = useState<CPIRecord[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadCpiLongCsv("/data/cpi_long.csv")
      .then((rows) => setData(rows))
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: 24,
        background: "#fafafa",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          display: "grid",
          gap: 16,
          alignContent: "start",
        }}
      >
        <header style={{ textAlign: "center", paddingTop: 8 }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>
            FAOSTAT Consumer Price Indices
          </h1>
          <p style={{ margin: "10px 0 0", opacity: 0.8, fontSize: 14 }}>
            Explore monthly CPI series by country and metric. Select an area,
            item and element to view a month-by-year heatmap.
          </p>
        </header>

        <main
          style={{
            background: "white",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 33,
            boxShadow: "0 6px 18px rgba(0,0,0,.06)",
          }}
        >
          {err && <div style={{ padding: 12 }}>Error: {err}</div>}
          {!err && !data && <div style={{ padding: 13 }}>Loading CSV…</div>}
          {!err && data && <Heatmap data={data} />}
        </main>

        <footer style={{ textAlign: "center", fontSize: 12, opacity: 0.7 }}>
          Data source:{" "}
          <a href="https://www.fao.org/faostat/en/#data/CP" target="_blank">
            FAOSTAT (Consumer Price Indices)
          </a>
          . Visualization built with React + TypeScript + D3.
        </footer>
      </div>
    </div>
  );
}
