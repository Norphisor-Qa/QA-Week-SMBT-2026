/*
 * Quality Week 2026 — choix de la langue (français / anglais), partagé par toutes les pages.
 * À charger SANS defer, dans le <head>, avant les autres scripts :
 *   racine : <script src="./i18n.js"></script>
 *   jeux   : <script src="../../i18n.js"></script>
 *
 * API :
 *   QWI18N.lang                      -> "fr" ou "en"
 *   QWI18N.t(dict, "cle", {n: 3})    -> texte traduit ; {n} est remplacé
 *   QWI18N.apply(dict)               -> traduit les éléments [data-i18n], [data-i18n-html],
 *                                       [data-i18n-placeholder], [data-i18n-aria], [data-i18n-title]
 *   QWI18N.mount(element | null)     -> ajoute le sélecteur FR | EN (fixe en haut à droite si null)
 *   QWI18N.setGuard(fn)              -> fn() renvoie true si changer de langue doit être confirmé
 * Changer de langue recharge la page (la progression enregistrée est conservée).
 */
(() => {
  "use strict";
  const KEY = "qw-lang";
  const SUPPORTED = ["fr", "en"];
  let lang = null;
  try { lang = localStorage.getItem(KEY); } catch { /* stockage indisponible */ }
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (SUPPORTED.includes(fromUrl)) { lang = fromUrl; try { localStorage.setItem(KEY, lang); } catch { /* rien */ } }
  if (!SUPPORTED.includes(lang)) lang = "fr";
  document.documentElement.lang = lang;

  let guard = null;
  const MSG = {
    fr: { label: "Langue", confirm: "Changer de langue recharge la page : la partie en cours sera perdue. Continuer ?" },
    en: { label: "Language", confirm: "Changing the language reloads the page: the current game will be lost. Continue?" }
  };

  function t(dict, key, vars) {
    const table = (dict && (dict[lang] || dict.fr)) || {};
    let s = table[key];
    if (s === undefined && dict && dict.fr) s = dict.fr[key];
    if (s === undefined) s = key;
    if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  }

  function apply(dict, root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(dict, el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(dict, el.dataset.i18nHtml); });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(dict, el.dataset.i18nPlaceholder); });
    root.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(dict, el.dataset.i18nAria)); });
    root.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(dict, el.dataset.i18nTitle); });
    const title = document.querySelector("title[data-i18n]");
    if (title) document.title = t(dict, title.dataset.i18n);
  }

  function setLang(next) {
    if (!SUPPORTED.includes(next) || next === lang) return;
    if (guard && guard() && !confirm(MSG[lang].confirm)) return;
    try { localStorage.setItem(KEY, next); } catch { /* rien */ }
    const url = new URL(location.href);
    url.searchParams.delete("lang");
    location.replace(url.href);
  }

  function mount(container) {
    const box = document.createElement("div");
    box.className = "lang-switch" + (container ? "" : " lang-fixed");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", MSG[lang].label);
    if (!document.getElementById("qw-lang-style")) {
      const st = document.createElement("style");
      st.id = "qw-lang-style";
      st.textContent = ".lang-switch{display:inline-flex;border:2px solid #000;border-radius:999px;overflow:hidden;background:#fff;box-shadow:0 2px 8px #0003}.lang-switch button{min-height:44px;min-width:48px;border:0;background:transparent;color:#000;font:800 14px/1 Arial,sans-serif;cursor:pointer;padding:0 12px}.lang-switch button[aria-pressed=true]{background:#FFB500}.lang-switch button:focus-visible{outline:3px solid #000;outline-offset:-3px}.lang-fixed{position:fixed;top:10px;right:10px;z-index:9000}";
      document.head.appendChild(st);
    }
    SUPPORTED.forEach(code => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = code.toUpperCase();
      b.lang = code;
      b.setAttribute("aria-pressed", String(code === lang));
      b.setAttribute("aria-label", code === "fr" ? "Français" : "English");
      b.addEventListener("click", () => setLang(code));
      box.appendChild(b);
    });
    (container || document.body).appendChild(box);
    return box;
  }

  window.QWI18N = Object.freeze({
    get lang() { return lang; },
    t, apply, mount, setLang,
    setGuard(fn) { guard = typeof fn === "function" ? fn : null; }
  });
})();
