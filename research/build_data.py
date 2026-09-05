#!/usr/bin/env python3
"""Build ShasthoSathi app data assets. Every number carries its source.
ZERO-INVENTION RULE: only figures verified on 2026-09-06 (see
state/checkpoint_shasthosathi.json facts_verified)."""
import json, shutil, os

ROOT = os.path.dirname(os.path.abspath(__file__))
APPDATA = os.path.join(ROOT, "..", "app", "data")
os.makedirs(APPDATA, exist_ok=True)

def w(name, obj):
    with open(os.path.join(APPDATA, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print("wrote", name)

# ---------- 1. Monthly dengue cases 2023 (peer-reviewed, sums to 321,179) ----------
DENGUE_2023_MONTHLY = {
    "source": "Hossain M, Rakib MSI, Hasan MM, Powshi SN, Islam EI, Islam NN. "
              "The 2023 dengue outbreak in Bangladesh. Health Sci Rep. 2025;8(5):e70852. "
              "doi:10.1002/hsr2.70852 (Table 1). Verified live via Crossref 2026-09-06.",
    "unit": "hospitalized cases",
    "months": [
        ["2023-01", 566], ["2023-02", 166], ["2023-03", 111], ["2023-04", 143],
        ["2023-05", 1036], ["2023-06", 5956], ["2023-07", 43854], ["2023-08", 71976],
        ["2023-09", 79598], ["2023-10", 67769], ["2023-11", 40716], ["2023-12", 9288],
    ],
}
assert sum(v for _, v in DENGUE_2023_MONTHLY["months"]) == 321179, "must sum to verified total"
w("dengue_monthly_2023.json", DENGUE_2023_MONTHLY)

# ---------- 2. Annual series ----------
DENGUE_ANNUAL = {
    "sources": [
        "DGHS (Directorate General of Health Services, Bangladesh) figures as reported by "
        "IEDCR National Bulletin (nbph.iedcr.gov.bd/an-update-on-dengue/), WHO DON 2023-DON481, "
        "PMC7535344 (2019), outbreaknewstoday + newsonair (2024), Xinhua/Beacon (2025, 28 Dec). "
        "All verified 2026-09-06.",
    ],
    "unit": "cases / deaths per calendar year",
    "years": [
        {"year": 2000, "cases": 5551,  "deaths": 93,   "note": "first recognized dengue outbreak year (Wikipedia 2023-outbreak article, background)"},
        {"year": 2019, "cases": 101354, "deaths": 179, "note": "largest outbreak before 2023 (IEDCR/PMC7535344)"},
        {"year": 2022, "cases": 62382,  "deaths": 281, "note": "DGHS via published year-wise table; deaths via Outbreak News Today"},
        {"year": 2023, "cases": 321179, "deaths": 1705, "note": "deadliest on record (DGHS)"},
        {"year": 2024, "cases": 101214, "deaths": 575,  "note": "DGHS via outbreaknewstoday/newsonair"},
        {"year": 2025, "cases": 102562, "deaths": 412,  "note": "DGHS via Xinhua/Beacon 28 Dec 2025; CFR 0.40%"},
    ],
}
w("dengue_annual.json", DENGUE_ANNUAL)

# ---------- 3. Weather (real, Open-Meteo archive API, Dhaka) ----------
shutil.copy(os.path.join(ROOT, "weather_dhaka_monthly_2023_2025.json"),
            os.path.join(APPDATA, "weather_dhaka_monthly.json"))
print("wrote weather_dhaka_monthly.json (copy)")

# ---------- 4. Division boundaries (geoBoundaries gbOpen ADM1) ----------
shutil.copy(os.path.join(ROOT, "bgd_adm1.geojson"),
            os.path.join(APPDATA, "divisions.geojson"))
print("wrote divisions.geojson (copy)")

# ---------- 5. Division populations (BBS Census 2022, PEC-adjusted) ----------
DIVISIONS = {
    "source": "Bangladesh Bureau of Statistics, Population & Housing Census 2022 "
              "(PEC-adjusted totals; division figures via citypopulation.de/en/bangladesh/, "
              "credited to BBS). Verified 2026-09-06. Sums to 169,828,911.",
    "divisions": {
        "Dhaka": 45644586, "Chattogram": 34178612, "Rajshahi": 20794019,
        "Rangpur": 18020071, "Khulna": 17813218, "Mymensingh": 12637472,
        "Sylhet": 11415113, "Barishal": 9325820,
    },
}
assert sum(DIVISIONS["divisions"].values()) == 169828911, "must sum to PEC-adjusted total"
w("division_population.json", DIVISIONS)

# ---------- 6. Clinical content (guideline-sourced) ----------
CLINICAL = {
    "who_warning_signs": {
        "source": "WHO. Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control. "
                  "New edition 2009 (iris.who.int, ISBN 9789241547871) — 'dengue with warning "
                  "signs' list; validation: Hadinegoro SRS. The revised WHO dengue case "
                  "classification. Trans R Soc Trop Med Hyg. 2012;doi:10.1179/2046904712z.00000000052",
        "items": [
            "abdominal_pain", "persistent_vomiting", "fluid_accumulation", "mucosal_bleeding",
            "lethargy_restlessness", "liver_enlargement", "rising_hct_falling_platelets"
        ],
    },
    "severe_dengue_proxies_app": {
        "source": "WHO 2009 severe-dengue criteria operationalized for community-level red flags; "
                  "plus WHO/UNICEF IMCI generic danger signs (unable to drink, vomiting everything, "
                  "convulsions, unconsciousness). App shows 'emergency' for any of these.",
        "items": ["shock_signs", "breathing_difficulty", "convulsion", "unconscious",
                  "unable_to_drink", "vomiting_everything", "severe_bleeding"],
    },
    "home_care_advice": {
        "source": "WHO dengue fact sheet (who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue) "
                  "and CDC dengue clinical guidance (cdc.gov/dengue/hcp/clinical-signs/guidelines.html): "
                  "paracetamol for fever; AVOID aspirin/ibuprofen/NSAIDs (bleeding risk); oral fluids; "
                  "daily follow-up during critical phase (fever days 3-7).",
        "items": ["paracetamol_only", "avoid_aspirin_ibuprofen", "oral_fluids", "daily_monitoring", "return_if_warning_signs"],
    },
    "anc_contacts_weeks": {
        "source": "WHO. WHO recommendations on antenatal care for a positive pregnancy experience. "
                  "Geneva: WHO; 2016. (8 contacts model)",
        "weeks": [12, 20, 26, 30, 34, 36, 38, 40],
    },
    "bd_epi_schedule": {
        "source": "WHO IRIS Bangladesh EPI document + PMC9984999 (Mobile-Based Immunization "
                  "Decision Support). Verified 2026-09-06.",
        "doses": [
            {"vaccine": "BCG",  "age": "birth"},
            {"vaccine": "Penta-1 / OPV-1 / PCV-1 / IPV-1", "age": "6 weeks"},
            {"vaccine": "Penta-2 / OPV-2 / PCV-2",         "age": "10 weeks"},
            {"vaccine": "Penta-3 / OPV-3 / PCV-3 / IPV-2", "age": "14 weeks"},
            {"vaccine": "MR-1", "age": "9 months"},
            {"vaccine": "MR-2", "age": "15-18 months"},
        ],
    },
}
w("clinical_content.json", CLINICAL)

print("ALL DATA ASSETS BUILT.")
