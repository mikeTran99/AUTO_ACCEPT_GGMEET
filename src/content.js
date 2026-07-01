(() => {
  "use strict";

  if (window.__mikeAutoMeetLoaded) {
    return;
  }

  window.__mikeAutoMeetLoaded = true;

  const RUNTIME_VERSION = "1.5.1";
  const STATS_MODE = "disabled";

  const DEFAULT_SETTINGS = {
    enabled: true,
    actionMode: "allow",
    matchLanguage: "auto",
    requireRequestContext: true,
    fastResponse: true,
    allowBatchAction: false,
    admitAll: false,
    clickDelayMs: 20,
    scanIntervalMs: 220,
    debug: false
  };

  const matcher = window.MikeAutoMeetMatcher;
  if (!matcher) {
    console.error("[Mike-AutoMeet] matcher module is not loaded.");
    return;
  }

  const ACTION_SELECTOR = "button,[role='button'],[jsaction*='click']";
  const MAX_LABEL_LENGTH = 160;
  const SIGNATURE_TTL_MS = 4500;
  const FAILURE_TTL_MS = 1200;
  const GLOBAL_CLICK_GAP_MS = 260;
  const PENDING_RETRY_MS = 420;
  const POST_CLICK_OBSERVE_MS = 180;
  const MAX_PENDING_MS = 2200;
  const UI_NOISE_FRAGMENTS = [
    "moi nguoi",
    "people",
    "them nguoi",
    "add people",
    "tim nguoi",
    "search people",
    "trong cuoc hop",
    "in meeting",
    "cong tac vien",
    "collaborators",
    "dang cho duoc cho phep",
    "dang cho tham gia",
    "people waiting"
  ];
  const CHAT_MESSAGING_FRAGMENTS = [
    "gui tin nhan",
    "send message",
    "send a message",
    "tin nhan",
    "messages",
    "chat",
    "gui thu",
    "cho phep nguoi tham gia gui",
    "let participants send",
    "allow participants to send",
    "cho phep moi nguoi gui",
    "allow everyone to send",
    "tin nhan trong cuoc",
    "messages in call",
    "in call message",
    "messaging"
  ];
  const REQUEST_CONTEXT_HINTS = [
    "dang cho duoc cho phep",
    "dang cho tham gia",
    "nguoi dung chua duoc xac nhan",
    "waiting to join",
    "people waiting",
    "participants waiting",
    "join request",
    "request to join"
  ];

  let settings = { ...DEFAULT_SETTINGS };
  let observer;
  let intervalId;
  let scanTimer;
  let scanRunning = false;
  let pendingAction = null;

  let lastClickAt = 0;
  let lastActionAt = null;
  let lastCandidateLabel = "";
  let lastActionMode = "";
  let lastError = "";

  const handledSignatures = new Map();

  loadSettings(() => {
    start();
    sendStatus();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    let shouldRestart = false;
    let actionModeChanged = false;

    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (!changes[key]) {
        return;
      }

      if (key === "actionMode" && changes[key].oldValue !== changes[key].newValue) {
        actionModeChanged = true;
      }

      settings[key] = changes[key].newValue;
      if (key === "scanIntervalMs" || key === "fastResponse") {
        shouldRestart = true;
      }
    });

    settings = sanitizeSettings(settings);
    resetAutomationState({ clearRecentAction: actionModeChanged });

    if (shouldRestart) {
      restartInterval();
    }

    sendStatus();
    scheduleImmediateScan();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return false;
    }

    if (message.type === "GET_MEET_AUTO_ADMIT_STATUS") {
      sendResponse({
        ok: true,
        payload: getStatusPayload()
      });
      return false;
    }

    return false;
  });

  function loadSettings(done) {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...items });
      done();
    });
  }

  function sanitizeSettings(value) {
    const migratedBatch = value.allowBatchAction || value.admitAll;
    const requireRequestContext = Boolean(value.requireRequestContext ?? DEFAULT_SETTINGS.requireRequestContext);
    const allowBatchAction = Boolean(migratedBatch) && !requireRequestContext;

    return {
      ...DEFAULT_SETTINGS,
      ...value,
      actionMode: ["allow", "deny"].includes(value.actionMode)
        ? value.actionMode
        : DEFAULT_SETTINGS.actionMode,
      matchLanguage: ["auto", "en", "vi"].includes(value.matchLanguage)
        ? value.matchLanguage
        : DEFAULT_SETTINGS.matchLanguage,
      requireRequestContext,
      fastResponse: Boolean(value.fastResponse ?? DEFAULT_SETTINGS.fastResponse),
      allowBatchAction,
      clickDelayMs: clampNumber(value.clickDelayMs, 0, 800, DEFAULT_SETTINGS.clickDelayMs),
      scanIntervalMs: clampNumber(value.scanIntervalMs, 120, 2000, DEFAULT_SETTINGS.scanIntervalMs)
    };
  }

  function start() {
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        "aria-label",
        "title",
        "data-tooltip",
        "disabled",
        "aria-disabled",
        "style",
        "class"
      ]
    });

    restartInterval();
    scheduleScan();
  }

  function restartInterval() {
    if (intervalId) {
      window.clearInterval(intervalId);
    }

    intervalId = window.setInterval(scheduleScan, getEffectiveScanIntervalMs());
  }

  function scheduleScan() {
    if (!settings.enabled || scanTimer || scanRunning) {
      return;
    }

    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      scanOnce();
    }, getEffectiveDebounceMs());
  }

  function scheduleImmediateScan() {
    if (!settings.enabled || scanRunning) {
      return;
    }

    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }

    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      scanOnce();
    }, 0);
  }

  function scanOnce() {
    if (!settings.enabled || scanRunning) {
      return;
    }

    scanRunning = true;

    try {
      pruneHandledSignatures();

      if (pendingAction) {
        verifyPendingAction();
        return;
      }

      if (isPreJoinScreen()) {
        debug("In pre-join screen, skipping auto-admit scan");
        return;
      }

      const candidates = findCandidates({ skipHandled: true });
      const candidate = chooseCandidate(candidates);

      if (!candidate) {
        lastError = "";
        return;
      }

      beginPendingAction(candidate);
      lastError = "";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      debug("scan error", error);
      pendingAction = null;
    } finally {
      scanRunning = false;
    }
  }

  function beginPendingAction(candidate) {
    pendingAction = {
      ...candidate,
      startedAt: Date.now(),
      lastAttemptAt: 0,
      attempts: 0,
      confirmAttempted: false
    };

    clickPendingAction(false);
  }

  function clickPendingAction(useFallback) {
    if (!pendingAction) {
      return;
    }

    if (Date.now() - lastClickAt < GLOBAL_CLICK_GAP_MS) {
      return;
    }

    const clicked = clickElement(pendingAction.clickTarget, useFallback);
    if (!clicked) {
      markPendingFailed("Action target is not clickable.");
      return;
    }

    pendingAction.attempts += 1;
    pendingAction.lastAttemptAt = Date.now();
    lastClickAt = Date.now();
    lastActionAt = new Date().toISOString();
    lastCandidateLabel = pendingAction.label;
    lastActionMode = pendingAction.actionMode;

    sendStatus();
    debug("clicked", pendingAction.signature, pendingAction.label, { useFallback });
  }

  function verifyPendingAction() {
    if (!pendingAction) {
      return;
    }

    const now = Date.now();
    if (now - pendingAction.startedAt > MAX_PENDING_MS) {
      markPendingFailed("Action timeout.");
      return;
    }

    if (
      pendingAction.isBatch &&
      settings.allowBatchAction &&
      !pendingAction.confirmAttempted &&
      now - pendingAction.lastAttemptAt >= POST_CLICK_OBSERVE_MS
    ) {
      const confirmCandidate = findBatchConfirmationCandidate(pendingAction);
      if (confirmCandidate) {
        pendingAction.confirmAttempted = true;
        pendingAction.signature = confirmCandidate.signature;
        pendingAction.label = confirmCandidate.label;
        pendingAction.clickTarget = confirmCandidate.clickTarget;
        clickPendingAction(false);
        return;
      }
    }

    const liveCandidate = findCandidateBySignature(pendingAction.signature);
    if (!liveCandidate) {
      markSignatureHandled(pendingAction.signature, SIGNATURE_TTL_MS);
      pendingAction = null;
      sendStatus();
      return;
    }

    pendingAction.clickTarget = liveCandidate.clickTarget;
    pendingAction.label = liveCandidate.label;

    if (
      now - pendingAction.lastAttemptAt >= PENDING_RETRY_MS &&
      pendingAction.attempts < 2
    ) {
      clickPendingAction(pendingAction.attempts > 0);
      return;
    }

    if (
      now - pendingAction.lastAttemptAt >= PENDING_RETRY_MS &&
      pendingAction.attempts >= 2
    ) {
      markPendingFailed("Action still visible after retries.");
    }
  }

  function markPendingFailed(message) {
    if (pendingAction) {
      markSignatureHandled(pendingAction.signature, FAILURE_TTL_MS);
    }

    lastError = message;
    pendingAction = null;
    sendStatus();
  }

  function resetAutomationState({ clearRecentAction = false } = {}) {
    pendingAction = null;
    handledSignatures.clear();
    lastError = "";

    if (clearRecentAction) {
      lastCandidateLabel = "";
      lastActionMode = "";
    }
  }

  function isChatMessagingElement(element) {
    const allLabels = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.getAttribute("data-tooltip"),
      element.innerText,
      element.textContent
    ]
      .filter(Boolean)
      .map((value) => normalizeText(value))
      .join(" ");

    if (CHAT_MESSAGING_FRAGMENTS.some((fragment) => allLabels.includes(fragment))) {
      return true;
    }

    let parent = element.parentElement;
    let depth = 0;
    while (parent && parent !== document.body && depth < 4) {
      const parentText = normalizeText(
        parent.getAttribute("aria-label") ||
        parent.getAttribute("title") ||
        ""
      );
      if (CHAT_MESSAGING_FRAGMENTS.some((fragment) => parentText.includes(fragment))) {
        return true;
      }
      parent = parent.parentElement;
      depth += 1;
    }

    return false;
  }

  function isSettingsToggle(element) {
    const role = element.getAttribute("role");
    if (
      role === "switch" ||
      role === "checkbox" ||
      role === "radio" ||
      role === "menuitemcheckbox" ||
      role === "menuitemradio"
    ) {
      return true;
    }
    
    if (element.hasAttribute("aria-checked") || element.hasAttribute("aria-pressed")) {
      return true;
    }
    
    return false;
  }

  function findCandidates({ skipHandled }) {
    const bySignature = new Map();

    document.querySelectorAll(ACTION_SELECTOR).forEach((rawElement) => {
      if (!(rawElement instanceof HTMLElement)) {
        return;
      }

      const clickTarget = resolveClickTarget(rawElement);
      if (!clickTarget || !isVisible(clickTarget)) {
        return;
      }

      // CRITICAL FIX: skip chat/messaging UI elements early
      if (isChatMessagingElement(clickTarget)) {
        return;
      }

      // CRITICAL FIX: skip settings toggles (e.g., Host Controls, switches)
      if (isSettingsToggle(clickTarget)) {
        return;
      }

      const label = getBestActionLabel(clickTarget);
      if (!isUsableLabel(label) || !isActionLabel(label, settings.actionMode)) {
        return;
      }

      const isBatch = matcher.isBatchLabel(label, settings.actionMode, settings.matchLanguage);
      if (isBatch && !isBatchActionEnabled()) {
        return;
      }

      const nearbyText = getNearbyText(clickTarget);
      if (settings.requireRequestContext && !isJoinRequestContext(nearbyText, label)) {
        return;
      }

      const signature = buildSignature({
        actionMode: settings.actionMode,
        label,
        nearbyText,
        isBatch
      });

      if (skipHandled && handledSignatures.has(signature)) {
        return;
      }

      const candidate = {
        clickTarget,
        label,
        nearbyText,
        isBatch,
        actionMode: settings.actionMode,
        signature,
        score: getCandidateScore({ clickTarget, label, nearbyText, isBatch })
      };

      const current = bySignature.get(signature);
      if (!current || candidate.score > current.score) {
        bySignature.set(signature, candidate);
      }
    });

    return Array.from(bySignature.values()).sort((left, right) => right.score - left.score);
  }

  function chooseCandidate(candidates) {
    if (!candidates.length) {
      return null;
    }

    if (isBatchActionEnabled()) {
      const batch = candidates.find((candidate) => candidate.isBatch);
      if (batch) {
        return batch;
      }
    }

    return candidates.find((candidate) => !candidate.isBatch) || candidates[0];
  }

  function findCandidateBySignature(signature) {
    return findCandidates({ skipHandled: false }).find((candidate) => (
      candidate.signature === signature
    )) || null;
  }

  function findBatchConfirmationCandidate(originalBatchAction) {
    if (!isBatchActionEnabled()) {
      return null;
    }

    return findCandidates({ skipHandled: false }).find((candidate) => {
      if (!candidate.isBatch || candidate.actionMode !== originalBatchAction.actionMode) {
        return false;
      }

      const context = normalizeText(candidate.nearbyText);
      return context.includes("?") || context.includes("tat ca") || context.includes("all");
    }) || null;
  }

  function resolveClickTarget(element) {
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    if (element.matches("button,[role='button']")) {
      return element;
    }

    const control = element.closest("button,[role='button']");
    if (control instanceof HTMLElement) {
      return control;
    }

    return null;
  }

  function getCandidateScore({ clickTarget, label, nearbyText, isBatch }) {
    let score = 120;
    const normalizedLabel = normalizeText(label);
    const normalizedContext = normalizeText(nearbyText);
    const rect = clickTarget.getBoundingClientRect();

    if (isBatch) {
      score += settings.allowBatchAction ? 260 : -120;
    } else {
      score += 140;
    }

    if (
      normalizedLabel.includes("chap nhan") ||
      normalizedLabel.includes("admit") ||
      normalizedLabel.includes("accept") ||
      normalizedLabel.includes("approve")
    ) {
      score += 90;
    }

    if (
      normalizedContext.includes("dang cho duoc cho phep") ||
      normalizedContext.includes("dang cho tham gia") ||
      normalizedContext.includes("waiting to join") ||
      normalizedContext.includes("people waiting")
    ) {
      score += 80;
    }

    if (rect.top <= 260 && rect.left >= window.innerWidth * 0.45) {
      score += 60;
    }

    if (clickTarget.tagName === "BUTTON") {
      score += 30;
    }

    if (normalizedLabel.length > 90) {
      score -= 40;
    }

    return score;
  }

  function clickElement(element, useFallback) {
    if (!(element instanceof HTMLElement) || !isVisible(element)) {
      return false;
    }

    try {
      element.focus({ preventScroll: true });
    } catch (_error) {
      // ignore
    }

    try {
      element.click();
      if (!useFallback) {
        return true;
      }
    } catch (_error) {
      // fallback below
    }

    dispatchPointerEvent(element, "pointerdown");
    element.dispatchEvent(new MouseEvent("mousedown", eventOptions()));
    dispatchPointerEvent(element, "pointerup");
    element.dispatchEvent(new MouseEvent("mouseup", eventOptions()));
    element.dispatchEvent(new MouseEvent("click", eventOptions()));
    return true;
  }

  function dispatchPointerEvent(element, type) {
    if (typeof PointerEvent !== "function") {
      return;
    }

    element.dispatchEvent(new PointerEvent(type, {
      ...eventOptions(),
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      buttons: type === "pointerdown" ? 1 : 0
    }));
  }

  function eventOptions() {
    return {
      bubbles: true,
      cancelable: true,
      view: window
    };
  }

  function getBestActionLabel(element) {
    const labels = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.getAttribute("data-tooltip"),
      element.innerText,
      element.textContent
    ]
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean)
      .map((value) => value.replace(/\s+/g, " "));

    return labels.find((label) => isActionLabel(label, settings.actionMode)) || "";
  }

  function isActionLabel(label, actionMode) {
    const normalized = normalizeText(label);
    if (!normalized || matcher.isBlockedActionLabel(normalized)) {
      return false;
    }

    if (!matcher.isActionLabel(normalized, actionMode, settings.matchLanguage)) {
      return false;
    }

    if (actionMode === "deny") {
      return !matcher.isActionLabel(normalized, "allow", settings.matchLanguage);
    }

    return !matcher.isActionLabel(normalized, "deny", settings.matchLanguage);
  }

  function isJoinRequestContext(nearbyText, label) {
    const normalizedContext = normalizeText(nearbyText);

    // CRITICAL FIX: Do NOT bypass context check based on the button's own label.
    // Previously, matcher.isActionLabel(label, ...) was here, which caused any
    // button whose label contained "cho phep" (e.g. the chat toggle "Cho phep
    // nguoi tham gia gui tin nhan") to pass the context check regardless of
    // surrounding text. Now we ONLY check the surrounding context text.
    if (CHAT_MESSAGING_FRAGMENTS.some((fragment) => normalizedContext.includes(fragment))) {
      return false;
    }

    if (matcher.isContextLabel(normalizedContext, settings.matchLanguage)) {
      return true;
    }

    return REQUEST_CONTEXT_HINTS.some((fragment) => normalizedContext.includes(fragment));
  }

  function getNearbyText(element) {
    const parts = [];
    let current = element;
    let depth = 0;

    while (current && current !== document.body && depth < 6) {
      if (current instanceof HTMLElement) {
        const text = String(current.innerText || current.textContent || "").trim();
        if (text && text.length < 2600) {
          parts.push(text);
        }
      }

      current = current.parentElement;
      depth += 1;
    }

    return parts.join("\n");
  }

  function buildSignature({ actionMode, label, nearbyText, isBatch }) {
    const requester = extractRequesterKey(nearbyText);
    const normalizedLabel = normalizeText(label).replace(/\d+/g, "#");
    const shape = isBatch ? "batch" : "single";
    return `${actionMode}|${shape}|${requester || normalizedLabel}`;
  }

  function extractRequesterKey(text) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((line) => normalizeText(line))
      .filter(Boolean)
      .filter((line) => line.length >= 2 && line.length <= 120)
      .filter((line) => /[\p{L}\p{N}]/u.test(line))
      .filter((line) => !matcher.isActionLabel(line, "allow", settings.matchLanguage))
      .filter((line) => !matcher.isActionLabel(line, "deny", settings.matchLanguage))
      .filter((line) => !matcher.isContextLabel(line, settings.matchLanguage))
      .filter((line) => !matcher.isBlockedActionLabel(line))
      .filter((line) => !UI_NOISE_FRAGMENTS.some((fragment) => line === fragment || line.includes(fragment)));

    return lines[0] || "";
  }

  function isUsableLabel(label) {
    return Boolean(label && label.length <= MAX_LABEL_LENGTH);
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (element.closest("[aria-hidden='true']")) {
      return false;
    }

    if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) !== 0;
  }

  function markSignatureHandled(signature, ttlMs) {
    handledSignatures.set(signature, Date.now() + ttlMs);
  }

  function pruneHandledSignatures() {
    const now = Date.now();
    handledSignatures.forEach((expiresAt, signature) => {
      if (expiresAt <= now) {
        handledSignatures.delete(signature);
      }
    });
  }

  function getStatusPayload() {
    return {
      runtimeVersion: RUNTIME_VERSION,
      statsMode: STATS_MODE,
      enabled: settings.enabled,
      actionMode: settings.actionMode,
      matchLanguage: settings.matchLanguage,
      requireRequestContext: settings.requireRequestContext,
      fastResponse: settings.fastResponse,
      allowBatchAction: settings.allowBatchAction,
      lastActionAt,
      lastCandidateLabel,
      lastActionMode,
      lastError,
      pending: Boolean(pendingAction),
      processingStrategy: isBatchActionEnabled() ? "batch-all" : "single-by-single",
      href: window.location.href
    };
  }

  function isBatchActionEnabled() {
    return settings.allowBatchAction && !settings.requireRequestContext;
  }

  function sendStatus() {
    try {
      const maybePromise = chrome.runtime.sendMessage({
        type: "MEET_AUTO_ADMIT_STATS",
        payload: getStatusPayload()
      });

      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch(() => {});
      }
    } catch (_error) {
      // Popup can still request status.
    }
  }

  function isPreJoinScreen() {
    const buttons = document.querySelectorAll("button, [role='button']");
    for (const btn of buttons) {
      if (!(btn instanceof HTMLElement) || !isVisible(btn)) {
        continue;
      }

      const text = normalizeText(btn.innerText || btn.textContent || "");
      if (!text) {
        continue;
      }

      if (
        text.includes("tham gia ngay") ||
        text.includes("join now") ||
        text.includes("yeu cau tham gia") ||
        text.includes("ask to join") ||
        text.includes("che do dong hanh") ||
        text.includes("companion mode") ||
        text.includes("kiem tra am thanh va video") ||
        text.includes("check your audio and video")
      ) {
        return true;
      }
    }
    return false;
  }

  function getEffectiveScanIntervalMs() {
    return settings.fastResponse ? Math.min(settings.scanIntervalMs, 140) : settings.scanIntervalMs;
  }

  function getEffectiveDebounceMs() {
    return settings.fastResponse ? 18 : 120;
  }

  function clampNumber(value, min, max, fallback) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.round(numberValue)));
  }

  function normalizeText(value) {
    return matcher.normalizeText(value);
  }

  function debug(...args) {
    if (settings.debug) {
      console.debug("[Mike-AutoMeet]", ...args);
    }
  }
})();
