import { describe, it, expect } from "vitest";
import { riskIndex, toCSV } from "../app/assets/js/risk.js";
import { triage } from "../app/assets/js/engine.js";

const COEFFS = { b0_const: 1.6141, b1_rain_lag1: 0.004, b2_rain_lag2: 0.0053, b3_rh_lag1: 0.0095 };
const REF = { rain_lag1: 300, rain_lag2: 300, rh_lag1: 80 };

describe("risk calculator (what-if teaching tool)", () => {
  it("reference features give exactly the 100 index", () => {
    expect(riskIndex(COEFFS, REF, REF)).toBe(100);
  });
  it("is monotonic in rainfall lags (more rain -> higher index)", () => {
    const a = riskIndex(COEFFS, { rain_lag1: 100, rain_lag2: 100, rh_lag1: 70 }, REF);
    const b = riskIndex(COEFFS, { rain_lag1: 200, rain_lag2: 200, rh_lag1: 75 }, REF);
    const c = riskIndex(COEFFS, { rain_lag1: 300, rain_lag2: 300, rh_lag1: 80 }, REF);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
  it("clamps to 0-100 and never goes negative", () => {
    expect(riskIndex(COEFFS, { rain_lag1: 0, rain_lag2: 0, rh_lag1: 40 }, REF)).toBeGreaterThanOrEqual(0);
    expect(riskIndex(COEFFS, { rain_lag1: 99999, rain_lag2: 99999, rh_lag1: 100 }, REF)).toBeLessThanOrEqual(100);
  });
});

describe("camp CSV export", () => {
  it("produces header + rows, quoting commas properly", () => {
    const csv = toCSV([
      { id: "P-001", level: "REFER", triggers: "severe_abdominal; persistent_vomiting" },
      { id: "P,2", level: "POSSIBLE", triggers: "" },
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("id,level,triggers");
    expect(lines[2]).toContain('"P,2"');
  });
  it("empty rows -> empty string", () => {
    expect(toCSV([])).toBe("");
  });
});

describe("camp mode reuses the ONE triage engine (no duplicated logic)", () => {
  it("same inputs -> same levels as direct engine calls", () => {
    const cases = [
      { symptoms: ["fever", "severe_abdominal"], feverDays: 3, want: "REFER" },
      { symptoms: ["fever", "headache"], feverDays: 4, want: "POSSIBLE" },
      { symptoms: ["shock"], feverDays: 1, want: "EMERGENCY" },
      { symptoms: [], feverDays: 0, want: "GENERAL" },
    ];
    for (const c of cases) expect(triage(c).level).toBe(c.want);
  });
});

describe("v2 data integrity (zero-invention guards)", async () => {
  const fs = await import("node:fs");
  const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf-8"));
  it("decade series sums to the paper's stated totals (535,970 cases / 2,300 deaths)", () => {
    const d = read("../app/data/dengue_decade_2014_2023.json");
    expect(d.cases.reduce((s, [, v]) => s + v, 0)).toBe(535970);
    expect(d.deaths.reduce((s, [, v]) => s + v, 0)).toBe(2300);
    expect(d.cases).toHaveLength(10);
  });
  it("hotlines match the verified national numbers exactly", () => {
    const h = read("../app/data/hotlines.json");
    const nums = h.lines.map((l) => l.number);
    expect(nums).toEqual(["999", "16263", "333"]);
    expect(h.sources.length).toBe(3);
  });
  it("WHO prevention facts are present with source", () => {
    const cc = read("../app/data/clinical_content.json");
    expect(cc.prevention.source).toContain("who.int");
    expect(cc.prevention.treatment_key_lines.join(" ")).toMatch(/paracetamol/i);
    expect(cc.prevention.treatment_key_lines.join(" ")).toMatch(/aspirin|ibuprofen/i);
  });
});

describe("2026 live data integrity (DGHS dashboard, accessed 2026-09-06)", async () => {
  const fs = await import("node:fs");
  const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf-8"));
  it("monthly 2026 sums EXACTLY to the dashboard YTD (41,032 / 113)", () => {
    const d = read("../app/data/dengue_2026_ytd.json");
    expect(d.monthly_cases.reduce((s, [, v]) => s + v, 0)).toBe(d.kpi.cases);
    expect(d.monthly_deaths.reduce((s, [, v]) => s + v, 0)).toBe(d.kpi.deaths);
    expect(d.kpi.cases).toBe(41032);
    expect(d.kpi.deaths).toBe(113);
  });
  it("division rows sum to YTD and DNCC+DSCC+Dhaka-out aggregation is exact", () => {
    const d = read("../app/data/dengue_2026_ytd.json");
    const div = d.division_2026;
    expect(Object.values(div.cases).reduce((a, b) => a + b, 0)).toBe(d.kpi.cases);
    expect(Object.values(div.deaths).reduce((a, b) => a + b, 0)).toBe(d.kpi.deaths);
    const raw = div.cases_raw;
    expect(raw["DNCC"] + raw["DSCC"] + raw["Dhaka(Out of CC)"]).toBe(div.cases["Dhaka"]);
  });
  it("carries access-date provenance", () => {
    const d = read("../app/data/dengue_2026_ytd.json");
    expect(d.source).toContain("05-Sep-2026");
    expect(d.kpi.as_of).toBe("05-Sep-2026");
  });
});
