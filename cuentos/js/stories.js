/**
 * Story index — display order on the Biblioteca shelf. One import per
 * data module (docs/CUENTOS.md §5); the validator asserts this list and
 * cuentos/js/data/ stay in sync.
 */
import leonRaton from "./data/leon-raton.js";

export const STORIES = [
  leonRaton,
];

export const byId = (id) => STORIES.find((s) => s.id === id) || null;
