import test from "node:test";
import assert from "node:assert/strict";

import { getApiErrorMessage, isRequestCanceled } from "./apiErrors.js";
import { API_TIMEOUT_MS } from "./apiConfig.js";

test("Axios requests have a bounded timeout", () => {
  assert.equal(API_TIMEOUT_MS, 15_000);
});

test("network and timeout failures receive friendly messages", () => {
  assert.match(getApiErrorMessage({ request: {} }), /internet connection/i);
  assert.match(getApiErrorMessage({ code: "ECONNABORTED" }), /too long/i);
});

test("common HTTP failures map to safe, useful messages", () => {
  assert.match(getApiErrorMessage({ response: { status: 401 } }), /sign in/i);
  assert.match(getApiErrorMessage({ response: { status: 403 } }), /permission/i);
  assert.match(getApiErrorMessage({ response: { status: 404 } }), /could not be found/i);
  assert.equal(getApiErrorMessage({ response: { status: 422, data: { detail: "Choose two different locations." } } }), "Choose two different locations.");
  assert.match(getApiErrorMessage({ response: { status: 422, data: { detail: [{ msg: "bad input" }] } } }), /check the information/i);
  assert.match(getApiErrorMessage({ response: { status: 500, data: { detail: "sqlite:///private/path" } } }), /server problem/i);
});

test("technical response details are never shown and cancellations are silent", () => {
  assert.match(getApiErrorMessage({ response: { status: 400, data: { detail: "Traceback at C:\\private\\main.py" } } }), /something went wrong/i);
  assert.equal(isRequestCanceled({ code: "ERR_CANCELED" }), true);
  assert.equal(getApiErrorMessage({ code: "ERR_CANCELED" }), "");
});
