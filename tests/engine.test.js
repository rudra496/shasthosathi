import { describe, it, expect } from "vitest";
import { triage, parseTranscript, SYMPTOM_KEYS, WARNING_SIGNS, RED_FLAGS } from "../app/assets/js/engine.js";

describe("triage engine — WHO-based levels", () => {
  it("red flags -> EMERGENCY (highest priority wins)", () => {
    const r = triage({ symptoms: ["fever", "shock"], feverDays: 4, ageGroup: "adult" });
    expect(r.level).toBe("EMERGENCY");
    expect(r.triggers).toContain("shock");
  });
  it("each individual red flag triggers EMERGENCY", () => {
    for (const flag of RED_FLAGS) {
      const r = triage({ symptoms: [flag], feverDays: 1, ageGroup: "adult" });
      expect(r.level, `flag ${flag}`).toBe("EMERGENCY");
    }
  });
  it("WHO warning sign without red flags -> REFER", () => {
    for (const w of ["severe_abdominal", "persistent_vomiting", "bleeding", "lethargy"]) {
      const r = triage({ symptoms: [w], feverDays: 3, ageGroup: "adult" });
      expect(r.level, `warning ${w}`).toBe("REFER");
    }
  });
  it("compatible symptoms + fever >= 2 days -> POSSIBLE", () => {
    const r = triage({ symptoms: ["fever", "headache", "muscle"], feverDays: 3, ageGroup: "adult" });
    expect(r.level).toBe("POSSIBLE");
  });
  it("short fever with mild symptoms -> EARLY", () => {
    const r = triage({ symptoms: ["fever", "headache"], feverDays: 1, ageGroup: "adult" });
    expect(r.level).toBe("EARLY");
  });
  it("nothing relevant -> GENERAL", () => {
    const r = triage({ symptoms: [], feverDays: 0, ageGroup: "adult" });
    expect(r.level).toBe("GENERAL");
  });
  it("advice always includes avoid-NSAIDs (bleeding risk)", () => {
    for (const symptoms of [[], ["fever"], ["fever", "shock"]]) {
      const r = triage({ symptoms, feverDays: 2, ageGroup: "adult" });
      expect(r.advice).toContain("advice_no_nsaids");
      expect(r.advice).toContain("advice_paracetamol");
    }
  });
  it("child and pregnancy modifiers add notes, never lower the level", () => {
    const base = triage({ symptoms: ["fever", "headache", "rash"], feverDays: 4, ageGroup: "adult" });
    const child = triage({ symptoms: ["fever", "headache", "rash"], feverDays: 4, ageGroup: "child" });
    const preg = triage({ symptoms: ["fever", "headache", "rash"], feverDays: 4, ageGroup: "adult", pregnant: true });
    expect(child.level).toBe(base.level);
    expect(preg.level).toBe(base.level);
    expect(child.notes).toContain("child_lower_threshold");
    expect(preg.notes).toContain("pregnant_anc");
  });
  it("critical-window note only in days 3-7", () => {
    const d2 = triage({ symptoms: ["fever", "headache", "muscle"], feverDays: 2, ageGroup: "adult" });
    const d5 = triage({ symptoms: ["fever", "headache", "muscle"], feverDays: 5, ageGroup: "adult" });
    const d8 = triage({ symptoms: ["fever", "headache", "muscle"], feverDays: 8, ageGroup: "adult" });
    expect(d2.notes).not.toContain("critical_window");
    expect(d5.notes).toContain("critical_window");
    expect(d8.notes).not.toContain("critical_window");
  });
  it("never crashes on empty/garbage input", () => {
    expect(triage({}).level).toBeDefined();
    expect(triage({ symptoms: null, feverDays: "x" }).level).toBe("GENERAL");
  });
});

describe("parseTranscript (offline voice fallback)", () => {
  it("Bangla transcript maps to symptoms", () => {
    const hits = parseTranscript("তিন দিন ধরে জ্বর আছে, মাথা ব্যথা, পেটে ব্যথা", "bn");
    expect(hits).toContain("fever");
    expect(hits).toContain("headache");
    expect(hits).toContain("severe_abdominal");
  });
  it("English transcript maps to symptoms", () => {
    const hits = parseTranscript("high fever and bleeding from gums", "en");
    expect(hits).toContain("fever");
    expect(hits).toContain("bleeding");
  });
  it("empty transcript -> no hits, no crash", () => {
    expect(parseTranscript("")).toEqual([]);
    expect(parseTranscript(null)).toEqual([]);
  });
});

describe("invariants", () => {
  it("warning signs and red flags are disjoint", () => {
    for (const w of WARNING_SIGNS) expect(RED_FLAGS).not.toContain(w);
  });
  it("all UI symptom keys are known", () => {
    expect(SYMPTOM_KEYS.length).toBeGreaterThan(10);
    expect(new Set(SYMPTOM_KEYS).size).toBe(SYMPTOM_KEYS.length);
  });
});
