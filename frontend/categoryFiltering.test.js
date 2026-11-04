import assert from "node:assert/strict";
import test from "node:test";

import {
  createAllCategorySet,
  filterLocationsByCategories,
  normalizeCategoryKey,
  toggleCategorySelection,
} from "./src/components/categoryUtils.js";
import { DEFAULT_CATEGORY_STYLE, getCategoryStyle } from "./src/components/categoryConfig.js";

const locations = [
  { id: 1, name: "Library", category: "Academic" },
  { id: 2, name: "Computer Department", category: " Academic " },
  { id: 3, name: "Canteen", category: "Food" },
  { id: 4, name: "Hostel", category: "Hostel" },
  { id: 5, name: "Running Track", category: "Sports" },
  { id: 6, name: "Main Gate", category: "Landmark" },
  { id: 7, name: "Parking", category: "Facilities" },
  { id: 8, name: "Visitor Desk", category: "Visitor Services" },
];

test("all known and present categories are selected on first load", () => {
  const selected = createAllCategorySet(locations);

  assert.equal(selected.size, 7);
  assert.equal(filterLocationsByCategories(locations, selected).length, locations.length);
});

test("one selected category shows only matching locations, ignoring case and whitespace", () => {
  const selected = new Set([normalizeCategoryKey(" academic ")]);
  const results = filterLocationsByCategories(locations, selected);

  assert.deepEqual(results.map((location) => location.id), [1, 2]);
});

test("multiple selected categories show their combined locations", () => {
  const selected = new Set(["academic", "food", "hostel"]);
  const results = filterLocationsByCategories(locations, selected);

  assert.deepEqual(results.map((location) => location.id), [1, 2, 3, 4]);
});

test("toggling an active category removes its locations", () => {
  const allSelected = createAllCategorySet(locations);
  const afterToggle = toggleCategorySelection(allSelected, "Food");

  assert.equal(afterToggle.has("food"), false);
  assert.equal(
    filterLocationsByCategories(locations, afterToggle).some((location) => location.category === "Food"),
    false,
  );
});

test("clear all hides all markers and select all restores them", () => {
  const cleared = new Set();
  assert.deepEqual(filterLocationsByCategories(locations, cleared), []);

  const restored = createAllCategorySet(locations);
  assert.equal(filterLocationsByCategories(locations, restored).length, locations.length);
});

test("category filtering composes with already-searched results", () => {
  const searchResults = locations.filter((location) => location.name.includes("Department"));
  const academicOnly = new Set(["academic"]);

  assert.deepEqual(
    filterLocationsByCategories(searchResults, academicOnly).map((location) => location.id),
    [2],
  );
});

test("unknown categories remain visible when selected and use the MapPin fallback", () => {
  const unknownSelection = new Set([normalizeCategoryKey(" visitor services ")]);

  assert.deepEqual(
    filterLocationsByCategories(locations, unknownSelection).map((location) => location.id),
    [8],
  );
  assert.equal(getCategoryStyle("visitor services"), DEFAULT_CATEGORY_STYLE);
  assert.equal(normalizeCategoryKey("   "), "__other__");
});
