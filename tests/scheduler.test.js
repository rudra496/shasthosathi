import { describe, it, expect } from "vitest";
import { ancDates, epiDates, smsText, ANC_WEEKS, EPI_SCHEDULE } from "../app/assets/js/scheduler.js";
import { t, STRINGS } from "../app/assets/js/i18n.js";

describe("ANC scheduler (WHO 2016, 8 contacts)", () => {
  it("returns exactly 8 contacts with the WHO weeks", () => {
    const r = ancDates("2026-01-01");
    expect(r.contacts.map((c) => c.week)).toEqual(ANC_WEEKS);
    expect(r.contacts).toHaveLength(8);
  });
  it("computes dates from LMP (12 weeks after 2026-01-01 = 2026-03-26)", () => {
    const r = ancDates("2026-01-01");
    const c12 = r.contacts.find((c) => c.week === 12);
    expect(c12.date).toBe(new Date(new Date("2026-01-01T00:00:00Z").getTime() + 84 * 86400000).toISOString().slice(0, 10));
  });
  it("EDD is LMP + 280 days", () => {
    const r = ancDates("2026-01-01");
    expect(r.edd).toBe(new Date(new Date("2026-01-01T00:00:00Z").getTime() + 280 * 86400000).toISOString().slice(0, 10));
  });
  it("invalid date -> error, no crash", () => {
    expect(ancDates("not-a-date").error).toBe("invalid_date");
    expect(ancDates("").error).toBe("invalid_date");
  });
});

describe("Bangladesh EPI scheduler", () => {
  it("covers BCG birth, 6/10/14 weeks, MR-1 9 months, MR-2", () => {
    const r = epiDates("2026-01-01");
    const ids = r.doses.map((d) => d.id);
    expect(ids).toEqual(["bcg", "penta1", "penta2", "penta3", "mr1", "mr2"]);
    const d = (id) => r.doses.find((x) => x.id === id).date;
    expect(d("bcg")).toBe("2026-01-01");
    expect(d("penta1")).toBe(new Date(new Date("2026-01-01T00:00:00Z").getTime() + 42 * 86400000).toISOString().slice(0, 10));
    expect(d("mr1")).toBe(new Date(new Date("2026-01-01T00:00:00Z").getTime() + 270 * 86400000).toISOString().slice(0, 10));
  });
  it("invalid date -> error", () => {
    expect(epiDates("bad").error).toBe("invalid_date");
  });
  it("schedule matches verified national EPI doses count", () => {
    expect(EPI_SCHEDULE.length).toBe(6);
  });
});

describe("SMS reminder text", () => {
  it("includes dates, labels, and signature (both languages)", () => {
    const r = epiDates("2026-01-01");
    const items = r.doses.map((d) => ({ date: d.date, label: d.label }));
    for (const lang of ["bn", "en"]) {
      const sms = smsText("epi", "Asha", items, lang);
      expect(sms).toContain(items[0].date);
      expect(sms).toContain("BCG");
      if (lang === "bn") expect(sms).toContain("স্বাস্থ্যসাথী");
      else expect(sms.toLowerCase()).toContain("shasthosathi");
    }
  });
});

describe("i18n completeness", () => {
  it("every Bangla key exists in English", () => {
    const missing = Object.keys(STRINGS.bn).filter((k) => !(k in STRINGS.en));
    expect(missing).toEqual([]);
  });
  it("every English key exists in Bangla", () => {
    const missing = Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.bn));
    expect(missing).toEqual([]);
  });
  it("t() falls back to Bangla then key", () => {
    expect(t("app_name", "en")).toBe("ShasthoSathi");
    expect(t("app_name", "xx")).toBe("স্বাস্থ্যসাথী");
    expect(t("no_such_key_xyz")).toBe("no_such_key_xyz");
  });
});

describe("verified data integrity (zero-invention guard)", () => {
  it("monthly 2023 series sums to the verified total 321,179", async () => {
    const fs = await import("node:fs");
    const d = JSON.parse(fs.readFileSync(new URL("../app/data/dengue_monthly_2023.json", import.meta.url), "utf-8"));
    expect(d.months.reduce((a, [, v]) => a + v, 0)).toBe(321179);
  });
  it("division populations sum to the verified census total 169,828,911", async () => {
    const fs = await import("node:fs");
    const d = JSON.parse(fs.readFileSync(new URL("../app/data/division_population.json", import.meta.url), "utf-8"));
    expect(Object.values(d.divisions).reduce((a, b) => a + b, 0)).toBe(169828911);
  });
  it("annual table carries source strings (no unsourced numbers)", async () => {
    const fs = await import("node:fs");
    const d = JSON.parse(fs.readFileSync(new URL("../app/data/dengue_annual.json", import.meta.url), "utf-8"));
    expect(d.sources.length).toBeGreaterThan(0);
    for (const y of d.years) { expect(y.cases).toBeGreaterThan(0); expect(y.deaths).toBeGreaterThanOrEqual(0); }
  });
});
