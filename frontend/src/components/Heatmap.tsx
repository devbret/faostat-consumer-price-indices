import * as d3 from "d3";
import { useMemo, useRef, useState } from "react";
import type { CPIRecord } from "../types";

const MONTH_LABELS = [
  { num: 1, label: "January" },
  { num: 2, label: "February" },
  { num: 3, label: "March" },
  { num: 4, label: "April" },
  { num: 5, label: "May" },
  { num: 6, label: "June" },
  { num: 7, label: "July" },
  { num: 8, label: "August" },
  { num: 9, label: "September" },
  { num: 10, label: "October" },
  { num: 11, label: "November" },
  { num: 12, label: "December" },
];

type Props = {
  data: CPIRecord[];
};

export default function Heatmap({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const areas = useMemo(
    () => Array.from(new Set(data.map((d) => d.Area))).sort(),
    [data]
  );
  const items = useMemo(
    () => Array.from(new Set(data.map((d) => d.Item))).sort(),
    [data]
  );
  const elements = useMemo(
    () => Array.from(new Set(data.map((d) => d.Element))).sort(),
    [data]
  );

  const [area, setArea] = useState<string>(() => areas[0] ?? "");
  const [item, setItem] = useState<string>(() => items[0] ?? "");
  const [element, setElement] = useState<string>(() => elements[0] ?? "");

  const filtered = useMemo(() => {
    return data.filter(
      (d) => d.Area === area && d.Item === item && d.Element === element
    );
  }, [data, area, item, element]);

  const withMonthNum = useMemo(() => {
    const monthMap = new Map(
      MONTH_LABELS.map((m) => [m.label.toLowerCase(), m.num])
    );
    return filtered.map((d) => ({
      ...d,
      month_num:
        d.month_num && Number.isFinite(d.month_num)
          ? d.month_num
          : monthMap.get(d.Months.toLowerCase().trim()) ?? NaN,
    }));
  }, [filtered]);

  const years = useMemo(() => {
    const ys = Array.from(new Set(withMonthNum.map((d) => d.year))).filter(
      Number.isFinite
    );
    ys.sort((a, b) => a - b);
    return ys;
  }, [withMonthNum]);

  const lookup = useMemo(() => {
    const m = new Map<string, CPIRecord>();
    for (const d of withMonthNum) {
      if (!Number.isFinite(d.year) || !Number.isFinite(d.month_num ?? NaN))
        continue;
      m.set(`${d.year}-${d.month_num}`, d);
    }
    return m;
  }, [withMonthNum]);

  const valueExtent = useMemo<[number, number]>(() => {
    const vals = withMonthNum
      .map((d) => d.value)
      .filter((v) => Number.isFinite(v));
    const min = d3.min(vals) ?? 0;
    const max = d3.max(vals) ?? 1;
    return min === max ? [min - 1, max + 1] : [min, max];
  }, [withMonthNum]);

  const margin = { top: 30, right: 20, bottom: 50, left: 90 };
  const cellW = 36;
  const cellH = 36;

  const width = margin.left + margin.right + Math.max(1, years.length) * cellW;
  const height = margin.top + margin.bottom + 12 * cellH;

  const color = useMemo(() => {
    return d3
      .scaleSequential()
      .domain(valueExtent)
      .interpolator(d3.interpolateViridis);
  }, [valueExtent]);

  const [tip, setTip] = useState<{
    x: number;
    y: number;
    visible: boolean;
    html: string;
  }>({ x: 0, y: 0, visible: false, html: "" });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <label>
          Area{" "}
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label>
          Item{" "}
          <select value={item} onChange={(e) => setItem(e.target.value)}>
            {items.map((it) => (
              <option key={it} value={it}>
                {it}
              </option>
            ))}
          </select>
        </label>

        <label>
          Element{" "}
          <select value={element} onChange={(e) => setElement(e.target.value)}>
            {elements.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </label>

        <div style={{ opacity: 0.75 }}>
          Values:{" "}
          {Number.isFinite(valueExtent[0]) ? valueExtent[0].toFixed(2) : "—"} to{" "}
          {Number.isFinite(valueExtent[1]) ? valueExtent[1].toFixed(2) : "—"}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          overflowX: "auto",
          border: "1px solid #ddd",
        }}
      >
        <svg width={width} height={height}>
          <text
            x={margin.left}
            y={19}
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            Month-by-Year Heatmap
          </text>

          {years.map((y, i) => (
            <text
              key={y}
              x={margin.left + i * cellW + cellW / 2}
              y={height - 20}
              textAnchor="middle"
              style={{ fontSize: 10 }}
            >
              {y}
            </text>
          ))}

          {MONTH_LABELS.map((m, rowIdx) => {
            const y0 = margin.top + rowIdx * cellH;

            return (
              <g key={m.num} transform={`translate(0,0)`}>
                <text
                  x={margin.left - 10}
                  y={y0 + cellH / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontSize: 11 }}
                >
                  {m.label}
                </text>

                {years.map((yr, colIdx) => {
                  const x0 = margin.left + colIdx * cellW;
                  const d = lookup.get(`${yr}-${m.num}`);
                  const v = d?.value;

                  const fill =
                    v === undefined || !Number.isFinite(v) ? "#eee" : color(v);

                  return (
                    <rect
                      key={`${yr}-${m.num}`}
                      x={x0}
                      y={y0}
                      width={cellW - 1}
                      height={cellH - 1}
                      fill={fill}
                      onMouseMove={(evt) => {
                        if (!d || !Number.isFinite(d.value)) return;

                        const rect =
                          containerRef.current?.getBoundingClientRect();
                        const cx = evt.clientX - (rect?.left ?? 0);
                        const cy = evt.clientY - (rect?.top ?? 0);

                        const html = `
                          <div style="font-weight:600;margin-bottom:4px;">${
                            d.Area
                          }</div>
                          <div><b>${d.Item}</b></div>
                          <div>${d.Element}</div>
                          <div style="margin-top:6px;">
                            <b>${m.label} ${yr}</b>: ${d.value.toFixed(3)}
                          </div>
                          ${
                            d.flag
                              ? `<div style="margin-top:6px;opacity:.85;">Flag: ${d.flag}</div>`
                              : ""
                          }
                          ${
                            d.note
                              ? `<div style="opacity:.85;">Note: ${d.note}</div>`
                              : ""
                          }
                        `;

                        setTip({ x: cx + 12, y: cy + 12, visible: true, html });
                      }}
                      onMouseLeave={() =>
                        setTip((t) => ({ ...t, visible: false }))
                      }
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {tip.visible && (
          <div
            style={{
              position: "absolute",
              left: tip.x,
              top: tip.y,
              background: "white",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,.12)",
              pointerEvents: "none",
              width: 280,
              fontSize: 12,
              lineHeight: 1.25,
            }}
            dangerouslySetInnerHTML={{ __html: tip.html }}
          />
        )}
      </div>
    </div>
  );
}
