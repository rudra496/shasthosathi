#!/usr/bin/env python3
"""2026 current-year data from the LIVE DGHS HEOC Dengue Dashboard
(dashboard.dghs.gov.bd, 'Last Updated: 05-Sep-2026'; extracted via browser 2026-09-06).
The dashboard is JS-rendered: values below were read from the rendered page and are
internally consistent — monthly cases sum EXACTLY to the YTD total, as do division rows."""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
APPDATA = os.path.join(ROOT, "..", "app", "data")

def w(name, obj):
    with open(os.path.join(APPDATA, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print("wrote", name)

Y2026 = {
    "source": "DGHS Health Emergency Operation Center Dengue Dashboard "
              "(dashboard.dghs.gov.bd/pages/heoc_dengue_v1.php) — 'Last Updated: 05-Sep-2026'. "
              "JS-rendered page read via browser on 2026-09-06 (curl cannot render it). "
              "September is PARTIAL (through 5 Sep; W35: 7,446 cases / 23 deaths in last week).",
    "kpi": {"cases": 41032, "deaths": 113, "as_of": "05-Sep-2026"},
    "monthly_cases": [["2026-01", 1081], ["2026-02", 409], ["2026-03", 353], ["2026-04", 640],
                       ["2026-05", 714], ["2026-06", 2907], ["2026-07", 9206], ["2026-08", 20536],
                       ["2026-09", 5186]],
    "monthly_deaths": [["2026-01", 2], ["2026-02", 2], ["2026-03", 0], ["2026-04", 0],
                        ["2026-05", 1], ["2026-06", 13], ["2026-07", 36], ["2026-08", 43],
                        ["2026-09", 16]],
    "division_2026": {
        "source_note": "City corporations DNCC + DSCC are geographically inside Dhaka division; "
                       "aggregated here so division rows sum to the national YTD (verified below).",
        "cases": {"Dhaka": 16312, "Khulna": 6487, "Barishal": 6379, "Chattogram": 6178,
                   "Mymensingh": 2257, "Rajshahi": 2230, "Rangpur": 1005, "Sylhet": 184},
        "cases_raw": {"Dhaka(Out of CC)": 6017, "DNCC": 4895, "DSCC": 5400, "Barishal": 6379,
                       "Chattogram": 6178, "Khulna": 6487, "Mymensingh": 2257, "Rajshahi": 2230,
                       "Rangpur": 1005, "Sylhet": 184},
        "deaths": {"Dhaka": 58, "Khulna": 19, "Barishal": 10, "Chattogram": 8,
                    "Mymensingh": 12, "Rajshahi": 4, "Rangpur": 1, "Sylhet": 1},
    },
}

# ---- hard integrity assertions (fail loudly if numbers drift) ----
mc = sum(v for _, v in Y2026["monthly_cases"]); md = sum(v for _, v in Y2026["monthly_deaths"])
assert mc == 41032, f"monthly cases sum {mc} != YTD 41,032"
assert md == 113, f"monthly deaths sum {md} != YTD 113"
assert sum(Y2026["division_2026"]["cases"].values()) == 41032, "division cases must sum to YTD"
assert sum(Y2026["division_2026"]["deaths"].values()) == 113, "division deaths must sum to YTD"
raw = Y2026["division_2026"]["cases_raw"]
assert raw["Dhaka(Out of CC)"] + raw["DNCC"] + raw["DSCC"] == Y2026["division_2026"]["cases"]["Dhaka"]
w("dengue_2026_ytd.json", Y2026)
print("ALL 2026 ASSETS BUILT — sums verified:", mc, "cases /", md, "deaths")
