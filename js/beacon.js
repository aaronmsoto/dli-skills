/**
 * 📊 M28 client beacon — fire-and-forget aggregate counting against our
 * own Worker (server/worker.js; privacy contract: the signed amendment
 * + owner-approved uniques addendum, both disclosed on about.html).
 * Events (named in docs/SPEC.md §5.7): "view" per screen render,
 * "dl" on a completed Descargas group download, "install" on opening
 * the install panel. Analytics is never allowed to break or slow the
 * app: every path is guarded and wrapped.
 */

// One constant = the whole endpoint story (workers.dev now; a branded
// api.dliskills.com later would change only this line).
const ENDPOINT = "https://conjuga-api.soto-c30.workers.dev/beacon";

/** Pure decision function (unit-tested): should a beacon fire at all? */
export function beaconAllowed(ctx) {
  if (!ctx.sendBeacon) return false;
  if (ctx.hostname === "localhost" || ctx.hostname.startsWith("127.")) return false;
  if (ctx.webdriver) return false; // e2e harness stays silent
  if (ctx.noSW) return false;      // the harness/dev opt-out flag
  if (ctx.gpc) return false;       // respect Global Privacy Control
  return true;
}

function currentCtx() {
  return {
    sendBeacon: typeof navigator !== "undefined" && !!navigator.sendBeacon,
    hostname: location.hostname,
    webdriver: !!navigator.webdriver,
    noSW: !!sessionStorage.getItem("conjuga.noSW"),
    gpc: !!navigator.globalPrivacyControl,
  };
}

function send(page, event) {
  try {
    if (!beaconAllowed(currentCtx())) return;
    navigator.sendBeacon(ENDPOINT, JSON.stringify({ page, event }));
  } catch {
    /* never surface analytics failures */
  }
}

export const pageView = (page) => send(page, "view");
export const feature = (page, event) => send(page, event);
