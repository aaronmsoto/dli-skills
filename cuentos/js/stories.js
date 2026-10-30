/**
 * Story index — display order on the Biblioteca shelf (owner order,
 * 2026-10-30: two familiar fables first for schema transfer, then the
 * three Hispanic authors). One import per data module (docs/CUENTOS.md
 * §5); the validator asserts this list and cuentos/js/data/ stay in sync.
 */
import leonRaton from "./data/leon-raton.js";
import liebreTortuga from "./data/liebre-tortuga.js";
import pobreViejecita from "./data/pobre-viejecita.js";
import tortugaGigante from "./data/tortuga-gigante.js";
import munecaNegra from "./data/muneca-negra.js";

export const STORIES = [
  leonRaton,
  liebreTortuga,
  pobreViejecita,
  tortugaGigante,
  munecaNegra,
];

export const byId = (id) => STORIES.find((s) => s.id === id) || null;
