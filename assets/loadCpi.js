import { csvParse } from "d3";

const MONTH_NUM = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export const KEY_SEP = "";

export async function loadCpi(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  let text;
  const total = Number(res.headers.get("Content-Length")) || 0;
  if (res.body && typeof res.body.getReader === "function") {
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (onProgress) onProgress(received, total);
    }
    const buffer = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    text = new TextDecoder().decode(buffer);
  } else {
    text = await res.text();
  }

  const rows = csvParse(text, (r) => {
    const value = Number(r.value);
    if (!Number.isFinite(value)) return undefined;

    const year = Number(r.year);
    const month =
      Number(r.month_num) ||
      MONTH_NUM[
        String(r.Months || "")
          .trim()
          .toLowerCase()
      ];
    if (!r.Area || !r.Item || !month || !Number.isFinite(year)) {
      return undefined;
    }

    return {
      area: r.Area,
      item: r.Item,
      element: r.Element || "",
      unit: r.Unit || "",
      month,
      year,
      value,
      flag: r.flag || "",
      note: r.note || "",
    };
  });

  const columns = rows.columns || [];
  const missing = ["Area", "Item", "year", "value"].filter(
    (c) => !columns.includes(c),
  );
  if (!columns.includes("month_num") && !columns.includes("Months")) {
    missing.push("month_num or Months");
  }
  if (missing.length) {
    throw new Error(
      `cpi_long.csv is missing expected column(s): ${missing.join(", ")}`,
    );
  }
  return rows;
}

export function buildIndex(rows) {
  const byKey = new Map();
  const availability = new Map();
  const itemExtent = new Map();
  const itemUnit = new Map();
  const areaSet = new Set();
  const itemSet = new Set();
  const elementSet = new Set();
  let yearMin = Infinity;
  let yearMax = -Infinity;

  for (const r of rows) {
    const key = r.area + KEY_SEP + r.item + KEY_SEP + r.element;
    let list = byKey.get(key);
    if (!list) byKey.set(key, (list = []));
    list.push(r);

    const ik = r.item + KEY_SEP + r.element;
    let areas = availability.get(ik);
    if (!areas) availability.set(ik, (areas = new Set()));
    areas.add(r.area);

    let ext = itemExtent.get(ik);
    if (!ext) itemExtent.set(ik, (ext = [Infinity, -Infinity]));
    if (r.value < ext[0]) ext[0] = r.value;
    if (r.value > ext[1]) ext[1] = r.value;

    if (r.unit && !itemUnit.has(ik)) itemUnit.set(ik, r.unit);

    areaSet.add(r.area);
    itemSet.add(r.item);
    elementSet.add(r.element);
    if (r.year < yearMin) yearMin = r.year;
    if (r.year > yearMax) yearMax = r.year;
  }

  const sortedAvailability = new Map();
  for (const [ik, areas] of availability) {
    sortedAvailability.set(ik, Array.from(areas).sort());
  }

  return {
    byKey,
    availability: sortedAvailability,
    itemExtent,
    itemUnit,
    areas: Array.from(areaSet).sort(),
    items: Array.from(itemSet).sort(),
    elements: Array.from(elementSet).sort(),
    yearMin,
    yearMax,
  };
}
