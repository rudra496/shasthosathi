// GP FutureMakers — ShasthoSathi Concept Pitch deck (12 slides, per required coverage)
// Run: node build_deck_gp.js  -> ShasthoSathi_GP_Deck.pptx
const pptxgen = require("pptxgenjs");

const T = "0f766e", TD = "134e4a", BG = "f0fdfa", AMB = "b45309", INK = "1e293b";
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.33, height: 7.5 });
p.layout = "W";

const master = (slide, no, title) => {
  slide.background = { color: BG };
  slide.addText(`ShasthoSathi · GP FutureMakers 2026`, { x: 0.4, y: 7.05, w: 5, h: 0.3, fontSize: 10, color: "64748b" });
  slide.addText(String(no).padStart(2, "0"), { x: 12.3, y: 7.05, w: 0.7, h: 0.3, fontSize: 10, color: "64748b", align: "right" });
  slide.addText(title, { x: 0.55, y: 0.35, w: 12.2, h: 0.8, fontSize: 30, bold: true, color: TD });
};
const bullets = (slide, items, opts = {}) => {
  slide.addText(items.map(t => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x: 0.7, y: 1.45, w: opts.w || 7.4, h: 5.3, fontSize: opts.size || 17, color: INK, lineSpacingMultiple: 1.25 });
};
const statCard = (slide, x, num, lbl, color = TD) => {
  slide.addShape(p.ShapeType.roundRect, { x, y: 1.7, w: 2.9, h: 1.7, fill: { color: "ffffff" }, line: { color: T, width: 1.5 }, rectRadius: 0.1 });
  slide.addText(num, { x, y: 1.85, w: 2.9, h: 0.9, fontSize: 30, bold: true, color, align: "center" });
  slide.addText(lbl, { x: x + 0.1, y: 2.7, w: 2.7, h: 0.6, fontSize: 12, color: "475569", align: "center" });
};

// ---- 01 Team ----
let s = p.addSlide(); master(s, 1, "Team — [TEAM NAME]");
bullets(s, [
  "Rudra Sarker — BSc Industrial & Production Engineering, SUST (2027) · AI/ML builder",
  "Built & shipped: MindWell (mental-health web app), RippleUp (Android+Desktop), SightlineAI, Team SignTalk — plus this project, already live",
  "Advisor slot: public-health / field-implementation mentor (to be confirmed in Ignition Chamber)",
  "Contact: [team email] · Solo team (eligible: 1–3 members)",
], { size: 18 });
s.addText("Everything demonstrated today is deployed and clickable — not a concept drawing.", { x: 0.7, y: 5.9, w: 11.9, h: 0.6, fontSize: 16, italic: true, color: T });

// ---- 02 Problem ----
s = p.addSlide(); master(s, 2, "Problem — dengue outruns the first line of care");
statCard(s, 0.7, "321,179", "hospitalized (2023 — worst ever, DGHS)", AMB);
statCard(s, 3.8, "1,705", "deaths in 2023 (CFR 0.53%)", AMB);
statCard(s, 6.9, "41,032", "cases already in 2026 (to 5 Sep, DGHS)", AMB);
statCard(s, 10.0, "16,312", "of them in Dhaka division alone", AMB);
bullets(s, [
  "Community health workers (CHWs) meet every patient first — with paper, memory, and no AI support",
  "Internet is unreliable where they work → any cloud-only app fails exactly when needed",
  "Outbreak detection lags weeks; resources (test kits, volunteers, beds) are allocated without current division-level evidence",
  "Feature-phone and low-literacy users are excluded by app-first solutions",
], { y: 3.9, size: 17 });

// ---- 03 Target group ----
s = p.addSlide(); master(s, 3, "Target group — who we serve, first");
bullets(s, [
  "PRIMARY USERS — community health workers & supervisors in dengue-endemic wards (urban + rural)",
  "PRIMARY BENEFICIARIES — low-income families at first contact: low-literacy users, feature-phone users (SMS mode), elderly patients",
  "INSTITUTIONAL — city corporations, DGHS/IEDCR programme officers, NGOs needing early-warning + prioritization views",
  "Designed WITH the constraint, not against it: voice-first Bangla UX, offline-first architecture, no smartphone required for SMS mode",
], { size: 19 });

