/**
 * ☰ shared site menu (M11 → M30.2 hamburger → M30.4 extraction).
 * One drawer implementation for the app AND the static pages
 * (about.html, docs/) — WAI-ARIA APG disclosure-navigation: text-only
 * rows, an "Ajustes / Settings" sub-group (switch rows in owner order
 * Vosotros → Pistas → Sonido, then Tema stacked), a visual-only scrim,
 * and a dialog handoff that closes the menu before overlays open.
 * Host-specific behavior arrives via hooks; storage is imported
 * directly (same conjuga.v1 on every page of the origin).
 */
import * as store from "./storage.js";

/** Tiny DOM builder — single source of truth (app.js re-exports use). */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

/** Auto is the DEFAULT (owner, 2026-07-19 — reverses the 2026-07-09
 *  Light default): unset/auto removes data-theme so the OS scheme wins;
 *  explicit light/dark pin it. Keep in sync with the inline loaders. */
export function applyTheme(t) {
  const html = document.documentElement;
  if (t === "light" || t === "dark") html.setAttribute("data-theme", t);
  else html.removeAttribute("data-theme");
}

export function themeSelector({ announce = () => {} } = {}) {
  const options = [
    { value: "auto", label: "Auto" },
    { value: "light", label: "Claro / Light" },
    { value: "dark", label: "Oscuro / Dark" },
  ];
  const current = () => store.getSettings().theme || "auto";
  const buttons = options.map((o) =>
    el("button", {
      class: "theme-option", type: "button",
      "aria-pressed": String(current() === o.value),
      "data-theme-value": o.value,
      onclick: () => {
        store.setSetting("theme", o.value);
        applyTheme(o.value);
        for (const b of buttons) {
          const active = b.getAttribute("data-theme-value") === o.value;
          b.setAttribute("aria-pressed", String(active));
        }
        announce(`Tema: ${o.label}`);
      },
    }, o.label));
  // M30.4: label ABOVE, options underneath (owner layout).
  return el("div", { class: "menu-link theme-selector", role: "group", "aria-label": "Tema / Theme" },
    el("span", { class: "theme-label" }, "Tema / Theme"),
    el("div", { class: "theme-options" }, ...buttons));
}

export function createInstallItem({
  beforeOpen = () => {},
  onOpen = () => {},
  getPrompt = () => null,
  onPromptUsed = () => {},
} = {}) {
  let overlay = null;
  const onKey = (e) => {
    if (e.key === "Escape") return close();
    if (e.key === "Tab" && overlay) {
      // cycle focus inside the dialog (it has 2-3 focusables)
      const focusables = [...overlay.querySelectorAll("button, a")];
      const i = focusables.indexOf(document.activeElement);
      e.preventDefault();
      const step = e.shiftKey ? -1 : 1;
      focusables[(i + step + focusables.length) % focusables.length].focus();
    }
  };
  const close = () => {
    overlay?.remove();
    overlay = null;
    document.removeEventListener("keydown", onKey);
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  };
  const btn = el("button", {
    class: "menu-link install-link", type: "button", "aria-expanded": "false",
    onclick: () => {
      if (overlay) return close();
      beforeOpen(); // the menu closes BEFORE the dialog opens (M30.2)
      onOpen();
      const prompt = getPrompt();
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const en = (t) => el("span", { class: "h-en", lang: "en" }, ` ${t}`);
      const how = prompt
        ? el("button", {
          class: "btn primary install-now", type: "button",
          onclick: () => {
            onPromptUsed();
            close();
            prompt.prompt?.();
          },
        }, "📲 Instalar ahora / Install now")
        : el("ol", { class: "install-steps" },
          ...(isIOS ? [
            el("li", {}, "En Safari, toca Compartir (el cuadrito con la flecha ⬆️).",
              en("In Safari, tap Share (the box with the arrow).")),
            el("li", {}, "Elige “Añadir a pantalla de inicio”.",
              en("Choose “Add to Home Screen.”")),
          ] : [
            el("li", {}, "Abre el menú del navegador (⋮).",
              en("Open the browser menu.")),
            el("li", {}, "Elige “Instalar aplicación” o “Añadir a pantalla de inicio”.",
              en("Choose “Install app” or “Add to Home Screen.”")),
          ]));
      overlay = el("div", { class: "info-overlay", onclick: (e) => { if (e.target === overlay) close(); } },
        el("div", { class: "info-panel install-panel", role: "dialog", "aria-modal": "true", "aria-label": "Instalar la app / Install the app" },
          el("button", { class: "info-close", "aria-label": "Cerrar / Close", onclick: close }, "✕"),
          el("p", { class: "info-kid" }, "📲 Instalar la app"),
          el("p", { class: "info-en" },
            "Con la app en tu pantalla de inicio y el audio descargado, Conjuga funciona sin internet.",
            en("Installed on your home screen, with downloaded audio, Conjuga works fully offline.")),
          how,
          el("p", { class: "info-more" },
            el("a", { href: "#/descargas", onclick: close }, "⬇️ Descargas / Offline audio"))));
      document.body.append(overlay);
      btn.setAttribute("aria-expanded", "true");
      overlay.querySelector(".info-close").focus();
      document.addEventListener("keydown", onKey);
    },
  }, "Instalar la app / Install");
  return btn;
}

