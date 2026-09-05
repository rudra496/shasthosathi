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

// ---------- KPIs ----------
const yr = Object.fromEntries(annual.years.map((r) => [r.year, r]));
el("kpis").innerHTML = [2023, 2024, 2025].map((y) => `
  <div class="card kpi">
    <div class="num">${fmt(yr[y].cases)}</div>
    <div class="lbl">${t("kpi_" + (y === 2023 ? "2023" : y), lang)} · ${fmt(yr[y].deaths)} ${lang === "bn" ? "মৃত্যু" : "deaths"}</div>
  </div>`).join("");

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

// ---------- map: population-share choropleth ----------
const prio = Object.fromEntries(fc.division_priority_demo.map((d) => [d.division, d.demo_priority_index]));
// geoBoundaries names -> our census names
const NAME_MAP = { "Chittagong": "Chattogram", "Rajshani": "Rajshahi", "Barisal": "Barishal" };
const color = (v) => v > 20 ? "#134e4a" : v > 15 ? "#0f766e" : v > 10 ? "#14b8a6" : v > 7 ? "#5eead4" : "#ccfbf1";
const map = L.map("map").setView([23.7, 90.3], 6.4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { attribution: "© OpenStreetMap contributors" }).addTo(map);
const geo = await (await fetch("../data/divisions.geojson")).json();
L.geoJSON(geo, {
  style: (f) => {
    const name = NAME_MAP[f.properties.shapeName] || f.properties.shapeName;
    const v = prio[name] ?? 0;
    return { fillColor: color(v), fillOpacity: 0.75, color: "#0f766e", weight: 1 };
  },
  onEachFeature: (f, layer) => {
    const name = NAME_MAP[f.properties.shapeName] || f.properties.shapeName;
    const pop = pops.divisions[name];
    layer.bindPopup(`<b>${name}</b><br>${lang === "bn" ? "জনসংখ্যা" : "Population"}: ${fmt(pop)}<br>${lang === "bn" ? "অগ্রাধিকার সূচি" : "Priority index"}: ${prio[name] ?? 0}/100`);
  },
}).addTo(map);
el("legend").innerHTML = [5, 10, 15, 22].map((v) =>
  `<span><span class="swatch" style="background:${color(v)}"></span> ${v}${lang === "bn" ? "+" : "+"}</span>`).join("")
  + `<span class="small">— ${lang === "bn" ? "জনসংখ্যার অনুপাতে অগ্রাধিকার (ডেমো)" : "population-share priority (demo)"}</span>`;

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

// ---------- limitations ----------
el("lims").innerHTML = fc.limitations.map((l) => `<li>${l}</li>`).join("");