// ---- 04 Insights/evidence ----
s = p.addSlide(); master(s, 4, "Evidence — 64 verified papers + live government data");
bullets(s, [
  "Peer-reviewed foundation: 64 Crossref-verified papers — Q1 spotlight incl. The Lancet Global Health (2024 dengue vaccine trial), Nature Medicine, PLOS NTD, IJID",
  "Clinical core: WHO 2009 dengue classification (warning signs validated — Hadinegoro 2012)",
  "Data spine: DGHS dashboard (2023→2026 YTD, division-level), WHO, IEDCR, BBS Census 2022, Open-Meteo weather — every number traceable, zero synthetic data",
  "Model honesty, in public: R²(log)=0.93 on 2023; live 2026 check shows shape captured (Aug = actual peak), amplitude gap ~2.8× disclosed in-app + Model Card",
  "Automated data-integrity tests: build FAILS if any dataset stops matching its published totals",
], { size: 17 });

// ---- 05 Solution ----
s = p.addSlide(); master(s, 5, "Solution — ShasthoSathi (live today)");
bullets(s, [
  "🩺 Symptom triage — speak symptoms in Bangla → WHO-2009-based engine answers: home care / hospital today / EMERGENCY — with the triggering signs shown",
  "💬 SMS mode — the SAME engine answers coded SMS on feature phones (GSM-7/UCS-2 aware)",
  "🤰 Mother & child — WHO 8-contact ANC + Bangladesh EPI vaccine schedules + SMS reminders; 💊 medicine label read-aloud (OCR); 🎓 warning-signs quiz",
  "🧠 Supervisor dashboard — 2023→2026 official data, real division map (Aug 2026: 20,536 cases — the peak month), weekly bulletin generator",
  "⚡ Offline-first PWA: installable, free, no API keys — verified working in airplane mode",
], { size: 16.5 });

// ---- 06 Role of AI ----
s = p.addSlide(); master(s, 6, "Role of AI — meaningful, explainable, responsible");
const rows = [
  ["AI component", "Input → Output", "Why AI / guardrail"],
  ["Bangla speech recognition", "voice → symptom list", "removes literacy barrier"],
  ["Explainable triage engine", "flags → care level + reasons", "WHO rules as auditable code — not a black box"],
  ["SMS NLP", "coded text → same triage", "reaches feature phones"],
  ["Climate-lag ML model", "rain/humidity → risk index", "weather leads cases by weeks; limits disclosed"],
  ["On-device OCR + TTS", "medicine photo → read-aloud", "independent use by low-literacy patients"],
];
s.addTable(rows.map((r, i) => r.map(c => ({ text: c, options: { fontSize: i ? 14 : 15, bold: i === 0, color: i === 0 ? "ffffff" : INK, fill: { color: i === 0 ? TD : "ffffff" } } }))),
  { x: 0.7, y: 1.5, w: 11.9, colW: [3.2, 4.2, 4.5], border: { pt: 0.5, color: "cbd5e1" }, rowH: 0.55 });
s.addText("Responsible-AI position: AI is decision SUPPORT — every screen says “not a doctor” · personal data stays on-device · model limits published in-app (Model Card).",
  { x: 0.7, y: 5.6, w: 11.9, h: 0.8, fontSize: 15, italic: true, color: TD });

// ---- 07 User journey ----
s = p.addSlide(); master(s, 7, "User journey — 90 seconds in a CHW's day");
bullets(s, [
  "1️⃣ Open ShasthoSathi (home screen — works offline)  →  2️⃣ Speak symptoms in Bangla",
  "3️⃣ Engine answers: “hospital TODAY” + shows which WHO warning signs triggered",
  "4️⃣ One-tap call 999/16263 · follow-up auto-created for tomorrow · case saved on-device",
  "5️⃣ Supervisor dashboard: new ward cases appear in the division map → bulletin drafted → kits/volunteers prioritized",
  "Feature-phone path: SMS “DENGUE FEVER PAIN” → same reply logic (simulated in-app; gateway-ready)",
], { size: 17 });

