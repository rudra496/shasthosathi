// ShasthoSathi scheduler — PURE date logic (ANC contacts + Bangladesh EPI). Testable.
// Sources: WHO 2016 ANC (8 contacts: 12,20,26,30,34,36,38,40 weeks);
// Bangladesh EPI: BCG birth; Penta/OPV/PCV 6,10,14 wk; IPV 6,14 wk; MR-1 9 mo; MR-2 15-18 mo.
// (see app/data/clinical_content.json)

export const ANC_WEEKS = [12, 20, 26, 30, 34, 36, 38, 40];

export const EPI_SCHEDULE = [
  { id: "bcg", label: "BCG", daysFromBirth: 0 },
  { id: "penta1", label: "Penta-1 / OPV-1 / PCV-1 / IPV-1", daysFromBirth: 42 },
  { id: "penta2", label: "Penta-2 / OPV-2 / PCV-2", daysFromBirth: 70 },
  { id: "penta3", label: "Penta-3 / OPV-3 / PCV-3 / IPV-2", daysFromBirth: 98 },
  { id: "mr1", label: "MR-1", daysFromBirth: 270 },
  { id: "mr2", label: "MR-2", daysFromBirth: 545 }, // 15-18 months -> use 18 mo window start 545? spec: 15-18 mo; we schedule at 18 months (545 d) to be safe within window
];

function iso(date) {
  return date.toISOString().slice(0, 10);
}

/** @param {string} lmpISO first day of last menstrual period (YYYY-MM-DD) */
export function ancDates(lmpISO) {
  const lmp = new Date(lmpISO + "T00:00:00Z");
  if (isNaN(lmp.getTime())) return { error: "invalid_date" };
  return {
    contacts: ANC_WEEKS.map((w) => ({
      week: w,
      date: iso(new Date(lmp.getTime() + w * 7 * 86400000)),
    })),
    edd: iso(new Date(lmp.getTime() + 280 * 86400000)),
  };
}

/** @param {string} birthISO child's date of birth (YYYY-MM-DD) */
export function epiDates(birthISO) {
  const b = new Date(birthISO + "T00:00:00Z");
  if (isNaN(b.getTime())) return { error: "invalid_date" };
  return {
    doses: EPI_SCHEDULE.map((d) => ({
      id: d.id, label: d.label,
      date: iso(new Date(b.getTime() + d.daysFromBirth * 86400000)),
    })),
  };
}

/** Build a plain-text SMS reminder (bilingual-safe). */
export function smsText(kind, name, items, lang = "bn") {
  const lines = items.map((x) => `${x.date}: ${x.label}`);
  if (lang === "bn") {
    const head = kind === "anc" ? "প্রিয় ${n}, আপনার গর্ভাবস্থার চেকআপ:" : "প্রিয় ${n}, শিশুর টিকার সময়:";
    return head.replace("${n}", name) + "\n" + lines.join("\n") + "\n- স্বাস্থ্যসাথী";
  }
  const head = kind === "anc" ? `Dear ${name}, your ANC check-ups:` : `Dear ${name}, child vaccine dates:`;
  return head + "\n" + lines.join("\n") + "\n- ShasthoSathi";
}
