# GP FutureMakers 2026 — Round-1 Submission Content (paste-ready)

> Team: fill team name + member details on the portal. Category: **04 — Healthcare & Mental Wellbeing**.
> Everything below is ORIGINAL text written for this submission (facts sourced from the app's
> evidence base: docs/EVIDENCE.md). Live demo: https://rudra496.github.io/shasthosathi/
> Video: `video/ShasthoSathi_GP_Video.mp4` (1:40, MP4, 2.1 MB — inside the 2:00 / 300 MB limits).
> BN = Bangla reference version for your own review / interviews (portal accepts either language).

---

## 1. Category
**Healthcare & Mental Wellbeing** (Category 04).
The solution supports "access to health information, early risk identification, healthcare accessibility, resource prioritization, and referral/decision support" — exactly the examples listed for this category — and explicitly positions AI as decision *support*, never a replacement for qualified healthcare professionals.

## 2. Problem statement
Every year dengue overwhelms Bangladesh. In 2023 the country recorded its worst outbreak ever: 321,179 hospitalized cases and 1,705 deaths (DGHS). In 2026 alone, 41,032 cases and 113 deaths were already reported by 5 September (DGHS dashboard). The people who meet patients first — community health workers — have no AI assistance at all: they work with paper or disconnected tools, in areas with unreliable internet, and decisions like "home care vs hospital today" are made by memory. Detection of outbreaks lags weeks behind reality, and resources (test kits, volunteers, hospital beds) are allocated without current, division-level evidence.

## 3. Target group
- **Primary users:** community health workers and health supervisors in dengue-endemic urban and rural wards of Bangladesh (the first and often only care layer).
- **Primary beneficiaries:** low-income families who first meet a health worker — including low-literacy and feature-phone users who are excluded by app-first solutions.
- **Institutional beneficiaries:** health authorities/NGOs who need early-warning and resource-prioritization views built on verifiable data.

## 4. Proposed AI-enabled solution
**ShasthoSathi ("health companion")** is an offline-first, Bangla-first AI companion that a health worker installs on any Android phone (works in the browser too; no app store needed):
1. **Explainable symptom triage** — the worker speaks symptoms in Bangla (or taps); a deterministic decision engine based on the WHO 2009 dengue classification answers *home care / hospital today / EMERGENCY*, shows WHICH signs triggered the decision, and always displays "not a doctor" guidance with one-tap national hotlines (999 / 16263 / 333).
2. **SMS mode for feature phones** — the SAME engine answers coded SMS (e.g., "DENGUE FEVER PAIN"), with telecom-correct message segmentation (GSM-7/UCS-2), so no-smartphone users are included.
3. **Continuity tools** — on-device patient registry, auto-created follow-ups, WHO 8-contact ANC scheduler, Bangladesh EPI vaccine scheduler with SMS reminder text, medicine-label read-aloud (on-device OCR), and a warning-signs training quiz.
4. **Supervisor early-warning dashboard** — official dengue data 2023→2026 (monthly + real division-level map, updated 5 Sep 2026), a transparent climate-lag risk model, a "what-if" risk calculator, and a one-tap weekly situation bulletin.

**Why it is already credible:** it is not a mock-up — it is deployed and usable today (link above), with 55 automated tests including data-integrity guards, and an evidence base of 64 Crossref-verified peer-reviewed papers (including a Q1 spotlight: The Lancet Global Health, Nature Medicine, PLOS NTD).

## 5. Specific role of AI
| AI component | Inputs | Output | Why AI is appropriate |
|---|---|---|---|
| Bangla speech recognition (on-device) | spoken Bangla symptoms | structured symptom list | removes the literacy barrier; faster than typing in the field |
| Explainable decision-support engine | symptom flags + fever duration + age/pregnancy | 3-level care recommendation + triggered signs | encodes the WHO 2009 warning-sign list as auditable rules — safer and more transparent than a black box for triage |
| Offline SMS NLP | coded SMS text | symptom flags → same triage | extends reach to feature phones |
| Climate-lag risk model (ML) | real rainfall/humidity (Open-Meteo) + official case series | relative seasonal-risk index | weather leads cases by weeks; simple lagged regression captures seasonal forcing (R²(log)=0.93 on the 2023 series) |
| On-device OCR + TTS | photo of a medicine pack | read-aloud label text | independent use by low-literacy patients |

**Honest limitations we disclose (in the app itself):** the forecast model is a proof-of-concept trained on 12 verified monthly points; it captures the seasonal *shape* (validated against live 2026 data — August is the actual peak month) but over-predicts amplitude (~2.8× May–Aug median) because it lacks case-feedback — disclosed in the app, the dashboard, and the Model Card. Triage is decision *support*: every screen says it is not a doctor. Personal data stays on-device by design.

## 6. Expected social impact
- **Faster, safer first-contact decisions** for patients whose outcome depends on reaching care during the fever days 3–7 critical window (WHO).
- **Inclusion:** voice-first Bangla UX, offline operation, SMS for feature phones — designed for users other health apps exclude.
- **Better resource allocation:** supervisors see real division-level burden (e.g., in 2026 to 5 Sep: Dhaka division 16,312 cases vs Sylhet 184 — DGHS) instead of stale reports.
- **Scalability:** clinical content and language packs are data files, not code — the same platform extends to any dengue-endemic country (India, Indonesia, Brazil) at near-zero marginal cost.

