#!/usr/bin/env python3
"""v2 data additions: decade series (peer-reviewed), verified hotlines, WHO prevention facts."""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
APPDATA = os.path.join(ROOT, "..", "app", "data")

def w(name, obj):
    with open(os.path.join(APPDATA, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print("wrote", name)

# 1. Full decade series — single consistent peer-reviewed source
DECADE = {
    "source": "Hossain M, Rakib MSI, Hasan MM, Powshi SN, Islam EI, Islam NN. "
              "The 2023 dengue outbreak in Bangladesh. Health Sci Rep. 2025;8(5):e70852. "
              "doi:10.1002/hsr2.70852 — Table 1 (cases) & Table 2 (deaths), 2014-2023.",
    "note": "Peer-reviewed series; small reporting-cutoff differences vs other DGHS "
            "compilations are known (e.g., this table's 2022: 61,089/269 vs the DGHS "
            "year-wise compilation's 62,382/281; 2019 deaths 164 here vs IEDCR's 179). "
            "We keep ONE consistent peer-reviewed series for the decade chart and cite "
            "the official figures separately in dengue_annual.json.",
    "cases": [["2014", 375], ["2015", 3162], ["2016", 6060], ["2017", 2769],
               ["2018", 10148], ["2019", 101354], ["2020", 1405], ["2021", 28429],
               ["2022", 61089], ["2023", 321179]],
    "deaths": [["2014", 0], ["2015", 6], ["2016", 14], ["2017", 8], ["2018", 26],
                ["2019", 164], ["2020", 3], ["2021", 105], ["2022", 269], ["2023", 1705]],
}
assert sum(v for _, v in DECADE["cases"]) == 535970, "paper states 10-year total 535,970"
assert sum(v for _, v in DECADE["deaths"]) == 2300, "paper Table 2 total deaths n=2300"
w("dengue_decade_2014_2023.json", DECADE)

# 2. Verified hotlines
HOTLINES = {
    "sources": [
        "999: national emergency service (police/fire/ambulance), 24/7, free — 999.gov.bd, "
        "Bangladesh Police (police.gov.bd/en/hot_line_number). Verified 2026-09-06.",
        "16263 Shastho Batayon: DGHS national telehealth call centre, 24/7 doctors, "
        "~Tk 0.60/min — 16263.dghs.gov.bd, IEDCR NBPH. Verified 2026-09-06.",
        "333: national government information/services helpline, free — 333.gov.bd. "
        "Verified 2026-09-06.",
    ],
    "lines": [
        {"number": "999", "bn": "জাতীয় জরুরি সেবা (পুলিশ/ফায়ার/অ্যাম্বুলেন্স) — ফ্রি, ২৪/৭",
         "en": "National emergency (police/fire/ambulance) — free, 24/7"},
        {"number": "16263", "bn": "স্বাস্থ্য বাতায়ন — চিকিৎসকের পরামর্শ (প্রতি মিনিটে ~০.৬০ টাকা)",
         "en": "Shastho Batayon — doctor advice hotline (DGHS, ~Tk 0.60/min)"},
        {"number": "333", "bn": "সরকারি তথ্য ও সেবা হেল্পলাইন — ফ্রি",
         "en": "Government info & services helpline — free"},
    ],
}
w("hotlines.json", HOTLINES)

# 3. WHO prevention facts (verbatim source list) -> appended to clinical content
CC_PATH = os.path.join(APPDATA, "clinical_content.json")
cc = json.load(open(CC_PATH, encoding="utf-8"))
cc["prevention"] = {
    "source": "WHO dengue fact sheet (who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue), "
              "fetched 2026-09-06; lists quoted verbatim from the sheet.",
    "bite_protection": [
        "clothes covering the body", "nets (repellent-sprayed) for day sleeping",
        "window screens", "repellents (DEET, Picaridin, IR3535)", "coils and vaporizers"],
    "breeding_prevention": [
        "dispose solid waste properly; remove water-holding artifacts",
        "cover, empty and clean water-storage containers weekly",
        "appropriate insecticides for outdoor water containers"],
    "treatment_key_lines": [
        "no specific treatment; paracetamol for pain",
        "AVOID ibuprofen/aspirin (bleeding risk)",
        "rest + plenty of liquids; contact doctor if severe symptoms",
        "severe dengue often needs hospitalization"],
}
json.dump(cc, open(CC_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("clinical_content.json extended with WHO prevention facts")
print("ALL V2 DATA ASSETS BUILT.")
