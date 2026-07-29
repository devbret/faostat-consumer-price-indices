from pathlib import Path
import re
import pandas as pd

INPUT_FILE = Path("data/ConsumerPriceIndices_E_All_Data.csv")
OUTPUT_FILE = Path("cpi_long.csv")

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}

YEAR_COL_RE = re.compile(r"^Y(\d{4})([FN])?$")


def month_to_num(m):
    if pd.isna(m):
        return pd.NA
    key = str(m).strip().lower()
    return MONTH_MAP.get(key, pd.NA)


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Missing input file: {INPUT_FILE.resolve()}")

    df = pd.read_csv(INPUT_FILE, dtype=str, low_memory=False)

    year_related = [c for c in df.columns if YEAR_COL_RE.match(str(c).strip())]
    id_cols = [c for c in df.columns if c not in year_related]

    years = sorted({
        int(YEAR_COL_RE.match(c).group(1))
        for c in year_related
        if YEAR_COL_RE.match(c).group(2) is None
    })

    pieces = []
    for y in years:
        val_col = f"Y{y}"
        flag_col = f"Y{y}F"
        note_col = f"Y{y}N"

        if val_col not in df.columns:
            continue

        tmp = df[id_cols].copy()
        tmp["year"] = y

        tmp["value"] = pd.to_numeric(df[val_col], errors="coerce")

        tmp["flag"] = df[flag_col] if flag_col in df.columns else pd.NA
        tmp["note"] = df[note_col] if note_col in df.columns else pd.NA

        pieces.append(tmp)

    out = pd.concat(pieces, ignore_index=True)

    month_col = None
    for c in out.columns:
        if str(c).strip().lower() in ("months", "month"):
            month_col = c
            break

    if month_col:
        out[month_col] = out[month_col].astype(str).str.strip()
        out["month_num"] = out[month_col].map(month_to_num)
        out = out.dropna(subset=["month_num"])
        out["month_num"] = out["month_num"].astype(int)

    out = out.dropna(subset=["value"])

    keep = [
        c
        for c in ("Area", "Item", "Unit", "year", "month_num", "value", "flag", "note")
        if c in out.columns
    ]
    out = out[keep]

    sort_cols = [c for c in ("Area", "Item", "year", "month_num") if c in out.columns]
    out.sort_values(sort_cols, inplace=True, kind="mergesort")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(OUTPUT_FILE, index=False)

    print(f"Wrote {len(out):,} rows")
    print(f"Output: {OUTPUT_FILE.resolve()}")


if __name__ == "__main__":
    main()
