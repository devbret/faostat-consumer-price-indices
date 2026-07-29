import { select, piecewise, interpolateRgb, interpolateViridis } from "d3";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const seqLight = (t) => interpolateViridis(1 - t);
const seqDark = interpolateViridis;

const DIV_LIGHT = [
  "#0d366b",
  "#2a78d6",
  "#86b6ef",
  "#f0efec",
  "#eb9c94",
  "#d03b3b",
  "#7a1e1e",
];
const DIV_DARK = [
  "#86b6ef",
  "#5598e7",
  "#256abf",
  "#383835",
  "#a63530",
  "#e34948",
  "#e66767",
];

const FLAG_LABELS = {
  A: "Official figure",
  E: "Estimated value",
  I: "Imputed value",
  P: "Provisional value",
  T: "Unofficial figure",
  X: "Figure from international organizations",
};

const MARGIN = { top: 26, right: 8, bottom: 8, left: 48 };
const MIN_CELL_W = 14;
const MIN_CELL_H = 12;
const GAP = 2;

const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

function formatValue(v) {
  return v.toFixed(Math.abs(v) >= 100 ? 1 : 2);
}

export function createHeatmap(els, { yearMin, yearMax }) {
  const years = [];
  for (let y = yearMin; y <= yearMax; y++) years.push(y);

  let cellW = MIN_CELL_W;
  let cellH = MIN_CELL_H;
  let width = MARGIN.left + years.length * cellW + MARGIN.right;
  let height = MARGIN.top + 12 * cellH + MARGIN.bottom;

  const svg = select(els.chart).attr("role", "img");

  svg
    .selectAll("text.year-label")
    .data(years)
    .join("text")
    .attr("class", "year-label")
    .attr("y", MARGIN.top - 9)
    .attr("text-anchor", "middle")
    .attr("font-size", 10)
    .text((y) => y);

  svg
    .selectAll("text.month-label")
    .data(MONTHS_SHORT)
    .join("text")
    .attr("class", "month-label")
    .attr("x", MARGIN.left - 8)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 11)
    .text((m) => m);

  const cellData = [];
  years.forEach((year, col) => {
    for (let row = 0; row < 12; row++) {
      cellData.push({ year, month: row + 1, x: 0, y: 0, col, row });
    }
  });

  const cells = svg
    .selectAll("rect.cell")
    .data(cellData)
    .join("rect")
    .attr("class", "cell")
    .attr("rx", 2)
    .style("fill", "var(--cell-empty)");

  const focusRing = svg
    .append("rect")
    .attr("class", "focus-ring")
    .attr("rx", 2)
    .style("display", "none");

  function layout() {
    const availW = els.scroll.clientWidth;
    const availH = els.scroll.clientHeight;
    if (!availW || !availH) return;

    cellW = Math.max(
      MIN_CELL_W,
      Math.floor((availW - MARGIN.left - MARGIN.right) / years.length),
    );
    cellH = Math.max(
      MIN_CELL_H,
      Math.floor((availH - MARGIN.top - MARGIN.bottom) / 12),
    );
    width = MARGIN.left + years.length * cellW + MARGIN.right;
    height = MARGIN.top + 12 * cellH + MARGIN.bottom;
    svg.attr("width", width).attr("height", height);

    svg
      .selectAll("text.year-label")
      .attr("x", (y, i) => MARGIN.left + i * cellW + cellW / 2)
      .attr("display", (y, i) => (cellW < 26 && i % 2 ? "none" : null));
    svg
      .selectAll("text.month-label")
      .attr("y", (m, i) => MARGIN.top + i * cellH + cellH / 2);

    for (const d of cellData) {
      d.x = MARGIN.left + d.col * cellW + GAP / 2;
      d.y = MARGIN.top + d.row * cellH + GAP / 2;
    }
    cells
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", cellW - GAP)
      .attr("height", cellH - GAP);

    focusRing.attr("width", cellW - GAP).attr("height", cellH - GAP);
    if (focusPos) {
      const d = cellData[focusPos.col * 12 + focusPos.row];
      focusRing.attr("x", d.x).attr("y", d.y);
    }
  }

  new ResizeObserver(layout).observe(els.scroll);

  let lookup = new Map();
  let colorFor = null;
  let currentArea = "";
  let currentItem = "";
  let currentUnit = "";
  let lastUpdate = null;
  let focusPos = null;

  function withUnit(v) {
    return currentUnit ? `${formatValue(v)} ${currentUnit}` : formatValue(v);
  }

  function rowAt(d) {
    return lookup.get(d.year + "-" + d.month);
  }

  function buildScale(rows, globalExtent) {
    let min = Infinity;
    let max = -Infinity;
    for (const r of rows) {
      if (r.value < min) min = r.value;
      if (r.value > max) max = r.value;
    }
    if (min === Infinity) return { colorFor: null, min: NaN, max: NaN };
    if (min === max) {
      min -= 1;
      max += 1;
    }

    const dark = darkScheme.matches;
    const diverging =
      globalExtent && globalExtent[0] < 0 && globalExtent[1] > 0;

    if (diverging) {
      const ramp = piecewise(interpolateRgb, dark ? DIV_DARK : DIV_LIGHT);
      const neg = Math.min(min, 0) || -1;
      const pos = Math.max(max, 0) || 1;
      const t = (v) => (v < 0 ? 0.5 - 0.5 * (v / neg) : 0.5 + 0.5 * (v / pos));
      return { colorFor: (v) => ramp(t(v)), min, max, diverging: true };
    }

    const ramp = dark ? seqDark : seqLight;
    return {
      colorFor: (v) => ramp((v - min) / (max - min)),
      min,
      max,
      diverging: false,
    };
  }

  const tip = els.tooltip;

  function tipLine(className, text) {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = text;
    tip.appendChild(div);
  }

  function showTooltip(d) {
    const row = rowAt(d);
    if (!row) {
      hideTooltip();
      return;
    }

    tip.replaceChildren();
    tipLine("tip-value", withUnit(row.value));
    tipLine("tip-when", `${MONTHS_FULL[d.month - 1]} ${d.year}`);
    tipLine("tip-series", `${currentArea} - ${currentItem}`);
    if (row.flag) {
      tipLine("tip-meta", `Flag: ${FLAG_LABELS[row.flag] || row.flag}`);
    }
    if (row.note) tipLine("tip-meta", `Note: ${row.note}`);
    tip.hidden = false;

    const scroll = els.scroll;
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;
    const viewRight = scroll.scrollLeft + scroll.clientWidth;

    let left = d.x + cellW + 6;
    if (left + tipW > viewRight) left = d.x - tipW - 8;
    left = Math.max(scroll.scrollLeft, Math.min(left, viewRight - tipW));

    let top = d.y - 4;
    top = Math.max(0, Math.min(top, height - tipH));

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tip.hidden = true;
  }

  cells
    .on("pointermove", (event, d) => showTooltip(d))
    .on("pointerleave", hideTooltip);

  function moveFocus(dCol, dRow, absolute) {
    if (absolute) {
      focusPos = absolute;
    } else if (!focusPos) {
      focusPos = { col: years.length - 1, row: 0 };
    } else {
      focusPos = {
        col: Math.max(0, Math.min(years.length - 1, focusPos.col + dCol)),
        row: Math.max(0, Math.min(11, focusPos.row + dRow)),
      };
    }

    const d = cellData[focusPos.col * 12 + focusPos.row];
    focusRing.style("display", null).attr("x", d.x).attr("y", d.y);

    const scroll = els.scroll;
    if (d.x < scroll.scrollLeft) {
      scroll.scrollLeft = d.x - cellW;
    } else if (d.x + cellW > scroll.scrollLeft + scroll.clientWidth) {
      scroll.scrollLeft = d.x + 2 * cellW - scroll.clientWidth;
    }

    showTooltip(d);
    const row = rowAt(d);
    els.announcer.textContent = row
      ? `${MONTHS_FULL[d.month - 1]} ${d.year}: ${withUnit(row.value)} - ${currentArea}`
      : `${MONTHS_FULL[d.month - 1]} ${d.year}: no data`;
  }

  function clearFocus() {
    focusPos = null;
    focusRing.style("display", "none");
    hideTooltip();
  }

  els.scroll.addEventListener("keydown", (event) => {
    const moves = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (moves[event.key]) {
      event.preventDefault();
      moveFocus(...moves[event.key]);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0, 0, { col: 0, row: focusPos ? focusPos.row : 0 });
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(0, 0, {
        col: years.length - 1,
        row: focusPos ? focusPos.row : 0,
      });
    } else if (event.key === "Escape") {
      clearFocus();
    }
  });
  els.scroll.addEventListener("blur", clearFocus);

  function update({ rows, area, item, unit, globalExtent }) {
    lastUpdate = { rows, area, item, unit, globalExtent };
    currentArea = area;
    currentItem = item;
    currentUnit = unit || "";
    clearFocus();

    lookup = new Map();
    for (const r of rows) lookup.set(r.year + "-" + r.month, r);

    const scale = buildScale(rows, globalExtent);
    colorFor = scale.colorFor;

    cells
      .classed("has-data", (d) => Boolean(rowAt(d)))
      .style("fill", (d) => {
        const row = rowAt(d);
        return row && colorFor ? colorFor(row.value) : "var(--cell-empty)";
      });

    svg.attr(
      "aria-label",
      rows.length
        ? `Month-by-year heatmap of ${item} for ${area}, ${yearMin} to ${yearMax}`
        : `No data for ${item} in ${area}`,
    );

    if (!rows.length) {
      els.empty.replaceChildren();
      const strong = document.createElement("strong");
      strong.textContent = `No data for ${area}`;
      const detail = document.createElement("div");
      detail.textContent = `${item} is not reported for this country.`;
      els.empty.append(strong, detail);
      els.empty.hidden = false;
    } else {
      els.empty.hidden = true;
    }

    return scale;
  }

  darkScheme.addEventListener("change", () => {
    if (lastUpdate) update(lastUpdate);
  });

  return { update };
}
