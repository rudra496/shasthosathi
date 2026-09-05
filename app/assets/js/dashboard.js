// ShasthoSathi supervisor dashboard — renders verified data + model output + map + bulletin.
import { initShell, el } from "./app.js";
import { settings } from "./store.js";
import { t } from "./i18n.js";

initShell("dashboard");
const lang = settings.lang || "bn";
const bnNum = (x) => lang === "bn" ? String(x).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]) : String(x);
const fmt = (n) => bnNum(Number(n).toLocaleString("en-US"));

const monthly = await (await fetch("../data/dengue_monthly_2023.json")).json();
const annual = await (await fetch("../data/dengue_annual.json")).json();
const fc = await (await fetch("../data/forecast.json")).json();
const pops = await (await fetch("../data/division_population.json")).json();
const decade = await (await fetch("../data/dengue_decade_2014_2023.json")).json();
const y26 = await (await fetch("../data/dengue_2026_ytd.json")).json();
const { riskIndex, toCSV } = await import("./risk.js");

// ---------- KPIs ----------
const yr = Object.fromEntries(annual.years.map((r) => [r.year, r]));
el("kpis").innerHTML = [2023, 2024, 2025].map((y) => `
  <div class="card kpi">
    <div class="num">${fmt(yr[y].cases)}</div>
    <div class="lbl">${t("kpi_" + (y === 2023 ? "2023" : y), lang)} · ${fmt(yr[y].deaths)} ${lang === "bn" ? "মৃত্যু" : "deaths"}</div>
  </div>`).join("") + `
  <div class="card kpi">
    <div class="num">${fmt(y26.kpi.cases)}</div>
    <div class="lbl">${lang === "bn" ? "২০২৬ (৫ সেপ্টেম্বর পর্যন্ত)" : "2026 YTD (to Sep 5)"} · ${fmt(y26.kpi.deaths)} ${lang === "bn" ? "মৃত্যু" : "deaths"}</div>
  </div>`;

// ---------- decade chart (peer-reviewed series 2014-2023) ----------
{
  const dc = decade.cases.map(([y, v]) => ({ label: y.slice(2), a: v, b: null }));
  el("chartDecade").innerHTML = bars(dc, "bar-a", "bar-a", 321179 * 1.05);
  const dsum = decade.cases.reduce((s, [, v]) => s + v, 0);
  const dsumD = decade.deaths.reduce((s, [, v]) => s + v, 0);
  console.assert(dsum === 535970 && dsumD === 2300, "decade sums must match the paper");
}

// ---------- weather nowcast (live Open-Meteo; offline shows last cache) ----------
(async () => {
  const box = el("nowcast");
  const CARD = (v, lbl) => `<div class="kpi"><div class="num">${v}</div><div class="lbl">${lbl}</div></div>`;
  try {
    const u = "https://api.open-meteo.com/v1/forecast?latitude=23.8103&longitude=90.4125" +
      "&current=temperature_2m,relative_humidity_2m,precipitation&timezone=Asia%2FDhaka";
    const d = await (await fetch(u)).json();
    const c = d.current;
    localStorage.setItem("ss_nowcast", JSON.stringify({ ...c, at: new Date().toISOString() }));
    box.innerHTML = CARD(bnNum(c.temperature_2m) + "°C", lang === "bn" ? "তাপমাত্রা" : "Temperature") +
      CARD(bnNum(c.relative_humidity_2m) + "%", lang === "bn" ? "আর্দ্রতা" : "Humidity") +
      CARD(bnNum(c.precipitation) + " mm", lang === "bn" ? "বৃষ্টি (এখন)" : "Rain (now)");
  } catch {
    const cached = localStorage.getItem("ss_nowcast");
    if (cached) {
      const c = JSON.parse(cached);
      box.innerHTML = CARD(bnNum(c.temperature_2m) + "°C", lang === "bn" ? "তাপমাত্রা" : "Temperature") +
        CARD(bnNum(c.relative_humidity_2m) + "%", lang === "bn" ? "আর্দ্রতা" : "Humidity") +
        CARD(bnNum(c.precipitation) + " mm", lang === "bn" ? "বৃষ্টি" : "Rain") +
        `<p class="small">${t("nowcast_off", lang)} · ${c.at.slice(0, 16).replace("T", " ")}</p>`;
    } else {
      box.innerHTML = `<p class="small">${t("nowcast_off", lang)}</p>`;
    }
  }
})();

