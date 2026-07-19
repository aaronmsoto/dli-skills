/**
 * M28 client beacon — the pure guard function's truth table. The
 * "fires zero requests in the harness" behavior is asserted in e2e;
 * the positive live path was verified against the deployed Worker
 * during M28.1 (localhost guard makes an in-harness positive test
 * impossible by design).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { beaconAllowed } from "../js/beacon.js";

const OK = { sendBeacon: true, hostname: "dliskills.com", webdriver: false, noSW: false, gpc: false };

test("beaconAllowed: fires only on the real site with every guard clear", () => {
  assert.equal(beaconAllowed(OK), true);
});

test("beaconAllowed: each guard independently blocks", () => {
  assert.equal(beaconAllowed({ ...OK, sendBeacon: false }), false, "no sendBeacon API");
  assert.equal(beaconAllowed({ ...OK, hostname: "localhost" }), false, "localhost");
  assert.equal(beaconAllowed({ ...OK, hostname: "127.0.0.1" }), false, "loopback");
  assert.equal(beaconAllowed({ ...OK, webdriver: true }), false, "e2e harness");
  assert.equal(beaconAllowed({ ...OK, noSW: true }), false, "conjuga.noSW opt-out");
  assert.equal(beaconAllowed({ ...OK, gpc: true }), false, "Global Privacy Control");
});
