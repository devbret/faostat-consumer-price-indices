import * as d3 from "d3";
import type { CPIRecord } from "../types";

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export async function loadCpiLongCsv(
  url = "/data/cpi_long.csv"
): Promise<CPIRecord[]> {
  const rows = await d3.csv(url);

  return rows
    .map((r) => {
      const rec: CPIRecord = {
        Area: (r["Area"] ?? "").toString(),
        Item: (r["Item"] ?? "").toString(),
        Element: (r["Element"] ?? "").toString(),
        Months: (r["Months"] ?? "").toString(),
        month_num: r["month_num"] ? toNumber(r["month_num"]) : undefined,
        year: toNumber(r["year"]),
        value: toNumber(r["value"]),
        flag: r["flag"]?.toString(),
        note: r["note"]?.toString(),
      };
      return rec;
    })
    .filter(
      (d) =>
        d.Area && d.Item && d.Element && d.Months && Number.isFinite(d.year)
    );
}
