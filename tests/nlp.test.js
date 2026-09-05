import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import { classify, tokenize, wordsOf } from "../app/assets/js/nlp.js";

const model = JSON.parse(fs.readFileSync(new URL("../app/data/nlp_model.json", import.meta.url), "utf-8"));

beforeAll(() => {});

describe("trained NLP model — file integrity", () => {
  it("carries honest metrics: micro-F1 >= 0.90, negation rejection >= 0.9", () => {
    expect(model.metrics.micro_f1).toBeGreaterThanOrEqual(0.90);
    expect(model.metrics.negation_rejection_rate).toBeGreaterThanOrEqual(0.90);
    expect(model.metrics.train_sentences).toBeGreaterThan(3000);
    expect(model.metrics.seed).toBe(20260906);
  });
  it("is small enough for on-device use (< 200 KB)", () => {
    const kb = Buffer.byteLength(JSON.stringify(model)) / 1024;
    expect(kb).toBeLessThan(200);
  });
  it("discloses synthetic-corpus provenance", () => {
    expect(model.description).toMatch(/template-generated/i);
  });
});

describe("JS inference parity with the trained model", () => {
  it("detects multi-symptom Bangla", () => {
    const flags = classify(model, "তার তিন দিন ধরে জ্বর আছে, পেটে প্রচণ্ড ব্যথা হচ্ছে");
    const s = flags.map((f) => f.symptom);
    expect(s).toContain("fever");
    expect(s).toContain("severe_abdominal");
  });
  it("detects Banglish", () => {
    const s = classify(model, "bar bar bomi hocche, shash koshto").map((f) => f.symptom);
    expect(s).toContain("persistent_vomiting");
    expect(s).toContain("breathing");
  });
  it("detects English", () => {
    const s = classify(model, "high fever with bleeding gums and severe abdominal pain").map((f) => f.symptom);
    expect(s).toContain("bleeding");
    expect(s).toContain("severe_abdominal");
  });
  it("NEGATION: 'জ্বর নেই' must NOT flag fever", () => {
    const s = classify(model, "আমার জ্বর নেই").map((f) => f.symptom);
    expect(s).not.toContain("fever");
  });
  it("NEGATION: 'no fever' must NOT flag fever", () => {
    const s = classify(model, "no fever, only mild cough").map((f) => f.symptom);
    expect(s).not.toContain("fever");
  });
  it("negation + real symptom: 'জ্বর নেই কিন্তু পেট ব্যথা' flags pain, not fever", () => {
    const s = classify(model, "জ্বর নেই কিন্তু পেট ব্যথা হচ্ছে").map((f) => f.symptom);
    expect(s).not.toContain("fever");
    expect(s).toContain("severe_abdominal");
  });
  it("background chatter -> no flags", () => {
    expect(classify(model, "ধন্যবাদ, কাল আসবো").length).toBe(0);
  });
  it("no crash on empty/garbage", () => {
    expect(classify(model, "").length).toBe(0);
    expect(classify(model, null).length).toBe(0);
    expect(tokenize(null)).toEqual([]);
    expect(wordsOf("")).toEqual([]);
  });
});

describe("NLP -> engine pipeline parity", () => {
  it("classifier flags feed the WHO engine with the expected levels", async () => {
    const { triage } = await import("../app/assets/js/engine.js");
    const r = triage({
      symptoms: classify(model, "তিন দিন ধরে জ্বর, পেটে ব্যথা, বারবার বমি").map((f) => f.symptom),
      feverDays: 4, ageGroup: "adult",
    });
    expect(r.level).toBe("REFER");
  });
});
