#!/usr/bin/env python3
"""Train the on-device symptom NLP model (multinomial Naive Bayes, one-vs-rest, word
1-2 grams) on a bilingual Bangla/Banglish/English corpus that INCLUDES multi-symptom
sentences (multi-label), evaluate on a held-out set (incl. negation + multi-symptom),
export weights JSON for pure-JS browser inference.

Honesty:
- Corpus is template-generated (labeled synthetic) from curated bilingual lexicons, fixed
  seed; disclosed in MODEL_CARD + app AI page. Competition FAQ accepts synthetic data.
- The classifier does ONE thing: free text -> symptom flags. Clinical decisions stay with
  the deterministic WHO rule engine. No diagnosis by ML.
"""
import json, math, random, os, re
from collections import Counter, defaultdict

random.seed(20260906)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "data", "nlp_model.json")

LEX = {
    "fever": ["জ্বর", "জ্বর হয়েছে", "জ্বর আছে", "jhor", "jor ache", "fever", "taat"],
    "headache": ["মাথা ব্যথা", "মাথাব্যথা", "মাথা ধরেছে", "matha betha", "matha dhoreche", "headache", "chokher pichone betha"],
    "muscle": ["শরীর ব্যথা", "গায়ে ব্যথা", "অস্থিসন্ধিতে ব্যথা", "sorir betha", "gaye betha", "body ache", "joint pain"],
    "nausea": ["বমি ভাব", "বমিভাব", "omno lage", "bomi bhab", "nausea"],
    "rash": ["র‍্যাশ", "র্যাশ", "চুলকানি", "চামড়ায় দাগ", "rash", "chulkani", "skin rash"],
    "severe_abdominal": ["পেট ব্যথা", "পেটে ব্যথা", "পেটে প্রচণ্ড ব্যথা", "pet betha", "pete betha", "pete prochondo betha", "abdominal pain", "belly pain"],
    "persistent_vomiting": ["বারবার বমি", "একের পর এক বমি", "barbar bomi", "bar bar bomi hocche", "persistent vomiting"],
    "bleeding": ["মাড়ি থেকে রক্ত", "নাক দিয়ে রক্ত", "রক্তক্ষরণ", "mari theke rokto", "nak diye rokto", "rokto porche", "bleeding gums", "nosebleed"],
    "lethargy": ["অলসতা", "দুর্বল লাগছে", "শুয়েই থাকতে চায়", "durbol lage", "durbolota", "shuye thake", "very weak", "lethargic"],
    "shock": ["শরীর ঠান্ডা ও আর্দ্র", "ঠান্ডা ঘাম", "thanda ardro", "cold clammy skin", "cold hands feet"],
    "breathing": ["শ্বাসকষ্ট", "শ্বাস নিতে কষ্ট", "shash koshto", "shash nite koshto", "breathing difficulty", "shortness of breath"],
    "convulsion": ["খিঁচুনি", "খিচুনি", "khinchuni", "khechune uthche", "convulsion", "seizure"],
    "unconscious": ["অচেতন", "জ্ঞান নেই", "এলোমেলো", "ocheton", "gyan nei", "elomelo", "unconscious", "confused"],
    "unable_drink": ["পানি খেতে পারছি না", "পান করতে পারছে না", "পানি তুলতে পারছে না", "pani khete parchi na", "pan korte parche na", "pani tulte parche na", "cannot drink"],
    "vomit_all": ["সব বমি করে ফেলছে", "খাওয়া হলেই বমি", "শরীরে কিছুই থাকে না", "shob bomi kore felche", "khawalei bomi", "vomiting everything", "nothing stays down"],
}
FILLER = [f.strip() for f in ["আজ", "কাল থেকে", "৩ দিন ধরে", "খুব", "একটু", "prochondo", "halka",
          "bikel theke", "sakal theke", " hoyeche", " hocche", " lagche", " korche", " ache",
          "", " মনে হচ্ছে", " bhishon"] if f.strip()]
NEG = ["নেই", "না", "nei", "na", "nai", "not", "no longer", "নাই"]
SUBJECT = ["amar", "tar", "rar", "আমার", "তার", "শিশুটির", "রোগীর", ""]
CONN = [", ", " এবং ", " ar ", " কিন্তু ", "; ", " + "]
SYMPTOMS = list(LEX.keys())

def phrase(sym, negated):
    term = random.choice(LEX[sym])
    tail = random.choice(NEG) if negated else random.choice(FILLER)
    s = (term + " " + tail).strip()
    return s

