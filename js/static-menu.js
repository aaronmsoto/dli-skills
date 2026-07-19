/**
 * ☰ nav bootstrap for the STATIC pages (about.html, docs/) — M30.4.
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
  slot.append(createMenuButton({
    links: {
      home: `${root}/`,
      informe: `${root}/#/informe`,
      descargas: `${root}/#/descargas`,
      acerca: root === "." ? "about.html" : `${root}/about.html`,
      docs: root === "." ? "docs/" : "./",
    },
  }));
}