## 7. Feasibility & implementation approach
- **Already feasible — it runs today** on free technology: a no-build PWA (offline via service worker), on-device speech/OCR, and public data (DGHS, WHO, Open-Meteo, geoBoundaries, BBS census). No API keys, no licensing costs.
- **Implementation path (12 months):** (1) pilot with one ward-level health-worker team in Sylhet via the university's public-health contacts; (2) add division-level case-feedback to the model with DGHS/IEDCR data partnership; (3) SMS delivery via an operator gateway (the simulation already proves the message format); (4) supervised sync for supervisors' coverage views.
- **Risks & mitigations:** clinical misuse → hard guardrails + hotlines; data privacy → on-device storage by architecture; model overconfidence → disclosed limitations + relative-index-only outputs.

## 8. Disclosure (per competition rules)
Per the official FAQ, prior development must be disclosed: ShasthoSathi was developed **before** this competition by our team, is fully owned by us (public repository, no third-party/funded contributions), and has received **no prior awards or funding** for this specific project. We disclose this proactively — the live deployment is our proof of feasibility, and all competition rounds will build on it.

## 9. Why this wins WITH Grameenphone
This is not a generic app looking for a sponsor — it is built around the assets only a telecom has:
- **SMS mode is telecom-native**: the feature-phone path (already simulated in-product with real GSM-7/UCS-2 segmentation) needs exactly one thing to go live — an operator SMS gateway. On GP's network, a health worker in any village becomes reachable today.
- **Zero-rating**: the PWA is tiny and offline-first; zero-rating health-information traffic on GP networks makes it free-to-use for every GP customer — inclusion with one business decision.
- **Network-scale alerts**: anonymized, ward-level outbreak warnings pushed via GP channels when the (case-feedback-upgraded) forecast crosses thresholds.
- **MyGP/health-platform integration**: ShasthoSathi's triage and hotlines (999/16263) can surface inside existing GP customer touchpoints.
- **Data partnership**: the forecast's known amplitude gap closes with division-monthly case feedback — a data partnership GP is uniquely positioned to broker with DGHS/IEDCR.

## 10. Impact model (transparent assumptions, labeled est.)
During an outbreak season, one CHW sees ~10 suspected fever patients/day (field-typical order of magnitude, **est.**). With 10,000 active CHWs: **~100,000 triage decisions/month** supported, each with a shown reason and escalation guardrails; follow-up compliance and referral consistency are the pilot's measured outcomes (baseline vs app). Even one prevented death per 1,000 correct emergency referrals (2023 CFR was 0.53%) makes the arithmetic of impact overwhelming. All figures **est.** and labeled; the pilot measures them for real.

## 11. Video pitch
`ShasthoSathi_GP_Video.mp4` — 1 minute 40 seconds, 1280×720, MP4 (2.1 MB): problem with official numbers → who is affected → live product demo (offline triage in Bangla, SMS mode, live 2023–2026 dashboard, real division map) → role of AI → impact. (Bangla narration + Bangla captions.)

---

## BN (বাংলা সংক্ষিপ্ত সংস্করণ — নিজের রেফারেন্স/ইন্টারভিউয়ের জন্য)
**সমস্যা:** ২০২৩-এ রেকর্ড ডেঙ্গু (৩,২১,১৭৯ কেস, ১,৭০৫ মৃত্যু); ২০২৬-এর ৫ সেপ্টেম্বর পর্যন্তই ৪১,০৩২ কেস। প্রথম সেবাদাতা স্বাস্থ্যকর্মীদের হাতে কোনো এআই নেই, ইন্টারনেটও অনিশ্চিত।
**সমাধান:** স্বাস্থ্যসাথী — অফলাইন এআই সঙ্গী: বাংলা ভয়েস ট্রায়াজ (WHO নিয়ম, কারণসহ), SMS মোড (ফিচার ফোন), রোগী তালিকা/ফলোআপ, মা-শিশু সূচি, ওষুধ পাঠ; সুপারভাইজারের জন্য লাইভ ড্যাশবোর্ড (২০২৩→২০২৬, বিভাগ-ম্যাপ, জলবায়ু মডেল)।
**এআই-এর ভূমিকা:** বক্তৃতা শনাক্তকরণ, ব্যাখ্যাযোগ্য সিদ্ধান্ত সহায়তা, SMS NLP, ML পূর্বাভাস, OCR — প্রতিটির ইনপুট/আউটপুট/সীমাবদ্ধতা ঘোষিত; এআই চিকিৎসকের বিকল্প নয়।
**প্রভাব:** ঝুঁকি-সময়ে (জ্বরের ৩–৭ দিন) দ্রুত সঠিক সিদ্ধান্ত; নিম্ন-সাক্ষর ও ফিচার-ফোন ব্যবহারকারীর অন্তর্ভুক্তি; বিভাগভিত্তিক বাস্তব ডেটায় সম্পদ বরাদ্দ; যেকোনো ডেঙ্গু-প্রবণ দেশে সম্প্রসারণযোগ্য।
**কার্যকারিতা:** ইতিমধ্যে চালু (লিংক), ফ্রি প্রযুক্তি, ৫৫টি টেস্ট, ৬৪টি যাচাইকৃত গবেষণাপত্রের প্রমাণভিত্তি।
