import { describe, it, expect } from "vitest";
import { parseSms, buildReplySms, smsInfo, SMS_CODES } from "../app/assets/js/sms.js";
import { triage } from "../app/assets/js/engine.js";

describe("SMS code parsing", () => {
  it("parses a typical DENGUE SMS into symptom keys", () => {
    const keys = parseSms("DENGUE FEVER PAIN VOMITING");
    expect(keys).toContain("fever");
    expect(keys).toContain("severe_abdominal");
    expect(keys).toContain("persistent_vomiting");
  });
  it("accepts Banglish aliases", () => {
    expect(parseSms("JOR PET BOMI3")).toContain("severe_abdominal");
    expect(parseSms("JOR PET BOMI3")).toContain("fever");
  });
  it("is case-insensitive and ignores noise", () => {
    expect(parseSms("dengue  fever ... PAIN!")).toEqual(expect.arrayContaining(["fever", "severe_abdominal"]));
  });
  it("empty/garbage -> no keys, no crash", () => {
    expect(parseSms("")).toEqual([]);
    expect(parseSms(null)).toEqual([]);
    expect(parseSms("HELLO WORLD 123")).toEqual([]);
  });
  it("SMS codes map only to known engine symptom keys", () => {
    const KNOWN = ["fever","headache","muscle","nausea","rash","severe_abdominal","persistent_vomiting",
      "bleeding","lethargy","shock","breathing","convulsion","unconscious","unable_drink","vomit_all"];
    for (const v of Object.values(SMS_CODES)) expect(KNOWN).toContain(v);
  });
  it("SMS-driven triage matches the engine (channel parity)", () => {
    const keys = parseSms("DENGUE FEVER PAIN VOMITING");
    expect(triage({ symptoms: keys, feverDays: 3, ageGroup: "adult" }).level).toBe("REFER");
    expect(triage({ symptoms: parseSms("DENGUE SHOCK"), feverDays: 1, ageGroup: "adult" }).level).toBe("EMERGENCY");
  });
});

describe("reply SMS builder", () => {
  it("gives emergency wording with 999 for EMERGENCY (both languages)", () => {
    for (const lang of ["bn", "en"]) {
      const m = buildReplySms("EMERGENCY", lang);
      expect(m).toContain(lang === "bn" ? "৯৯৯" : "999");
      expect(m).toMatch(/hospital|হাসপাতাল/i);
    }
  });
  it("refer advice mentions 16263 and today", () => {
    const m = buildReplySms("REFER", "en");
    expect(m).toContain("16263");
    expect(m).toMatch(/TODAY/i);
  });
  it("never suggests NSAIDs as positive advice", () => {
    for (const lv of ["EMERGENCY", "REFER", "POSSIBLE", "EARLY", "GENERAL"]) {
      expect(buildReplySms(lv, "en")).not.toMatch(/take aspirin|take ibuprofen/i);
    }
  });
});

describe("GSM-7 / UCS-2 segmentation (telecom-real)", () => {
  it("short English reply = GSM-7, 1 segment", () => {
    const i = smsInfo(buildReplySms("EMERGENCY", "en"));
    expect(i.encoding).toBe("GSM-7");
    expect(i.segments).toBe(1);
  });
  it("Bangla reply = UCS-2 (Bangla is not in the GSM-7 basic set)", () => {
    const reply = buildReplySms("EMERGENCY", "bn");
    const i = smsInfo(reply);
    expect(i.encoding).toBe("UCS-2");
    expect(i.chars).toBeGreaterThan(0);
    expect(i.segments).toBeGreaterThanOrEqual(1);
  });
  it("long English text switches to 153-char multipart", () => {
    const i = smsInfo("A".repeat(200));
    expect(i.segments).toBe(2);
    expect(i.perSegment).toBe(153);
  });
  it("UCS-2 multipart uses 67 chars", () => {
    const i = smsInfo("ক".repeat(100));
    expect(i.encoding).toBe("UCS-2");
    expect(i.segments).toBe(2);
    expect(i.perSegment).toBe(67);
  });
  it("empty text -> zero segments, no crash", () => {
    expect(smsInfo("")).toEqual({ encoding: "GSM-7", chars: 0, segments: 0, perSegment: 160 });
  });
});
