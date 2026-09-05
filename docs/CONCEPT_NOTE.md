# ShasthoSathi — Concept Note (competition-ready summary)

**Tagline:** The offline AI companion for the health worker who is everyone's first doctor.

## 1. Problem
- Bangladesh's 2023 dengue season was the deadliest on record: **321,179 hospitalized cases, 1,705 deaths** (DGHS). 2024: 101,214/575. 2025: 102,562/412. The cycle repeats yearly, concentrated in dense urban wards.
- Community health workers (CHWs) are the first and often only care layer, but they work with paper or disconnected apps: **no decision support, no early-warning view, unreliable connectivity.**
- Outbreak detection in-country remains **reactive**; ward-level early warning does not exist operationally.

## 2. Solution (built, live, offline)
**ShasthoSathi** (Bengali for "health companion") is an installable, offline-first PWA in Bangla+English:

1. **Symptom triage (deterministic, explainable):** a WHO-2009-based clinical decision engine converts reported symptoms into *home care / hospital today / EMERGENCY*, always showing **which signs triggered the decision** and the mandatory disclaimer. Voice-first in Bangla; offline keyword parsing fallback.
2. **Continuity tools:** patient registry (on-device, exportable), auto-created follow-ups for high-risk cases, WHO 8-contact ANC scheduler + Bangladesh EPI vaccine scheduler with copyable SMS reminders — the daily workflows CHWs actually own.
3. **Early-warning dashboard (supervisor):** verified national dengue history (2019–2025), a transparent climate-lag model (rain/humidity lags → log-linear risk; R²(log)=0.93, LOO-MAE 0.354 — with its failure mode disclosed), a 2026 relative-risk outlook, a division-priority choropleth (BBS census 2022), and a one-tap weekly situation bulletin.
4. **Inclusion features:** medicine-label OCR read-aloud (experimental), training quiz on warning signs, full Bangla voice UX for low-literacy users.

## 3. Why judges can trust the numbers (zero-invention policy)
- Monthly 2023 series: peer-reviewed (Hossain et al. 2025, Health Sci Rep, doi:10.1002/hsr2.70852 — sums to the official 321,179).
- Annual figures: DGHS/IEDCR/WHO. Weather: Open-Meteo archive (real observations). Boundaries: geoBoundaries gbOpen. Population: BBS Census 2022.
- **49 Crossref-verified peer-reviewed papers** back the design (docs/EVIDENCE.md), including the WHO-classification validation (Hadinegoro 2012).
- Negative results disclosed (unavailable machine-readable 2024/25 monthly data; a wrong-paper candidate rejected during verification).

## 4. Social impact & scalability
- Pilot population: Bangladesh's ~169.8M (BBS 2022); CHW networks are among the world's largest.
- Same architecture serves any dengue-endemic Global South country (India, Indonesia, Brazil, Philippines): swap the clinical content file + language pack — both are data, not code.
- SDG 3 (Good Health), SDG 10 (Reduced Inequality — voice-first, offline-first for low-literacy and low-connectivity users).

## 5. Roadmap (honest: not yet built)
1. On-device Gemma/MedGemma for richer consultation summaries (phone-RAM permitting).
2. Ward-level case-feedback forecasting (needs DGHS data partnership) to fix the burn-out limitation.
3. Real SMS gateway delivery (currently copyable reminder text).
4. Anonymous sync to a supervisor portal for live (not demo) coverage maps.

## 6. Proof it works (all verified in this session)
- 29/29 automated tests pass (triage logic, WHO levels, schedules, i18n completeness, **data-integrity guards that fail the build if totals stop matching the sources**).
- Full browser walkthrough: triage → save → follow-up → ANC/EPI → dashboard, **including airplane-mode offline operation** of every page.
- Live: https://rudra496.github.io/shasthosathi/ (0 console errors).