# symptoms whose own phrases embed negation words ("জ্ঞান নেই", "পানি খেতে পারছি না")
# — lexical negation does not compose on top of them (real linguistics)
NEG_EMBEDDED = {"unable_drink", "vomit_all", "unconscious"}

def make_multi(n_syms=None):
    """Return (sentence, {class: positive_bool}) with 1-3 symptoms, one possibly negated."""
    k = n_syms or (1 if random.random() < 0.45 else random.choice([2, 2, 3]))
    syms = random.sample(SYMPTOMS, k)
    labels, chunks = {}, []
    negatable = [i for i, sym in enumerate(syms) if sym not in NEG_EMBEDDED]
    negated_idx = random.choice(negatable) if (negatable and random.random() < 0.25) else -1
    for i, sym in enumerate(syms):
        neg = (i == negated_idx)
        labels[sym] = not neg
        chunks.append(phrase(sym, neg))
    subj = random.choice(SUBJECT)
    sent = (subj + " " if subj else "") + random.choice(CONN).join(chunks)
    if random.random() < 0.5:
        sent += " " + random.choice(FILLER)
    return re.sub(r"\s+", " ", sent).strip(), labels

def tokenize(text):
    t = re.sub(r"[^\w\u0980-\u09FF]+", " ", text.lower())
    words = t.split()
    return words + [words[i] + "_" + words[i + 1] for i in range(len(words) - 1)]

def build(n_train=5000, n_test=1200):
    train, test = [], []
    for _ in range(n_train):
        sent, labels = make_multi()
        train.append((sent, labels))
    for _ in range(n_test):
        sent, labels = make_multi()
        test.append((sent, labels))
    BG = ["কেমন আছেন", "dhonnobad", "thank you", "aj barite sobai ache", "সবাই ভালো আছে",
          "khabar kheyeche", "daktar ke dekhabo", "ami aschi", "report ta din", "ওষুধ কিনেছি",
          "riport korechi", "kal asbo", "bhalo thakben"]
    train += [(random.choice(BG), {}) for _ in range(400)]
    test += [(random.choice(BG), {}) for _ in range(100)]
    random.shuffle(train); random.shuffle(test)
    return train, test

def train_nb(train, alpha=0.35, top_k=220):
    pos_counts = {c: Counter() for c in SYMPTOMS}
    neg_counts = Counter()
    pos_tot = {c: 0 for c in SYMPTOMS}
    neg_tot = 0
    vocab = set()
    for sent, labels in train:
        toks = set(tokenize(sent))
        vocab.update(toks)
        for c in SYMPTOMS:
            if labels.get(c):
                pos_counts[c].update(toks); pos_tot[c] += len(toks)
            else:
                neg_counts.update(toks); neg_tot += len(toks)
    V = max(len(vocab), 1)
    model = {"classes": {}, "config": {"alpha": alpha, "vocab_size": V, "grams": "word 1-2", "tokenization": "set"}}
    for c in SYMPTOMS:
        weights = {}
        for tok in vocab:
            lp = math.log((pos_counts[c][tok] + alpha) / (pos_tot[c] + alpha * V))
            ln = math.log((neg_counts[tok] + alpha) / (neg_tot + alpha * V))
            # negative-clamp: in multi-symptom sentences, tokens of OTHER symptoms
            # must not veto this class ("ব্যথা" present ≠ no fever). Absence of
            # co-occurrence is weak evidence; negation itself is handled by the
            # deterministic NegEx layer, not by big negative weights.
            # positive-evidence scoring: negatives clamped to 0. In multi-symptom
            # text, tokens of OTHER symptoms must not veto a class; negation is
            # handled deterministically by the NegEx layer, not by weights.
            weights[tok] = max(lp - ln, 0.0)
        # frequency gate: singleton/bigram junk (1-2 positive occurrences) would
        # otherwise outrank real vocabulary by |w| — require >=3 positive hits
        cand = {t: w for t, w in weights.items() if pos_counts[c][t] >= 3}
        top = dict(sorted(cand.items(), key=lambda kv: -abs(kv[1]))[:top_k])
        model["classes"][c] = {"bias": 0.0, "weights": {t: round(v, 3) for t, v in top.items()}}
    return model

def words_of(sent):
    return re.sub(r"[^\w\u0980-\u09FF]+", " ", sent.lower()).split()

