"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const popupSource = fs.readFileSync(path.join(__dirname, "..", "src", "popup.js"), "utf8");
const contentSource = fs.readFileSync(path.join(__dirname, "..", "src", "content.js"), "utf8");

test("popup persists settings immediately instead of delaying chrome.storage.sync.set", () => {
  assert.match(popupSource, /function persistSettingsImmediately\(\)/);
  assert.match(popupSource, /chrome\.storage\.sync\.set\(toStorageSettings\(settings\)/);
  assert.doesNotMatch(
    popupSource,
    /setTimeout\(\(\)\s*=>\s*\{\s*chrome\.storage\.sync\.set\(toStorageSettings\(settings\)/s
  );
});

test("popup includes runtime mode sync warning and follow-up refresh retries", () => {
  assert.match(popupSource, /runtimeSyncPending/);
  assert.match(popupSource, /function shouldRetryStatusSync\(payload, options = \{\}\)/);
  assert.match(popupSource, /retriesLeft:\s*5/);
});

test("content script resets pending automation state when action mode changes", () => {
  assert.match(contentSource, /let actionModeChanged = false;/);
  assert.match(contentSource, /resetAutomationState\(\{ clearRecentAction: actionModeChanged \}\);/);
  assert.match(contentSource, /function resetAutomationState\(\{ clearRecentAction = false \} = \{\}\)/);
  assert.match(contentSource, /scheduleImmediateScan\(\);/);
});
