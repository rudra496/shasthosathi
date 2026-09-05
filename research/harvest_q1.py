#!/usr/bin/env python3
"""Q1-journal spotlight harvest — venue-filtered OpenAlex search.
Venues resolved via OpenAlex sources API (no scraping). Every candidate DOI is
verified against Crossref before acceptance. SJR quartile is NOT invented here —
it is verified separately via scimagojr search snippets (see research notes)."""
import json, time, urllib.request, urllib.parse, difflib

OUT = "harvest_q1_raw.json"
UA = {"User-Agent": "ShasthoSathi-research/1.0 (mailto:rudrasarker130@gmail.com)"}

# Target venues (recognized leading journals in global health / infectious disease).
# Quartiles verified separately via SJR snippets — stored in q1_venues.json.
VENUES = [
    "The Lancet", "The Lancet Global Health", "BMJ", "Bulletin of the World Health Organization",
    "PLOS Neglected Tropical Diseases", "International Journal of Infectious Diseases",
    "Transactions of the Royal Society of Tropical Medicine and Hygiene",
    "Vaccine", "Nature Medicine", "Journal of Infection", "Travel Medicine and Infectious Disease",
]
QUERIES = ["dengue", "dengue Bangladesh", "community health worker", "mobile health",
           "early warning dengue climate"]

def get_json(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print(f"  retry {i+1}: {e}"); time.sleep(2 * (i + 1))
    return None

def norm(t):
    return "".join(c.lower() for c in (t or "") if c.isalnum() or c.isspace()).strip()

def resolve_source(name):
    d = get_json("https://api.openalex.org/sources?search=" + urllib.parse.quote(name) + "&per-page=1")
    try:
        r = d["results"][0]
        sim = difflib.SequenceMatcher(None, norm(r["display_name"]), norm(name)).ratio()
        return {"id": r["id"], "name": r["display_name"], "sim": round(sim, 2),
                "h_index": r.get("h_index"), "works": r.get("works_count")} if sim >= 0.85 else None
    except Exception:
        return None

def main():
    sources = {}
    for v in VENUES:
        s = resolve_source(v)
        if s: sources[v] = s
        print(("OK " if s else "MISS ") + v, "->", (s or {}).get("id"))
        time.sleep(0.6)
    json.dump(sources, open("q1_sources.json", "w"), indent=1)

    cands = []
    for v, s in sources.items():
        for q in QUERIES:
            d = get_json("https://api.openalex.org/works?filter=primary_location.source.id:" +
                         s["id"].split("/")[-1] + "&search=" + urllib.parse.quote(q) +
                         "&per-page=6&sort=cited_by_count:desc&mailto=rudrasarker130@gmail.com")
            for w in (d or {}).get("results", []):
                auths = [a["author"]["display_name"] for a in w.get("authorships", [])][:6]
                cands.append({
                    "title": w.get("title"), "authors": auths, "year": w.get("publication_year"),
                    "venue": (w.get("primary_location") or {}).get("source", {}).get("display_name"),
                    "doi": (w.get("doi") or "").replace("https://doi.org/", ""),
                    "cited_by": w.get("cited_by_count"), "venue_target": v, "query": q,
                })
            time.sleep(0.8)

    # dedup + Crossref verify
    seen, uniq = set(), []
    for c in cands:
        key = c["doi"] or norm(c["title"] or "")
        if key and key not in seen:
            seen.add(key); uniq.append(c)
    verified = []
    for c in uniq:
        ok = False
        if c["doi"]:
            d = get_json("https://api.crossref.org/works/" + urllib.parse.quote(c["doi"]))
            if d and d.get("message", {}).get("title"):
                ct = d["message"]["title"][0]
                sim = difflib.SequenceMatcher(None, norm(ct), norm(c["title"] or "")).ratio()
                ok = sim >= 0.80
                c["title_similarity"] = round(sim, 3)
        if ok:
            c["crossref_ok"] = True
            verified.append(c)
        time.sleep(0.5)
    json.dump(verified, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"Q1 harvest: {len(cands)} candidates -> {len(verified)} Crossref-verified")
    from collections import Counter
    print(Counter(c["venue_target"] for c in verified))

if __name__ == "__main__":
    main()
