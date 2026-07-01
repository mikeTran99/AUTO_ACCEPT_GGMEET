"use strict";

const BADGE_COLORS = {
  allow: "#10b981",
  deny: "#ef4444",
  idle: "#64748b"
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.allow });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== "MEET_AUTO_ADMIT_STATS" || !sender.tab) {
    return;
  }

  const payload = message.payload || {};
  const actionMode = payload.actionMode === "deny" ? "deny" : "allow";
  const text = payload.enabled ? (actionMode === "deny" ? "D" : "A") : "";

  chrome.action.setBadgeBackgroundColor({
    tabId: sender.tab.id,
    color: payload.enabled ? BADGE_COLORS[actionMode] : BADGE_COLORS.idle
  });
  chrome.action.setBadgeText({
    tabId: sender.tab.id,
    text
  });
});
