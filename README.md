# স্বাস্থ্যসাথী — ShasthoSathi

> **Offline AI health companion for community health workers.**
> Live demo: **https://rudra496.github.io/shasthosathi/**

[বাংলা README → README.bn.md](README.bn.md)

## The problem
Bangladesh had its **worst-ever dengue outbreak in 2023: 321,179 hospitalized cases and 1,705 deaths** (DGHS). Outbreaks return every year, but community health workers — the country's first line of care — still work without any AI assistance, often in areas with unreliable internet. Early detection lags weeks behind reality.

## What ShasthoSathi does (all offline-capable, free, no API keys)
| Feature | What it does | Status |
|---|---|---|
| 🩺 **Symptom triage** | WHO-2009-based decision engine: answers *home care / hospital today / EMERGENCY*, **in Bangla, with the reasons shown** | ✅ Core (works 100% offline) |
| 🎤 **Voice intake** | Speak symptoms in Bangla (bn-BD); offline keyword fallback parses text | ✅ Core (device speech services) |
| 👥 **Patient registry** | Add/list/delete patients; JSON backup export; stored on-device (IndexedDB) | ✅ Core (offline) |
| 📅 **Follow-up tracker** | High-risk triage results auto-create next-day follow-ups; done/pending views | ✅ Core (offline) |
| 🤰 **Mother & child schedules** | WHO 8-contact ANC dates from LMP; Bangladesh EPI vaccine dates from birth; copyable SMS reminders | ✅ Core (offline) |
| 🧠 **Dengue early-warning dashboard** | Real 2023–2025 outbreak data + a transparent climate-lag model (R²(log)=0.93) → 2026 relative-risk outlook, division priority map, weekly bulletin generator | ✅ Core (offline after first load) |
| 💊 **Medicine label reader** | On-device OCR reads medicine text aloud for low-literacy patients (Tesseract, Bengali+English) | ⚠️ Experimental (first use needs internet) |
| 🎓 **Learning quiz** | Warning-signs training quiz with WHO-sourced explanations | ✅ Core (offline) |
| 🌐 **Bangla ⇄ English** | One-tap language switch, Bangla numerals in dashboard | ✅ Core |
| ⚡ **Installable PWA** | Add to Android home screen; service worker keeps everything working offline (verified) | ✅ Core |

## Zero-invention data policy (our promise)
Every number in the app traces to a named source: the 2023 monthly outbreak series is from a peer-reviewed paper (Hossain et al. 2025, *Health Science Reports*, doi:10.1002/hsr2.70852); annual figures are DGHS/IEDCR/WHO; weather is real Open-Meteo archive observations; map boundaries are geoBoundaries (gbOpen); populations are the BBS 2022 census. The evidence base is **49 Crossref-verified peer-reviewed papers** — see [docs/EVIDENCE.md](docs/EVIDENCE.md) with a claim→source table. We also publish what we could NOT get (e.g., machine-readable monthly 2024/25 data) instead of guessing.

## Honesty about limits (what is real vs. not)
- The triage engine is **deterministic clinical decision support** (rule-based, WHO 2009 list) — not a generative-AI diagnosis. Every screen says: *not a doctor*.
- The forecast model is a **transparent, proof-of-concept climate-lag regression** trained on the verified 2023 monthly series (12 points). We publish its cross-validation metrics AND its known failure mode (it cannot see epidemic burn-out — annual overshoot vs 2024/2025 actuals is disclosed in the app itself). It outputs a **relative risk index**, not absolute case counts.
- Medicine label OCR is labeled **experimental** and tells users to verify.
- On-device LLM (Gemma/MedGemma) ward-level predictions, and SMS gateway delivery are **roadmap**, not shipped.

## Try it in 60 seconds
1. Open https://rudra496.github.io/shasthosathi/ on your phone → "Add to Home screen".
2. 🩺 Symptom Check → tick *severe abdominal pain* + *persistent vomiting* → **See result** → it says "Go to hospital TODAY", shows the triggers, and saves a follow-up.
3. 🤰 Mother & Child → enter a date → full ANC/EPI schedule + SMS reminder text.
4. Turn on airplane mode → everything still works (verified).
5. Supervisor dashboard → KPIs, actual-vs-model chart, 2026 outlook, division map, bulletin.

## Run / develop
No build step — it's plain HTML/JS. Serve the `app/` folder:
```
cd app && python -m http.server 8123
```
Tests (vitest, 29 tests): `cd app && npx vitest run --root .. tests`
Model + data pipeline (Python 3.12, numpy): `cd research && python build_data.py && python forecast_model.py`

## Tech
Plain PWA (no framework), IndexedDB, Web Speech API (bn-BD), Leaflet (vendored, offline), Tesseract.js (lazy CDN), Python/numpy model pipeline, GitHub Actions Pages deploy.

## Sources & credits
See [docs/EVIDENCE.md](docs/EVIDENCE.md) (49 verified papers + claim→source map) and `app/data/clinical_content.json` / `app/data/dengue_annual.json` (in-file provenance). Weather: Open-Meteo. Boundaries: geoBoundaries (gbOpen, CC-BY 4.0). Map tiles: © OpenStreetMap contributors. Built for the AI-for-Social-Good track by Rudra Sarker.
