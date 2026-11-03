import assert from "node:assert/strict";
import test from "node:test";

import {
  filterLocationsByCategories,
  LOCATION_CATEGORY_KEYS,
} from "./locationCategories.js";

const locations = [
  { id: 1, category: "Academic" },
  { id: 2, category: " food " },
  { id: 3, category: "HOSTEL" },
  { id: 4, category: "Campus Services" },
];

test("all selected categories preserve every location, including unknown categories", () => {
  assert.deepEqual(
    filterLocationsByCategories(locations, new Set(LOCATION_CATEGORY_KEYS)),
    locations
  );
});

test("a single selected category matches capitalization and whitespace consistently", () => {
  const matches = filterLocationsByCategories(locations, new Set(["food"]));
  assert.deepEqual(matches.map((location) => location.id), [2]);
});

test("multiple selected categories return the union of matching locations", () => {
  const matches = filterLocationsByCategories(
    locations,
    new Set(["academic", "hostel"])
  );
  assert.deepEqual(matches.map((location) => location.id), [1, 3]);
});

test("clear all returns no locations", () => {
  assert.deepEqual(filterLocationsByCategories(locations, new Set()), []);
});
