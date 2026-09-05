#!/usr/bin/env python3
"""Curate verified harvest -> selected references; add manual Crossref-title-search
targets; merge into E:/zcode-data/state/citations_cache.json (dedup by DOI)."""
import json, urllib.request, urllib.parse, difflib, time

CACHE = "E:/zcode-data/state/citations_cache.json"

def norm(t):
    return "".join(c.lower() for c in (t or "") if c.isalnum() or c.isspace()).strip()

def cr_search_title(q):
    url = ("https://api.crossref.org/works?query.bibliographic=" + urllib.parse.quote(q)
           + "&rows=3&select=DOI,title,author,issued,container-title")
    req = urllib.request.Request(url, headers={"User-Agent": "ShasthoSathi/1.0 (mailto:rudrasarker130@gmail.com)"})
    try:
        d = json.loads(urllib.request.urlopen(req, timeout=30).read())
        items = d["message"]["items"]
        if items:
            t = items[0].get("title", [""])[0]
            sim = difflib.SequenceMatcher(None, norm(t), norm(q)).ratio()
            return items[0], t, sim
    except Exception as e:
        print("  cr_search fail:", e)
    return None, None, 0.0

# Manual must-have targets (fetched LIVE, accepted only at >=0.9 title similarity)
MANUAL = [
    ("triage_evidence", "The revised WHO dengue case classification: does the system need to change?"),
]

# Theme scoring: keyword hits in title boost relevance
KW = {
    "T1_dengue_bangladesh": ["bangladesh", "dhaka", "dengue", "outbreak", "epidemiol"],
    "T2_early_warning_climate": ["dengue", "forecast", "early warning", "climate", "rainfall", "temperature", "prediction", "model"],
    "T3_chw_mhealth": ["community health worker", "mhealth", "mobile health", "bangladesh", "digital health", "telehealth", "primary care"],
    "T4_ai_triage": ["symptom checker", "triage", "decision support", "artificial intelligence", "machine learning", "clinical"],
    "T5_voice_literacy": ["voice", "speech", "literacy", "illiterate", "interface", "interaction", "health"],
    "T6_vector_surveillance": ["aedes", "vector", "surveillance", "dengue", "control", "breeding"],
}
EXCLUDE = ["sequence variants", "hepatitis b", "dementia prevention", "heavy metals", "global surgery",
           "mental health and sustainable", "covid-19 pandemic: a call", "anthropocene", "cancer imaging",
           "fda-approved", "CLAIM", "gastric", "crop", "quantum"]

def score(c, kws):
    t = norm(c.get("title") or "")
    if any(norm(x) in t for x in EXCLUDE):
        return -1
    s = sum(2 for k in kws if k in t)
    s += min((c.get("cited_by") or 0) / 500.0, 6)
    s += 1.5 if (c.get("year") or 0) >= 2020 else 0
    s += 1.0 if (c.get("venue") or "").startswith(("The Lancet", "BMJ", "PLoS", "npj", "Bulletin")) else 0
    return s

def main():
    harvest = json.load(open("harvest_raw.json", encoding="utf-8"))
    ok = [c for c in harvest if c.get("crossref_ok")]
    selected = []
    for theme in KW:
        pool = [c for c in ok if c["theme"] == theme and score(c, KW[theme]) > 0]
        pool.sort(key=lambda c: -score(c, KW[theme]))
        # keep top 8 per theme after a cheap diversity pass (one row per first author)
        seen_author, chosen = set(), []
        for c in pool:
            a0 = norm((c.get("authors") or ["?"])[0])
            if a0 in seen_author:
                continue
            seen_author.add(a0)
            chosen.append(c)
            if len(chosen) == 8:
                break
        selected.extend(chosen)
    # manual targets
    for tag, title in MANUAL:
        item, t, sim = cr_search_title(title)
        if item and sim >= 0.90:
            rec = {"theme": tag, "title": t,
                   "authors": [a.get("given", "") + " " + a.get("family", "") for a in item.get("author", [])][:8],
                   "year": item.get("issued", {}).get("date-parts", [[None]])[0][0],
                   "venue": (item.get("container-title") or [None])[0],
                   "doi": item.get("DOI"), "cited_by": None,
                   "crossref_ok": True, "title_similarity": round(sim, 3), "query": "manual:" + title}
            selected.append(rec)
            print(f"manual OK ({sim:.2f}): {t} | {rec['doi']}")
        else:
            print(f"manual REJECTED sim={sim:.2f}: {title}")
        time.sleep(0.5)
    json.dump(selected, open("selected_references.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"selected: {len(selected)}")
    # merge into workspace cache
    cache = json.load(open(CACHE, encoding="utf-8")) if __import__("os").path.exists(CACHE) else []
    existing = {e.get("doi") for e in cache if isinstance(e, dict)}
    added = 0
    for c in selected:
        if c["doi"] and c["doi"] not in existing:
            cache.append({"doi": c["doi"], "title": c["title"], "authors": c.get("authors"),
                          "year": c.get("year"), "venue": c.get("venue"),
                          "source": "openalex+crossref", "project": "shasthosathi",
                          "verified": "2026-09-06", "theme": c.get("theme")})
            existing.add(c["doi"]); added += 1
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"cache: +{added} (total {len(cache)})")

if __name__ == "__main__":
    main()
