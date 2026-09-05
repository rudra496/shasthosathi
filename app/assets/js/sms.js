// ShasthoSathi SMS mode — PURE, testable. Same triage engine contract, SMS channel.
// Telecom-real details: GSM-7 (160/153 chars per segment) vs UCS-2 (70/67) segmentation.

// SMS keyword codes (sent as e.g. "DENGUE FEVER PAIN VOMIT")
export const SMS_CODES = {
  FEVER: "fever", JOR: "fever",
  HEAD: "headache", MATHA: "headache",
  BODY: "muscle", SHARIR: "muscle",
  VOMIT: "nausea", BOMI: "nausea",
  RASH: "rash", DAG: "rash",
  PAIN: "severe_abdominal", PET: "severe_abdominal",
  VOMITING: "persistent_vomiting", BOMI3: "persistent_vomiting",
  BLEED: "bleeding", ROKTO: "bleeding",
  SLEEPY: "lethargy", LOS: "lethargy",
  SHOCK: "shock", THANDA: "shock",
  BREATH: "breathing", SHWASH: "breathing",
  FIT: "convulsion", KHINCHUNI: "convulsion",
  FAINT: "unconscious", OCHETON: "unconscious",
  NORASH: "unable_drink", PANIKHAYNA: "unable_drink",
  VOMITALL: "vomit_all",
};

export function parseSms(text) {
  const words = String(text || "").toUpperCase().split(/[^A-ZÀ-ɏ\u0980-\u09FF]+/).filter(Boolean);
  const hits = new Set();
  for (const w of words) {
    const k = SMS_CODES[w];
    if (k) hits.add(k);
  }
  return [...hits];
}

/** Build the reply SMS (kept deliberately short; Bangla uses UCS-2). */
export function buildReplySms(level, lang = "bn") {
  const M = {
    bn: {
      EMERGENCY: "স্বাস্থ্যসাথী: জরুরি! এখনই হাসপাতালে যান। কল ৯৯৯। অ্যাসপিরিন/আইবুপ্রোফেন নয়।",
      REFER: "স্বাস্থ্যসাথী: বিপদ সংকেত! আজই হাসপাতালে যান। কল ১৬২৬৩।",
      POSSIBLE: "স্বাস্থ্যসাথী: সম্ভাব্য ডেঙ্গু। প্যারাসিটামল, বিশ্রাম, প্রচুর পানি। প্রতিদিন দেখুন।",
      EARLY: "স্বাস্থ্যসাথী: প্রাথমিক জ্বর। পর্যবেক্ষণ করুন; ২ দিনে না কমলে পরীক্ষা।",
      GENERAL: "স্বাস্থ্যসাথী: ডেঙ্গুর লক্ষণ স্পষ্ট নয়। খারাপ হলে ১৬২৬৩-এ কল করুন।",
    },
    en: {
      EMERGENCY: "ShasthoSathi: EMERGENCY! Go to hospital NOW. Call 999. No aspirin/ibuprofen.",
      REFER: "ShasthoSathi: WARNING SIGN. Go to hospital TODAY. Call 16263.",
      POSSIBLE: "ShasthoSathi: Possible dengue. Paracetamol, rest, plenty of fluids. Check daily.",
      EARLY: "ShasthoSathi: Early fever. Monitor; test if not settled in 2 days.",
      GENERAL: "ShasthoSathi: Not clearly dengue. Call 16263 if worse.",
    },
  };
  return (M[lang] && M[lang][level]) || M.bn[level] || "";
}

/** GSM 03.38 segmentation: GSM-7 basic set -> 160 single / 153 multipart;
 *  any char outside -> UCS-2 -> 70 single / 67 multipart. */
const GSM7 = new Set(("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà").split(""));

export function smsInfo(text) {
  const t = String(text || "");
  if (!t) return { encoding: "GSM-7", chars: 0, segments: 0, perSegment: 160 };
  const isGsm7 = [...t].every((c) => GSM7.has(c));
  if (isGsm7) {
    const escaped = [...t].filter((c) => "^{}\\[~]€".includes(c)).length;
    const len = t.length + escaped;
    const per = 160;
    const segments = len <= 160 ? 1 : Math.ceil(len / 153);
    return { encoding: "GSM-7", chars: len, segments, perSegment: len <= 160 ? 160 : 153 };
  }
  const len = t.length;
  const segments = len <= 70 ? 1 : Math.ceil(len / 67);
  return { encoding: "UCS-2", chars: len, segments, perSegment: len <= 70 ? 70 : 67 };
}
