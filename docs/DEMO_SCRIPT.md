# 3-Minute Demo Script (judges)

**Setup (before audience):** phone or laptop with the live app loaded once
(https://rudra496.github.io/shasthosathi/) so the cache is warm. Optional: airplane mode
mid-demo for the wow moment.

**0:00–0:25 — Hook (problem).** "In 2023 Bangladesh saw its worst dengue outbreak ever:
321,179 hospitalized, 1,705 dead. The first person a village patient meets is a community
health worker — with no AI, often no internet. We built their companion."
(Open the app on the home screen.)

**0:25–1:15 — Live triage (the core).** Open 🩺 Symptom Check. Use 🎤 voice (say in Bangla:
"তিন দিন ধরে জ্বর, পেটে ব্যথা, বারবার বমি হচ্ছে") or tick: fever 4 days + severe abdominal
pain + persistent vomiting. Press **ফলাফল দেখুন** →
> ⚠️ "আজই হাসপাতালে যান" — with the **triggering signs listed** and the advice list
> (paracetamol only, NO ibuprofen — bleeding risk).
Say: "This is the WHO warning-sign list from the 2009 guidelines — as rules, not a
black box. It shows its reasons. It saved a follow-up automatically."

**1:15–1:50 — Continuity tools.** 🤰 Mother & Child: enter a date → 8 WHO ANC contacts +
the Bangladesh EPI vaccine schedule + one-tap SMS reminder text. 👥 Registry: patients
stored on the device, JSON backup.

**1:50–2:20 — THE MOMENT: airplane mode ON.** "No network — and everything still works."
Reload, run another triage, open the dashboard. (This is why it fits the field.)

**2:20–2:50 — Supervisor dashboard.** KPIs 2023/24/25 (real DGHS numbers); actual-vs-model
monthly chart; the **transparent** climate-lag model — say: "R-squared 0.93 on the
peer-reviewed 2023 series, and we PUBLISH its limitation: it cannot see epidemic
burn-out — the overshoot vs 2024/25 is disclosed in the app." Show the 2026 relative-risk
outlook, division map, one-tap weekly bulletin.

**2:50–3:00 — Close.** "Offline-first, Bangla-first, evidence-first: 49 Crossref-verified
papers, every number sourced in-app. ShasthoSathi — the health worker's companion."

## Backup answers for Q&A
- **"Is the AI real?"** — The triage is deterministic clinical decision support (safer and
  auditable for triage), plus ML speech recognition and an ML forecasting model. We chose
  rules for clinical safety — and cite the validation paper (Hadinegoro 2012).
- **"Is the forecast reliable?"** — It's a proof-of-concept on 12 verified monthly points;
  we show cross-validation metrics and its known failure mode in the UI. Roadmap: ward-level
  case-feedback data from DGHS.
- **"Offline means data risk?"** — Data stays on-device by design (privacy by
  architecture); export is manual JSON; production adds encryption — noted honestly in-app.
- **"Scaling?"** — Clinical content + language are data files, not code: any dengue-endemic
  country swaps two JSON files.