// ---------- risk calculator (what-if, trained coefficients only) ----------
{
  const R = (id) => Number(el(id).value);
  const ref = { rain_lag1: 300, rain_lag2: 300, rh_lag1: 80 }; // typical monsoon month = reference 100
  const upd = () => {
    el("rcR1v").textContent = bnNum(R("rcR1")) + " mm";
    el("rcR2v").textContent = bnNum(R("rcR2")) + " mm";
    el("rcH1v").textContent = bnNum(R("rcH1")) + " %";
    const idx = riskIndex(fc.model.coefficients,
      { rain_lag1: R("rcR1"), rain_lag2: R("rcR2"), rh_lag1: R("rcH1") }, ref);
    el("rcOut").textContent = bnNum(idx) + " / " + bnNum(100);
  };
  ["rcR1", "rcR2", "rcH1"].forEach((id) => el(id).addEventListener("input", upd));
  upd();
}

// ---------- 2023 chart: actual vs model ----------
function bars(items, clsA, clsB, maxV) {
  const W = 620, H = 220, pad = 28, bw = (W - 2 * pad) / items.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  const line = items.map((it, i) => {
    const h = it.b ? Math.round((it.b / maxV) * (H - 50)) : 0;
    return `<rect x="${pad + i * bw + bw * 0.18}" y="${H - 24 - h}" width="${bw * 0.64}" height="${h}" class="${clsB}"/>`;
  }).join("");
  for (const [i, it] of items.entries()) {
    const h = Math.round((it.a / maxV) * (H - 50));
    s += `<rect x="${pad + i * bw + bw * 0.18}" y="${H - 24 - h}" width="${bw * 0.64}" height="${h}" class="${clsA}"/>`;
    s += `<text x="${pad + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle" class="axis">${it.label}</text>`;
  }
  s += line + `</svg>`;
  return s;
}
const fit = fc.model.fit_monthly.map((r) => ({
  label: r.month.slice(5), a: r.actual, b: r.fitted,
}));
el("chart2023").innerHTML = bars(fit, "bar-a", "bar-b", 80000);
el("modelInfo").innerHTML =
  `${t("model_info", lang)}: ${fc.model.form} · R²(log)=<b>${fc.model.in_sample_r2_log}</b>, ` +
  `LOO-MAE(log₁₀)=${fc.model.loo_mae_log10} · ` +
  (lang === "bn"
    ? "প্রশিক্ষণ: ২০২৩ মাসিক সিরিজ (Hossain et al. 2025) + Open-Meteo আবহাওয়া"
    : "Trained on the 2023 monthly series (Hossain et al. 2025) + Open-Meteo weather");

// ---------- 2026 outlook: relative risk index ----------
const p26 = fc.projection_2026.months.filter((m) => m.predicted_cases != null);
const maxP = Math.max(...p26.map((m) => m.predicted_cases), 1);
el("chart2026").innerHTML = bars(
  p26.map((m) => ({ label: m.month.slice(5), a: m.predicted_cases, b: null })),
  "bar-c", "bar-c", maxP * 1.05);
el("outlookNote").innerHTML =
  (lang === "bn"
    ? `সূচি ০–১০০ (সর্বোচ্চ মাস = ১০০)। এটি জলবায়ু-ভিত্তিক <b>আপেক্ষিক ঝুঁকির আকৃতি</b>, পরম কেস-পূর্বাভাস নয় — কারণ মডেল মহামারি-বার্নআউট ধরতে পারে না (২০২৪: ${fmt(fc.out_of_sample_annual_checks[0].ratio_model_over_actual)}×, ২০২৫: ${fmt(fc.out_of_sample_annual_checks[1].ratio_model_over_actual)}× অতিরিক্ত অনুমান — সীমাবদ্ধতা দেখুন)।`
    : `Index 0–100 (peak month = 100). This is a climate-driven <b>relative risk shape</b>, not an absolute case forecast — the model cannot capture epidemic burn-out (annual overshoot 2024: ${fc.out_of_sample_annual_checks[0].ratio_model_over_actual}×, 2025: ${fc.out_of_sample_annual_checks[1].ratio_model_over_actual}× — see limitations).`);

