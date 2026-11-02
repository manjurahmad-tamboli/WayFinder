import test from "node:test";
import assert from "node:assert/strict";

import { copyTextToClipboard, formatLocationCoordinates, makeLocationShareUrl } from "./shareUtils.js";

test("location links reuse the existing plural detail route and validate IDs", () => {
  assert.equal(makeLocationShareUrl(17, "https://wayfinder.example/"), "https://wayfinder.example/locations/17");
  assert.equal(makeLocationShareUrl("bad", "https://wayfinder.example"), "");
});

test("coordinates are copied only when both values are real and in range", () => {
  assert.equal(formatLocationCoordinates({ latitude: 16.845935, longitude: 74.602656 }), "16.845935, 74.602656");
  assert.equal(formatLocationCoordinates({ latitude: null, longitude: 74.6 }), "");
  assert.equal(formatLocationCoordinates({ latitude: 95, longitude: 74.6 }), "");
});

test("clipboard uses the modern API when available", async () => {
  let written = "";
  const copied = await copyTextToClipboard("https://wayfinder.example/locations/17", {
    navigatorObject: { clipboard: { writeText: async (value) => { written = value; } } },
    documentObject: null,
  });
  assert.equal(copied, true);
  assert.equal(written, "https://wayfinder.example/locations/17");
});

test("clipboard falls back to a temporary selected text field", async () => {
  let selectedText = "";
  let removed = false;
  const body = {
    appendChild(field) { field.parentNode = body; },
    removeChild(field) { field.parentNode = null; removed = true; },
  };
  const documentObject = {
    body,
    createElement: () => ({
      style: {},
      setAttribute() {},
      focus() {},
      select() { selectedText = this.value; },
      parentNode: null,
    }),
    execCommand: (command) => command === "copy",
  };
  const copied = await copyTextToClipboard("16.845935, 74.602656", {
    navigatorObject: { clipboard: { writeText: async () => { throw new Error("permission denied"); } } },
    documentObject,
  });
  assert.equal(copied, true);
  assert.equal(selectedText, "16.845935, 74.602656");
  assert.equal(removed, true);
});
