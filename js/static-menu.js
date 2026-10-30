/**
 * ☰ nav bootstrap for the STATIC pages (site homepage, about.html, docs/)
 * — M30.4; M31 B/C adds the homepage and the per-app rows.
 * Mounts the shared drawer (js/menu.js) into the page's `.static-nav`
 * slot with root-relative links (`data-root="."` or `".."`). Settings
 * write the same conjuga.v1; theme changes apply live via the shared
 * themeSelector. No beacon here (static pages aren't in the allowlist —
 * deliberate) and no captured install prompt (instructions panel only).
 */
import { createMenuButton } from "./menu.js";

const slot = document.querySelector(".static-nav");
if (slot) {
  const root = slot.dataset.root || ".";
  // M31 B/C: home = the site homepage (/); Conjuga's own screens live
  // under /conjuga/, and both apps get a row (owner-approved links).
  slot.append(createMenuButton({
    links: {
      home: `${root}/`,
      informe: `${root}/conjuga/#/informe`,
      descargas: `${root}/conjuga/#/descargas`,
      acerca: root === "." ? "about.html" : `${root}/about.html`,
      docs: root === "." ? "docs/" : "./",
    },
    extraLinks: [
      { href: `${root}/conjuga/`, label: "Conjuga / Verbos" },
      { href: `${root}/cuentos/`, label: "Cuentos / Cuentos" },
    ],
  }));
}
