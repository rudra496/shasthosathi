// ShasthoSathi shared shell: header/nav/footer, i18n apply, online banner, SW register.
import { t } from "./i18n.js";
import { settings as store_settings } from "./store.js";

export function applyI18n() {
  const lang = store_settings.lang || "bn";
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n, lang);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh, lang);
  });
  const btn = document.getElementById("langToggle");
  if (btn) btn.textContent = t("lang_toggle", lang);
}

export function header(active) {
  const inSub = location.pathname.replace(/\\/g, "/").split("/").slice(-2, -1)[0] === "dashboard";
  const pre = inSub ? "../" : "";
  const items = [
    ["index.html", "home"],
    ["triage.html", "triage"],
    ["register.html", "registry"],
    ["followups.html", "followups"],
    ["maternal.html", "maternal"],
    ["reader.html", "reader"],
    ["camp.html", "camp"],
    ["learn.html", "learn"],
    ["dashboard/index.html", "dashboard"],
  ];
  const lang = store_settings.lang || "bn";
  const links = items.map(([href, key]) =>
    `<a href="${pre}${href}" class="${active === key ? "active" : ""}">${t(key, lang)}</a>`).join("");
  return `
  <header class="topbar">
    <div class="brand">
      <span class="logo">✚</span>
      <div>
        <div class="name">${t("app_name", lang)}</div>
        <div class="tag">${t("app_tag", lang)}</div>
      </div>
      <button id="langToggle" class="langbtn" aria-label="language"></button>
    </div>
    <nav class="nav">${links}</nav>
    <div id="netBanner" class="netbanner"></div>
  </header>`;
}

export function footer() {
  const lang = store_settings.lang || "bn";
  return `<footer class="foot">
    <span>${t("disclaimer", lang)}</span>
    <span class="src">${t("source_note", lang)} — <a href="https://github.com/rudra496/shasthosathi">GitHub</a></span>
  </footer>`;
}

export function initShell(active) {
  const mount = document.getElementById("shell");
  if (mount) {
    mount.innerHTML = header(active) + mount.innerHTML + footer();
  }
  applyI18n();
  const btn = document.getElementById("langToggle");
  if (btn) {
    btn.onclick = () => {
      store_settings.lang = (store_settings.lang === "bn") ? "en" : "bn";
      location.reload();
    };
  }
  updateNetBanner();
  window.addEventListener("online", updateNetBanner);
  window.addEventListener("offline", updateNetBanner);
  if ("serviceWorker" in navigator) {
    const inSub = location.pathname.replace(/\\/g, "/").split("/").slice(-2, -1)[0] === "dashboard";
    navigator.serviceWorker.register((inSub ? "../" : "./") + "sw.js").catch(() => {});
  }
}

function updateNetBanner() {
  const b = document.getElementById("netBanner");
  if (!b) return;
  const lang = store_settings.lang || "bn";
  if (navigator.onLine) { b.textContent = "🟢 " + t("online", lang); b.classList.remove("off"); }
  else { b.textContent = "⚫ " + t("offline", lang); b.classList.add("off"); }
}

export function el(id) { return document.getElementById(id); }
