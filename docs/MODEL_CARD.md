# Model Card — ShasthoSathi Dengue Climate-Lag Model

**Version:** 1.1 (2026-09-06) · **Code:** `research/forecast_model.py` · **Output:** `app/data/forecast.json`

| Field | Value |
|---|---|
| **Model type** | Log-linear OLS regression (transparent, 4 parameters) |
| **Form** | log10(cases+1)ₘ = b0 + b1·rain(mm)ₘ₋₁ + b2·rain(mm)ₘ₋₂ + b3·RH(%)ₘ₋₁ |
| **Training data** | Bangladesh monthly hospitalized dengue cases, 2023 (12 months) — Hossain et al. 2025, *Health Science Reports* 8(5):e70852, doi:10.1002/hsr2.70852 (Crossref-verified; monthly values sum to the official DGHS total 321,179) |
| **Weather data** | Open-Meteo archive API — real daily observations for Dhaka (23.81N, 90.41E), aggregated monthly; 2022 fetched for lag features |
| **In-sample fit** | R²(log-space) = 0.93 |
| **Cross-validation** | Leave-one-month-out: MAE(log₁₀) = 0.354; MAE(cases) ≈ 26,912 (dominated by the 3 peak months — heavy right tail) |
| **Coefficients (fitted)** | b0 = 1.6141 · b1 (rain lag-1) = 0.0040 · b2 (rain lag-2) = 0.0053 · b3 (RH lag-1) = 0.0095 |

## Live out-of-sample validation (2026 season, added 2026-09-06)
The model's 2026 projection is now compared against **real current-year data** from the DGHS dashboard (41,032 cases / 113 deaths as of 05-Sep-2026; monthly and division rows sum exactly to YTD):
- **Seasonal shape: captured.** August is the actual 2026 peak month (20,536 cases) — the model, using only lagged rainfall/humidity, also places the peak in the Aug–Sep window.
- **Amplitude: over-predicted (disclosed).** Complete-month median predicted/actual ratio (May–Aug) ≈ 2.8×. September is partial (5 days) and excluded from ratios.
- Interpretation: weather-only lags anticipate *timing* but not *magnitude* without case-feedback — quantified here on live data, and the first fix listed for field deployment.

## Intended use
- A **relative seasonal-risk indicator** (index 0–100, reference = typical monsoon month) and a **what-if teaching tool** for supervisors to see how lagged rainfall/humidity shift risk.
- Demonstration of a complete, reproducible climate→dengue pipeline built only on verifiable data.

## Out-of-scope / NOT intended
- **Not an operational case-count forecast.** It must not be used to allocate clinical resources on its own.
- Not a ward-level or individual-risk product.

## Known failure modes (disclosed in the app itself)
- **Cannot capture epidemic burn-out (susceptible depletion).** Trained on the single 2023 season, the model overshoots subsequent years when climate is favorable but the susceptible pool is depleted: annual prediction vs actual = **2024: 16.23×, 2025: 2.93×**. This is exactly why the UI presents a *relative index*, never absolute counts.
- **12 training points** — proof-of-concept scale; wide uncertainty.
- **Division priority is population-share only** — under-weights Dhaka city, which carried 44% of 2023 cases / 69% of deaths (WHO DON); field deployment needs division-level case feedback.

## Mitigations built into the product
- UI labels: "teaching tool — not a forecast" (risk calculator), "relative risk shape" (outlook), and a permanent Limitations panel listing the overshoot numbers.
- Data-integrity tests fail the build if dataset sums stop matching published totals.
- All coefficients, metrics, and the limitation text ship inside `forecast.json` — no hidden numbers.

## Retraining recipe (for judges/reviewers)
```
cd research
python build_data.py       # rebuilds verified datasets with provenance
python forecast_model.py   # refetches weather, refits, rewrites forecast.json
cd ../app && npx vitest run --root .. tests   # 38 tests incl. data guards
```
