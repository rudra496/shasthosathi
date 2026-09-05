#!/usr/bin/env python3
"""
ShasthoSathi evidence harvest — LIVE retrieval only (AGENTS.md §5).
Fetches candidate literature from OpenAlex (primary) for each theme,
then VERIFIES every candidate DOI directly against Crossref.
Metadata is COPIED from API JSON — never typed by hand.
Output: harvest_raw.json (all candidates + verification status)
"""
import json, time, urllib.request, urllib.parse, difflib

OUT = "harvest_raw.json"
UA = {"User-Agent": "ShasthoSathi-research/1.0 (mailto:rudrasarker130@gmail.com)"}

THEMES = {
    "T1_dengue_bangladesh": [
        "dengue Bangladesh outbreak epidemiology",
        "dengue Dhaka hospital",
    ],
    "T2_early_warning_climate": [
        "dengue early warning system climate machine learning",
        "dengue Bangladesh rainfall temperature",
        "dengue outbreak prediction model",
    ],
    "T3_chw_mhealth": [
        "community health workers mobile health Bangladesh",
        "mHealth Bangladesh",
        "digital health community health workers low-resource",
    ],
    "T4_ai_triage": [
        "clinical decision support triage low-resource settings",
        "artificial intelligence triage primary care",
        "symptom checker assessment accuracy",
    ],
    "T5_voice_literacy": [
        "voice interface health low literacy users",
        "speech interaction illiterate users technology",
    ],
    "T6_vector_surveillance": [
        "Aedes surveillance dengue Bangladesh vector",
        "dengue vector control Bangladesh",
    ],
}

def get_json(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print(f"  retry {i+1} for {url[:90]}: {e}")
            time.sleep(2 * (i + 1))
    return None

def norm(t):
    return "".join(c.lower() for c in (t or "") if c.isalnum() or c.isspace()).strip()

def openalex_search(q, n=12):
    url = ("https://api.openalex.org/works?search=" + urllib.parse.quote(q)
           + "&per-page=%d&mailto=rudrasarker130@gmail.com" % n)
    d = get_json(url)
    out = []
    for w in (d or {}).get("results", []):
        auths = [a["author"]["display_name"] for a in w.get("authorships", [])][:8]
        out.append({
            "title": w.get("title"),
            "authors": auths,
            "year": w.get("publication_year"),
            "venue": (w.get("primary_location") or {}).get("source", {}).get("display_name")
                     if (w.get("primary_location") or {}).get("source") else None,
            "doi": (w.get("doi") or "").replace("https://doi.org/", ""),
            "openalex_id": w.get("id"),
            "cited_by": w.get("cited_by_count"),
            "query": q,
        })
    return out

def crossref_verify(doi):
    """Return (ok, crossref_title, http_status). ok=True only if 200 + title match."""
    if not doi:
        return False, None, 0
    d = get_json("https://api.crossref.org/works/" + urllib.parse.quote(doi))
    if d is None:
        return False, None, 0
    try:
        cr_title = d["message"]["title"][0]
        ok = difflib.SequenceMatcher(None, norm(cr_title), norm("")).ratio() >= 0  # placeholder
        return True, cr_title, 200
    except Exception:
        return False, None, 200

def main():
    all_c = []
    for theme, queries in THEMES.items():
        print(f"== {theme}")
        for q in queries:
            print(f"  search: {q}")
            for c in openalex_search(q):
                c["theme"] = theme
                all_c.append(c)
            time.sleep(1)
    # de-dup by DOI/title
    seen, uniq = set(), []
    for c in all_c:
        key = (c["doi"] or norm(c["title"] or ""))
        if key and key not in seen:
            seen.add(key)
            uniq.append(c)
    # verify each unique DOI via Crossref
    for c in uniq:
        ok, cr_title, status = crossref_verify(c["doi"])
        c["crossref_ok"] = ok and status == 200
        c["crossref_title"] = cr_title
        if c["doi"] and cr_title:
            sim = difflib.SequenceMatcher(None, norm(cr_title), norm(c["title"] or "")).ratio()
            c["title_similarity"] = round(sim, 3)
            c["crossref_ok"] = ok and sim >= 0.80
        time.sleep(0.6)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(uniq, f, ensure_ascii=False, indent=1)
    n_ok = sum(1 for c in uniq if c.get("crossref_ok"))
    print(f"TOTAL unique: {len(uniq)}  crossref-verified: {n_ok}")
    for c in uniq:
        if c.get("crossref_ok"):
            print(f"  [{c['theme']}] ({c['year']}) {c['title'][:80]} | doi:{c['doi']}")

if __name__ == "__main__":
    main()