// ---------- 2026 season: model vs ACTUAL (live DGHS data) ----------
{
  const pred = Object.fromEntries(fc.projection_2026.months.map((m) => [m.month, m.predicted_cases]));
  const act = Object.fromEntries(y26.monthly_cases.map(([m, v]) => [m, v]));
  const completeMonths = Object.keys(act).filter((m) => m < "2026-09"); // Sep is partial (to Sep 5)
  const rows = completeMonths.map((m) => ({ label: m.slice(5), a: act[m], b: pred[m] || 0 }));
  const maxV = Math.max(...rows.flatMap((r) => [r.a, r.b])) * 1.05;
  el("chart2026cmp").innerHTML = bars(rows, "bar-a", "bar-b", maxV);
  // amplitude ratio over complete monsoon months (May-Aug), Sep excluded (partial)
  const ratios = ["2026-05", "2026-06", "2026-07", "2026-08"]
    .map((m) => pred[m] / act[m]).filter(Number.isFinite);
  const med = ratios.sort((x, y) => x - y)[Math.floor(ratios.length / 2)];
  el("cmpNote").innerHTML = (lang === "bn"
    ? `নীল = বাস্তব (DGHS, ৫ সেপ্টেম্বর পর্যন্ত), হলুদ = মডেলের পূর্বাভাস। মডেল <b>মৌসুমের সময়-রূপ</b> ধরতে পেরেছে (আগস্টই শিখর — আবহাওয়া থেকেই), কিন্তু প্রাবল্য মাত্রাতিরিক্ত (মে–আগস্ট মিডিয়ান ${bnNum(Math.round(med * 100))}%); সেপ্টেম্বর আংশিক (৫ দিন) — তাই তুলনার বাইরে। কারণ জানা: মডেলে কেস-ফিডব্যাক নেই (সীমাবদ্ধতা দেখুন) — এটিই ফিল্ড ডিপ্লয়মেন্টে সংশোধনের প্রথম কাজ।`
    : `Teal = ACTUAL (DGHS, through Sep 5), amber = model prediction. The model captures the <b>seasonal shape</b> from weather alone (August is the actual peak), but over-predicts amplitude (May–Aug median ${Math.round(med * 100)}%); September is partial (5 days) and excluded. Known cause: no case-feedback term (see limitations) — the first fix for field deployment.`);
}

// ---------- map: population-share choropleth ----------
const prio = Object.fromEntries(fc.division_priority_demo.map((d) => [d.division, d.demo_priority_index]));
// geoBoundaries names -> our census names
const NAME_MAP = { "Chittagong": "Chattogram", "Rajshani": "Rajshahi", "Barisal": "Barishal" };
const divCases = y26.division_2026.cases, divDeaths = y26.division_2026.deaths;
const color = (v) => v > 8000 ? "#134e4a" : v > 4000 ? "#0f766e" : v > 2000 ? "#14b8a6" : v > 1000 ? "#5eead4" : "#ccfbf1";
const map = L.map("map").setView([23.7, 90.3], 6.4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { attribution: "© OpenStreetMap contributors" }).addTo(map);
const geo = await (await fetch("../data/divisions.geojson")).json();
L.geoJSON(geo, {
  style: (f) => {
    const name = NAME_MAP[f.properties.shapeName] || f.properties.shapeName;
    return { fillColor: color(divCases[name] ?? 0), fillOpacity: 0.78, color: "#0f766e", weight: 1 };
  },
  onEachFeature: (f, layer) => {
    const name = NAME_MAP[f.properties.shapeName] || f.properties.shapeName;
    const pop = pops.divisions[name];
    layer.bindPopup(`<b>${name}</b><br>${lang === "bn" ? "২০২৬ কেস (৫ সেপ্টে পর্যন্ত)" : "2026 cases (to Sep 5)"}: <b>${fmt(divCases[name] ?? 0)}</b><br>${lang === "bn" ? "মৃত্যু" : "deaths"}: ${fmt(divDeaths[name] ?? 0)}<br>${lang === "bn" ? "জনসংখ্যা" : "Population"}: ${fmt(pop)}`);
  },
}).addTo(map);
el("legend").innerHTML = [1000, 2000, 4000, 8001].map((v) =>
  `<span><span class="swatch" style="background:${color(v)}"></span> ${v === 8001 ? "৮,০০০+" : bnNum(v) + "+"}</span>`).join("")
  + `<span class="small">— ${lang === "bn" ? "বাস্তব ২০২৬ কেস/বিভাগ (DGHS, ৫ সেপ্টেম্বর)" : "real 2026 cases/division (DGHS, Sep 5)"}</span>`;

