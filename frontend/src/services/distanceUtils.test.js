import test from "node:test";
import assert from "node:assert/strict";

import {
  createCampusOrigin,
  createGpsOrigin,
  formatDistance,
  haversineDistanceMeters,
  isValidCoordinates,
  requestGpsOrigin,
  resolveGpsFailureOrigin,
  sortLocationsByDistance,
} from "./distanceUtils.js";

test("Haversine distance uses valid coordinates and returns meters", () => {
  const distance = haversineDistanceMeters(
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
  );
  assert.ok(Math.abs(distance - 111_195) < 10);
});

test("missing and invalid coordinates are handled without a fabricated distance", () => {
  assert.equal(isValidCoordinates(null, 74.6), false);
  assert.equal(isValidCoordinates(91, 74.6), false);
  assert.equal(haversineDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: null, longitude: 1 }), null);
});

test("distance labels use meters for short distances and kilometers for longer distances", () => {
  assert.equal(formatDistance(250), "250 m");
  assert.equal(formatDistance(1_200), "1.2 km");
  assert.equal(formatDistance(999.7), "1.0 km");
  assert.equal(formatDistance(15_200), "15 km");
  assert.equal(formatDistance(Number.NaN), "");
});

test("sorting puts nearest locations first and leaves missing coordinates last", () => {
  const origin = { latitude: 0, longitude: 0 };
  const locations = [
    { id: "far", latitude: 0, longitude: 0.02 },
    { id: "missing", latitude: null, longitude: 0.01 },
    { id: "near", latitude: 0, longitude: 0.001 },
  ];
  assert.deepEqual(sortLocationsByDistance(locations, origin).map((item) => item.id), ["near", "far", "missing"]);
});

test("GPS and selected campus origins are validated and clearly typed", () => {
  assert.equal(createGpsOrigin({ latitude: 91, longitude: 0 }), null);
  assert.equal(createGpsOrigin({ latitude: 0, longitude: 1 }).type, "gps");
  assert.equal(createCampusOrigin({ id: 7, name: "Library", latitude: 0, longitude: 1 }).type, "campus");
  assert.equal(createCampusOrigin({ name: "Unknown", latitude: null, longitude: 1 }), null);
});

test("an explicitly requested GPS location resolves when permission is granted", async () => {
  let requested = false;
  const origin = await requestGpsOrigin({
    getCurrentPosition(onSuccess) {
      requested = true;
      onSuccess({ coords: { latitude: 16.8, longitude: 74.6 } });
    },
  });
  assert.equal(requested, true);
  assert.equal(origin.type, "gps");
});

test("denied GPS uses only a clearly typed campus reference fallback", async () => {
  const reference = { id: 1, name: "Main Gate", latitude: 16.8, longitude: 74.6, type: "reference" };
  await assert.rejects(requestGpsOrigin({ getCurrentPosition(_success, onError) { onError({ code: 1 }); } }));
  assert.equal(resolveGpsFailureOrigin(reference).type, "reference");
  assert.equal(resolveGpsFailureOrigin(null), null);
});