// ---- 08 Impact ----
s = p.addSlide(); master(s, 8, "Expected impact — faster decisions, wider inclusion");
bullets(s, [
  "Clinical: decisions in the critical window (fever days 3–7, WHO) become consistent, explained, and escalation-biased — fewer missed warning signs",
  "Inclusion: voice-first Bangla + SMS reaches users that app-first tools exclude — measured by design, not by retrofit",
  "System: supervisors allocate from CURRENT division data (2026 live) instead of weeks-old reports",
  "Scalable public good: clinical content + language packs are data files — any dengue-endemic country adopts with two JSON edits",
  "Measurable pilot metrics: triage-to-referral time, warning-sign capture rate, follow-up compliance %, dashboard adoption by supervisors",
], { size: 17 });

// ---- 09 Feasibility ----
s = p.addSlide(); master(s, 9, "Feasibility — it already runs; the hard part is done");
bullets(s, [
  "Built on free, proven pieces: no-build PWA (service worker), on-device speech/OCR, Leaflet offline maps, public data (DGHS/WHO/Open-Meteo/geoBoundaries/BBS)",
  "Zero running cost today: no servers required for field use (offline), no API keys, GitHub Pages hosting",
  "Quality gates: 55 automated tests (triage logic, schedules, i18n, SMS segmentation, data-integrity guards) · browser-verified offline mode",
  "Evidence discipline: 64 verified papers; automated guard tests fail the build on any data drift",
  "Risks owned: clinical misuse → guardrails + hotlines; privacy → on-device by design; model overconfidence → disclosed limits + relative-index outputs",
], { size: 16.5 });

// ---- 10 Financials ----
s = p.addSlide(); master(s, 10, "Financial considerations — lean by architecture");
bullets(s, [
  "Now: BDT 0/month — offline-first removes server costs; hosting free (GitHub Pages); models public/free",
  "Pilot (12 months, est.): SMS gateway volume for reminders/alerts + field logistics + a domain — the dominant cost is coordination, not technology (est. figures in pilot plan; no proprietary pricing assumed)",
  "Unit economics: one CHW phone already in hand → marginal cost per additional user ≈ BDT 0",
  "Sustainability: ward/city-corporation or NGO sponsorship of SMS volume; zero-rating on health-education traffic is a natural telecom partnership (aligned with operator social-good programmes)",
  "No revenue claim: this is a public-interest tool; any future service fees would be disclosed and never charged to patients",
], { size: 16.5 });

// ---- 11 Implementation ----
s = p.addSlide(); master(s, 11, "Implementation — 12-month plan");
bullets(s, [
  "Months 0–1: pilot with one ward CHW team (Sylhet region) — baseline vs ShasthoSathi on triage consistency & referral time",
  "Months 2–4: case-feedback forecasting (needs DGHS/IEDCR division-monthly data partnership) — fixes the disclosed amplitude gap",
  "Months 3–6: SMS gateway delivery (simulation already proves format); supervisor sync portal",
  "Months 6–12: second city pilot + Bangla refinement from field transcripts; external clinical review of content",
  "Go-to-market: CHW programmes of DGHS/community-clinic network + NGO health programmes — we integrate into existing workflows, not replace them",
], { size: 16.5 });

// ---- 12 Scalability ----
s = p.addSlide(); master(s, 12, "Scalability & roadmap");
bullets(s, [
  "Bangladesh: ~169.8M population (BBS 2022); CHW networks among the world's largest — the constraint is coordination, and our unit economics make that the only constraint",
  "Global South: dengue-endemic countries (India, Indonesia, Brazil, Philippines) reuse the platform with two data files (clinical content + language) — architecture unchanged",
  "Roadmap: on-device Gemma-class LLM for richer consultation summaries (RAM-permitting) · ward-level case-feedback model · vaccine/ANC SMS automation via gateway",
  "What we ask from FutureMakers: mentorship for the DGHS data partnership, pilot-site introduction, and responsible-AI guidance",
  "The idea is live today: rudra496.github.io/shasthosathi — open it during Q&A, turn on airplane mode, and try to break it.",
], { size: 16.5 });

p.writeFile({ fileName: "ShasthoSathi_GP_Deck.pptx" }).then(() => console.log("DECK WRITTEN: ShasthoSathi_GP_Deck.pptx"));
