import assert from "node:assert/strict";
import test from "node:test";
import { getLocationMapUrl } from "./mapLinks.js";

test("map link focuses the requested location", () => {
  const url = new URL(getLocationMapUrl(12), "https://wayfinder.test");
  assert.equal(url.pathname, "/map");
  assert.equal(url.searchParams.get("focus"), "12");
});

test("navigate link includes a destination and request token", () => {
  const url = new URL(getLocationMapUrl(34, "navigate"), "https://wayfinder.test");
  assert.equal(url.searchParams.get("destination"), "34");
  assert.equal(url.searchParams.get("navigate"), "1");
  assert.ok(url.searchParams.get("request"));
});