export function createMenuButton({
  announce = () => {},
  soundGate = () => true,
  onUnmute = () => {},
  afterSetting = () => {},
  onReset = () => location.reload(),
  installOnOpen = () => {},
  getPrompt = () => null,
  onPromptUsed = () => {},
  links = {
    home: "#/", informe: "#/informe", descargas: "#/descargas",
    acerca: "about.html", docs: "docs/",
  },
} = {}) {
  let open = false;
  const scrim = el("div", { class: "menu-scrim no-print", hidden: true, "aria-hidden": "true" });

  // Standard on/off switch (M30.4 owner UX): label left, track+thumb
  // right; state = thumb position + track tint (never color alone).
  const switchRow = (label, name, { gate = () => true, onOn = () => {}, extraClass = "" } = {}) => {
    if (!gate()) return null;
    const sw = el("button", {
      class: `menu-link setting-row switch-row ${extraClass}`.trim(), type: "button",
      role: "switch", "aria-checked": String(!!store.getSettings()[name]),
      onclick: () => {
        const next = !store.getSettings()[name];
        sw.setAttribute("aria-checked", String(next));
        announce(`${label}: ${next ? "sí / on" : "no / off"}`);
        if (next) onOn();
        store.setSetting(name, next);
        afterSetting(name, next);
      },
    },
      el("span", { class: "switch-label" }, label),
      el("span", { class: "switch-track", "aria-hidden": "true" }, el("span", { class: "switch-thumb" })));
    return sw;
  };

  // Owner order (2026-07-19): Vosotros, Pistas, Sonido, then Tema.
  const settingsBody = el("div", { class: "menu-settings", hidden: true, id: "menu-settings" },
    switchRow("Vosotros/as", "vosotros", { extraClass: "setting-vosotros" }),
    switchRow("Pistas / Hints", "hints", { extraClass: "setting-hints" }),
    switchRow("Sonido / Sound", "sound", { gate: soundGate, onOn: onUnmute, extraClass: "sound-toggle" }),
    themeSelector({ announce }),
    el("button", {
      class: "menu-link setting-row borrar-row", type: "button",
      onclick: () => {
        if (confirm("¿Borrar todo el progreso? / Erase all progress?")) {
          store.resetProgress();
          close();
          onReset();
        }
      },
    }, "Borrar progreso / Erase progress"));
  const settingsBtn = el("button", {
    class: "menu-link settings-toggle", type: "button",
    "aria-expanded": "false", "aria-controls": "menu-settings",
    onclick: () => {
      const expand = settingsBody.hidden;
      settingsBody.hidden = !expand;
      settingsBtn.setAttribute("aria-expanded", String(expand));
    },
  }, "Ajustes / Settings");

  const panel = el("nav", { class: "menu-panel", id: "site-menu", hidden: true, "aria-label": "Páginas principales / Site menu" },
    el("a", { class: "menu-link", href: links.home }, "Inicio / Home"),
    el("a", { class: "menu-link", href: links.informe }, "Informe / Status"),
    el("a", { class: "menu-link", href: links.descargas }, "Descargas / Offline audio"),
    createInstallItem({ beforeOpen: () => close(), onOpen: installOnOpen, getPrompt, onPromptUsed }),
    el("a", { class: "menu-link", href: links.acerca }, "Acerca de / Standards"),
    el("a", { class: "menu-link", href: links.docs }, "Documentación / Docs"),
    settingsBtn,
    settingsBody);

  const onDoc = (e) => { if (!wrap.contains(e.target)) close(); };
  const onKey = (e) => { if (e.key === "Escape") { close(); } };
  const close = () => {
    if (!open) return;
    open = false;
    panel.hidden = true;
    scrim.hidden = true;
    document.body.classList.remove("menu-open");
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDoc);
    document.removeEventListener("keydown", onKey);
    btn.focus();
  };
  const btn = el("button", {
    class: "menu-btn", type: "button",
    "aria-expanded": "false", "aria-controls": "site-menu",
    "aria-label": "Menú del sitio / Site menu",
    onclick: () => {
      if (open) return close();
      open = true;
      panel.hidden = false;
      scrim.hidden = false;
      document.body.classList.add("menu-open");
      btn.setAttribute("aria-expanded", "true");
      setTimeout(() => document.addEventListener("click", onDoc), 0); // skip the opening click
      document.addEventListener("keydown", onKey);
      panel.querySelector("a").focus();
    },
  }, "☰");
  // navigating from a row closes the drawer (typical hamburger behavior)
  panel.addEventListener("click", (e) => {
    if (e.target.closest("a.menu-link")) close();
  });
  const wrap = el("span", { class: "menu-wrap no-print" }, btn, scrim, panel);
  return wrap;
}