def negation_suppressed(model, sent, cls):
    """NegEx-style (Chapman et al. 2001): symptom phrase + immediately-following negation."""
    ws = words_of(sent)
    lex = model.get("lexicon", {}).get(cls, [])
    negs = [x.lower() for x in model.get("neg_tokens", [])]
    for phrase in lex:
        pw = phrase.split()
        n = len(pw)
        for i in range(len(ws) - n + 1):
            if ws[i:i + n] == pw and i + n < len(ws) and ws[i + n] in negs:
                return True
    return False

def infer(model, sent, threshold=None):
    if threshold is None:
        threshold = model.get("config", {}).get("threshold", 0.0)
    toks = set(tokenize(sent))
    flags = []
    for c in SYMPTOMS:
        cls = model["classes"][c]
        s = cls["bias"] + sum(cls["weights"].get(t, 0.0) for t in toks)
        if s > threshold and not negation_suppressed(model, sent, c):
            flags.append((c, round(s, 2)))
    return flags

def evaluate(model, data, threshold):
    tp = defaultdict(int); fp = defaultdict(int); fn = defaultdict(int)
    mtp = mfp = mfn = 0
    for sent, labels in data:
        truth = {c for c, pos in labels.items() if pos}
        pred = {c for c, _ in infer(model, sent, threshold)}
        for c in SYMPTOMS:
            if c in truth and c in pred: tp[c] += 1
            elif c in pred: fp[c] += 1
            elif c in truth: fn[c] += 1
        mtp += len(truth & pred); mfp += len(pred - truth); mfn += len(truth - pred)
    def prf(t, f, n):
        p = t / (t + f) if t + f else 0.0
        r = t / (t + n) if t + n else 0.0
        return round(p, 3), round(r, 3), round(2 * p * r / (p + r), 3) if p + r else 0.0
    return {c: prf(tp[c], fp[c], fn[c]) for c in SYMPTOMS}, prf(mtp, mfp, mfn)

def main():
    print("corpus (multi-symptom, multi-label)...")
    train_full, test = build()
    cut = int(0.85 * len(train_full))
    train, val = train_full[:cut], train_full[cut:]
    print(f"  train={len(train)} val={len(val)} test={len(test)}")
    model = train_nb(train)
    model["lexicon"] = {c: [p.lower() for p in LEX[c]] for c in SYMPTOMS}
    model["neg_tokens"] = NEG
    best_t, best_f = 0.0, -1.0
    t = -6.0
    while t <= 8.0:
        _, m = evaluate(model, val, t)
        if m[2] > best_f: best_f, best_t = m[2], t
        t += 0.25
    print(f"  threshold={best_t} (val micro-F1 {best_f})")
    model["config"]["threshold"] = round(best_t, 2)
    per, micro = evaluate(model, test, best_t)
    print("TEST micro P/R/F1:", micro)
    print("weakest:", sorted(per.items(), key=lambda kv: kv[1][2])[:4])
    assert micro[2] >= 0.85, f"held-out micro-F1 too low: {micro[2]}"
    # negation check
    ok = tot = 0
    for sent, labels in test:
        flags = {x for x, _ in infer(model, sent)}
        for c, pos in labels.items():
            if pos is False:  # generation-truth: this symptom was explicitly negated
                tot += 1
                if c not in flags: ok += 1
    neg_rej = round(ok / tot, 3) if tot else 0
    print(f"negation rejection: {ok}/{tot} = {neg_rej}")
    assert neg_rej >= 0.80, f"negation rejection too low: {neg_rej}"
    model["metrics"] = {
        "calibrated_threshold": round(best_t, 2),
        "train_sentences": len(train), "test_sentences": len(test),
        "micro_precision": micro[0], "micro_recall": micro[1], "micro_f1": micro[2],
        "negation_rejection_rate": neg_rej,
        "per_class_f1": {c: per[c][2] for c in SYMPTOMS},
        "trained": "2026-09-06", "seed": 20260906,
        "multi_label": True,
    }
    model["description"] = ("On-device symptom NLP: multinomial Naive Bayes, one-vs-rest, word 1-2 grams, "
                            "multi-label corpus (single + multi-symptom sentences), template-generated "
                            "(disclosed synthetic; fixed seed) + NegEx-style negation suppression "
                            "(Chapman et al. 2001). Maps free Bangla/Banglish/English text to symptom "
                            "flags ONLY — clinical decisions remain with the deterministic WHO rule engine.")
    json.dump(model, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print("exported:", OUT, round(os.path.getsize(OUT) / 1024, 1), "KB")

if __name__ == "__main__":
    main()
