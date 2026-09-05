// ShasthoSathi triage engine — PURE, deterministic, testable. No DOM, no storage.
// Clinical basis (see app/data/clinical_content.json for sources):
//  - WHO 2009 dengue guidelines "warning signs" list (validated: Hadinegoro 2012,
//    doi:10.1179/2046904712z.00000000052)
//  - Severe-dengue proxies operationalized at community level + IMCI generic danger signs
//  - Home care: WHO fact sheet + CDC clinical guidance (paracetamol only; avoid NSAIDs)

export const SYMPTOM_KEYS = [
  "fever", "severe_abdominal", "persistent_vomiting", "bleeding", "lethargy",
  "shock", "breathing", "convulsion", "unconscious", "unable_drink",
  "vomit_all", "headache", "muscle", "nausea", "rash",
];

// WHO 2009 warning signs (app-reportable subset + clinician items)
export const WARNING_SIGNS = [
  "severe_abdominal", "persistent_vomiting", "bleeding", "lethargy", "fluid_acc",
];

// Severe-dengue proxies / IMCI danger signs -> emergency
export const RED_FLAGS = [
  "shock", "breathing", "convulsion", "unconscious", "unable_drink", "vomit_all",
  "severe_bleeding",
];

// "bleeding" in the UI is mucosal bleeding (warning sign); "severe_bleeding" is
// frank hemorrhage requiring emergency care. Kept as distinct keys.

export const DENGUE_COMPATIBLE = ["fever", "headache", "muscle", "nausea", "rash"];

export const ADVICE = {
  all: ["advice_paracetamol", "advice_no_nsaids", "advice_fluids"],
  possible: ["advice_monitor", "advice_return"],
  refer: ["advice_return"],
};

export const LEVELS = {
  EMERGENCY: "level_emergency",
  REFER: "level_refer",
  POSSIBLE: "level_possible",
  EARLY: "level_early",
  GENERAL: "level_general",
};

/**
 * @param {object} input
 * @param {string[]} input.symptoms   subset of SYMPTOM_KEYS (+ RED_FLAGS extras)
 * @param {number}   input.feverDays
 * @param {"child"|"adult"|"elder"} input.ageGroup
 * @param {boolean}  [input.pregnant]
 * @returns {{level:keyof LEVELS, levelLabel:string, triggers:string[], advice:string[],
 *            notes:string[]}}
 */
export function triage(input) {
  const s = new Set(input.symptoms || []);
  const triggers = [];
  const notes = [];

  const redHit = RED_FLAGS.filter((k) => s.has(k));
  const warnHit = ["severe_abdominal", "persistent_vomiting", "bleeding", "lethargy"]
    .filter((k) => s.has(k));

  const compatCount = DENGUE_COMPATIBLE.filter((k) => s.has(k)).length;
  const feverDays = Number(input.feverDays) || 0;

  let level;
  if (redHit.length > 0) {
    level = "EMERGENCY";
    triggers.push(...redHit);
  } else if (warnHit.length > 0) {
    level = "REFER";
    triggers.push(...warnHit);
  } else if (compatCount >= 2 && feverDays >= 2) {
    level = "POSSIBLE";
    triggers.push(...DENGUE_COMPATIBLE.filter((k) => s.has(k)), "fever_" + feverDays + "d");
  } else if (compatCount >= 2 || (s.has("fever") && feverDays >= 1)) {
    level = "EARLY";
    triggers.push(...DENGUE_COMPATIBLE.filter((k) => s.has(k)));
    notes.push("early_monitor");
  } else {
    level = "GENERAL";
    notes.push("recheck_if_worse");
  }

  // modifiers (never lower the level, only add notes)
  if (input.ageGroup === "child") notes.push("child_lower_threshold");
  if (input.pregnant) notes.push("pregnant_anc");
  if (level === "POSSIBLE" && feverDays >= 3 && feverDays <= 7) notes.push("critical_window");

  const advice = [];
  if (level === "EMERGENCY" || level === "REFER") advice.push(...ADVICE.refer);
  if (level === "POSSIBLE" || level === "EARLY") advice.push(...ADVICE.possible);
  advice.push(...ADVICE.all);

  return { level, levelLabel: LEVELS[level], triggers, advice, notes };
}

/** Parse a free-text/voice transcript into symptom flags (keyword-based, offline).
 *  This is the offline fallback for voice intake; deterministic and explainable. */
export function parseTranscript(text, lang = "bn") {
  const t = (text || "").toLowerCase();
  const map = lang === "bn" ? {
    fever: ["জ্বর"], headache: ["মাথা ব্যথা", "মাথাব্যথা", "চোখের পেছন"],
    muscle: ["শরীর ব্যথা", "অস্থি", "জোড়া"], nausea: ["বমিভাব", "বমি"],
    rash: ["র‍্যাশ", "দাগ", "চুলকানি"],
    severe_abdominal: ["পেটে ব্যথা", "পেট ব্যথা", "পেটে তীব্র"],
    persistent_vomiting: ["বারবার বমি"], bleeding: ["রক্ত", "মাড়ি", "নাক দিয়ে"],
    lethargy: ["অলস", "দুর্বল লাগ", "অস্থির"],
    shock: ["ঠান্ডা", "আর্দ্র"], breathing: ["শ্বাস"], convulsion: ["খিঁচুনি"],
    unconscious: ["অচেতন", "জ্ঞান নেই"], unable_drink: ["পান করতে পার"],
    vomit_all: ["সব বমি"],
  } : {
    fever: ["fever"], headache: ["headache", "behind my eyes"], muscle: ["body ache", "joint"],
    nausea: ["nausea", "vomit"], rash: ["rash"],
    severe_abdominal: ["abdominal pain", "stomach pain", "belly pain"],
    persistent_vomiting: ["persistent vomiting", "vomiting a lot"],
    bleeding: ["bleeding", "gums", "nosebleed"], lethargy: ["letharg", "restless", "weak"],
    shock: ["clammy", "cold skin"], breathing: ["breath"], convulsion: ["convulsion", "seizure"],
    unconscious: ["unconscious", "confused"], unable_drink: ["cannot drink", "can't drink"],
    vomit_all: ["vomiting everything"],
  };
  const hits = [];
  for (const [key, words] of Object.entries(map)) {
    if (words.some((w) => t.includes(w))) hits.push(key);
  }
  return [...new Set(hits)];
}
