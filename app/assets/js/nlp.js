// ShasthoSathi on-device symptom NLP — browser inference for the trained model
// (app/data/nlp_model.json). Port of research/train_nlp.py infer(): multinomial NB
// (one-vs-rest, word 1-2 grams, set tokens) + NegEx-style adjacency negation
// suppression (Chapman et al. 2001). Model JSON: 87 KB, loads offline once, cached by SW.

let MODEL = null;

export async function loadModel() {
  if (MODEL) return MODEL;
  const res = await fetch("data/nlp_model.json");
  MODEL = await res.json();
  return MODEL;
}

export function wordsOf(sent) {
  return String(sent || "").toLowerCase().replace(/[^\w\u0980-\u09FF]+/g, " ").split(/\s+/).filter(Boolean);
}

export function tokenize(sent) {
  const words = wordsOf(sent);
  const grams = words.slice();
  for (let i = 0; i < words.length - 1; i++) grams.push(words[i] + "_" + words[i + 1]);
  return grams;
}

function negationSuppressed(model, sent, cls) {
  const ws = wordsOf(sent);
  const lex = (model.lexicon && model.lexicon[cls]) || [];
  const negs = (model.neg_tokens || []).map((x) => x.toLowerCase());
  for (const phrase of lex) {
    const pw = phrase.split(/\s+/).filter(Boolean);
    for (let i = 0; i + pw.length <= ws.length; i++) {
      let match = true;
      for (let j = 0; j < pw.length; j++) if (ws[i + j] !== pw[j]) { match = false; break; }
      if (match && i + pw.length < ws.length && negs.includes(ws[i + pw.length])) return true;
    }
  }
  return false;
}

/** @returns {Array<{symptom:string, score:number}>} symptom flags above threshold */
export function classify(model, sent) {
  const threshold = (model.config && model.config.threshold) || 0.0;
  const toks = new Set(tokenize(sent));
  const out = [];
  for (const [cls, obj] of Object.entries(model.classes)) {
    let s = obj.bias || 0;
    for (const t of toks) if (obj.weights[t] !== undefined) s += obj.weights[t];
    if (s > threshold && !negationSuppressed(model, sent, cls)) {
      out.push({ symptom: cls, score: Math.round(s * 100) / 100 });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

export async function classifyLoaded(sent) {
  return classify(await loadModel(), sent);
}