// ---------- bulletin ----------
const sel = el("bulletinMonth");
for (const r of monthly.months) {
  const o = document.createElement("option");
  o.value = r[0]; o.textContent = r[0];
  sel.appendChild(o);
}
el("genB").onclick = () => {
  const m = sel.value;
  const row = monthly.months.find(([k]) => k === m);
  const cases = row[1];
  const top = fc.division_priority_demo.slice(0, 3).map((d) => d.division).join(", ");
  const dateStr = new Date().toISOString().slice(0, 10);
  el("bulletinOut").value =
    (lang === "bn" ? "সাপ্তাহিক ডেঙ্গু পরিস্থিতি বুলেটিন" : "WEEKLY DENGUE SITUATION BULLETIN") +
    `\n${lang === "bn" ? "তারিখ" : "Date"}: ${dateStr}\n` +
    "================================\n" +
    (lang === "bn"
      ? `১) ঐতিহাসিক রেফারেন্স — ${m}: ${fmt(cases)} কেস (২০২৩, Hossain et al. 2025, doi:10.1002/hsr2.70852)\n`
      : `1) Historical reference — ${m}: ${fmt(cases)} cases (2023, Hossain et al. 2025, doi:10.1002/hsr2.70852)\n`) +
    (lang === "bn"
      ? `২) বছরভিত্তিক: ২০২৩ ${fmt(yr[2023].cases)}/${fmt(yr[2023].deaths)} · ২০২৪ ${fmt(yr[2024].cases)}/${fmt(yr[2024].deaths)} · ২০২৫ ${fmt(yr[2025].cases)}/${fmt(yr[2025].deaths)} (DGHS)\n`
      : `2) Annual: 2023 ${fmt(yr[2023].cases)}/${fmt(yr[2023].deaths)} · 2024 ${fmt(yr[2024].cases)}/${fmt(yr[2024].deaths)} · 2025 ${fmt(yr[2025].cases)}/${fmt(yr[2025].deaths)} (DGHS)\n`) +
    (lang === "bn"
      ? `৩) মডেলের ২০২৬ আপেক্ষিক ঝুঁকি-শিখর: ${bnNum(p26.reduce((a, b) => a.predicted_cases > b.predicted_cases ? a : b).month.slice(5))} মাস\n`
      : `3) Model 2026 relative-risk peak month: ${p26.reduce((a, b) => a.predicted_cases > b.predicted_cases ? a : b).month.slice(5)}\n`) +
    (lang === "bn"
      ? `৪) অগ্রাধিকার এলাকা (জনসংখ্যা-ভিত্তিক ডেমো): ${top}\n`
      : `4) Priority areas (population-share demo): ${top}\n`) +
    (lang === "bn"
      ? "৫) সুপারিশ: বিপদ-সংকেত প্রচার, পানি জমা রোধ, টেস্ট-কিট বরাদ্দ।\n— স্বাস্থ্যসাথী (স্বয়ংক্রিয় খসড়া; সুপারভাইজার যাচাই করবেন)"
      : "5) Recommended actions: warning-sign awareness drive, larval-source reduction, allocate test kits.\n— ShasthoSathi (auto-draft; to be verified by supervisor)");
};
el("copyB").onclick = () => navigator.clipboard.writeText(el("bulletinOut").value);
el("printB").onclick = () => window.print();

// ---------- limitations ----------
el("lims").innerHTML = fc.limitations.map((l) => `<li>${l}</li>`).join("");
