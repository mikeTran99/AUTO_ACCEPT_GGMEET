"use strict";

const DEFAULT_SETTINGS = {
  enabled: true,
  uiLanguage: detectDefaultUiLanguage(),
  actionMode: "allow",
  matchLanguage: "auto",
  requireRequestContext: true,
  fastResponse: true,
  allowBatchAction: false,
  admitAll: false,
  themeColor: "sapphire",
  clickDelayMs: 20,
  scanIntervalMs: 220,
  debug: false
};

const EXPECTED_RUNTIME_VERSION = "1.5.2";
const EXPECTED_STATS_MODE = "disabled";

const I18N = {
  vi: {
    eyebrow: "GOOGLE MEET CONTROL",
    title: "Mike-AutoMeet",
    enableTitle: "Tự động xử lý",
    enableHint: "Chạy khi bạn là giảng viên, host hoặc co-host.",
    actionMode: "Chế độ tự động",
    allowMode: "Cho phép",
    denyMode: "Từ chối",
    uiLanguage: "Ngôn ngữ giao diện",
    languageVi: "Tiếng Việt",
    languageEn: "English",
    matchLanguage: "Ngôn ngữ nút Meet",
    autoLanguage: "Tự động",
    themeColor: "Màu giao diện",
    strictTitle: "Chế độ an toàn",
    strictHint: "Chỉ bấm khi phát hiện yêu cầu vào phòng Meet.",
    fastTitle: "Phản hồi nhanh",
    fastHint: "Giảm độ trễ quét và click để cho phép nhanh hơn.",
    batchTitle: "Cho phép xử lý hàng loạt",
    batchHint: "Áp dụng cho Chấp nhận tất cả hoặc Từ chối tất cả nếu Meet hiển thị.",
    openMeet: "Mở Meet",
    allowOn: "CHO PHÉP",
    denyOn: "TỪ CHỐI",
    off: "ĐANG TẮT",
    noMeet: "Mở hoặc tải lại một phòng Google Meet để extension bắt đầu hoạt động.",
    readyAllow: "Đang tự động cho phép người xin vào Google Meet.",
    readyDeny: "Đang tự động từ chối người xin vào Google Meet.",
    safeSingleActive: "Chế độ an toàn đang bật: xử lý lần lượt từng người.",
    batchAllActive: "Xử lý hàng loạt đang bật: ưu tiên nút Chấp nhận tất cả/Từ chối tất cả.",
    readyFast: "Phản hồi nhanh đang bật.",
    disabled: "Extension đang tắt cho tab Meet hiện tại.",
    reloadRequired: "Tab Meet đang chạy phiên bản cũ. Hãy refresh Google Meet để dùng bản tự động mới.",
    runtimeSyncPending: "Tab Meet chưa nhận chế độ mới. Hãy chờ một nhịp hoặc tải lại Google Meet nếu vẫn chưa đổi.",
    saved: "Đã lưu cấu hình."
  },
  en: {
    eyebrow: "GOOGLE MEET CONTROL",
    title: "Mike-AutoMeet",
    enableTitle: "Auto handling",
    enableHint: "Run only when you are the lecturer, host, or co-host.",
    actionMode: "Automation mode",
    allowMode: "Allow",
    denyMode: "Deny",
    uiLanguage: "Popup language",
    languageVi: "Vietnamese",
    languageEn: "English",
    matchLanguage: "Meet button language",
    autoLanguage: "Auto",
    themeColor: "Interface color",
    strictTitle: "Safety mode",
    strictHint: "Click only when a Meet join request is detected.",
    fastTitle: "Fast response",
    fastHint: "Reduces scan and click latency for faster handling.",
    batchTitle: "Allow batch actions",
    batchHint: "Applies to Admit all or Deny all when Meet shows them.",
    openMeet: "Open Meet",
    allowOn: "ALLOW",
    denyOn: "DENY",
    off: "OFF",
    noMeet: "Open or reload a Google Meet room so the extension can start.",
    readyAllow: "Automatically allowing Google Meet join requests.",
    readyDeny: "Automatically denying Google Meet join requests.",
    safeSingleActive: "Safety mode enabled: processing one requester at a time.",
    batchAllActive: "Batch mode enabled: prioritizing Admit all/Deny all.",
    readyFast: "Fast response is enabled.",
    disabled: "The extension is disabled for the current Meet tab.",
    reloadRequired: "This Meet tab is running an old script. Refresh Google Meet to use the new automation.",
    runtimeSyncPending: "The Meet tab has not applied the new mode yet. Wait a moment or refresh Google Meet if it still does not switch.",
    saved: "Settings saved."
  }
};

const elements = {
  enabled: document.querySelector("#enabled"),
  actionMode: Array.from(document.querySelectorAll("input[name='actionMode']")),
  themeColor: Array.from(document.querySelectorAll("input[name='themeColor']")),
  uiLanguage: Array.from(document.querySelectorAll("input[name='uiLanguage']")),
  matchLanguage: document.querySelector("#matchLanguage"),
  requireRequestContext: document.querySelector("#requireRequestContext"),
  fastResponse: document.querySelector("#fastResponse"),
  allowBatchAction: document.querySelector("#allowBatchAction"),
  statusBadge: document.querySelector("#statusBadge"),
  modeLogo: document.querySelector("#modeLogo"),
  pageStatus: document.querySelector("#pageStatus")
};

let settings = { ...DEFAULT_SETTINGS };
let latestSaveToken = 0;

document.addEventListener("DOMContentLoaded", init);

function init() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...items });
    applySettingsToForm();
    applyVisualState();
    translate();
    refreshStatus();
    bindEvents();
  });
}

function bindEvents() {
  [
    elements.enabled,
    elements.matchLanguage,
    elements.requireRequestContext,
    elements.fastResponse,
    elements.allowBatchAction,
    ...elements.uiLanguage,
    ...elements.actionMode,
    ...elements.themeColor
  ].forEach((element) => {
    element.addEventListener("change", handleFormChange);
    element.addEventListener("input", handleFormChange);
  });
}

function handleFormChange(event) {
  settings = readSettingsFromForm();

  // Đồng bộ 2 chế độ có thể xung đột:
  // - Chế độ an toàn: luôn xử lý từng người
  // - Xử lý hàng loạt: ưu tiên "tất cả"
  if (event && event.target === elements.requireRequestContext && settings.requireRequestContext) {
    settings.allowBatchAction = false;
  }
  if (event && event.target === elements.allowBatchAction && settings.allowBatchAction) {
    settings.requireRequestContext = false;
  }
  settings = sanitizeSettings(settings);

  applySettingsToForm();
  applyVisualState();
  translate();
  elements.pageStatus.textContent = t("saved");
  persistSettingsImmediately();
}

function applySettingsToForm() {
  elements.enabled.checked = Boolean(settings.enabled);
  elements.matchLanguage.value = settings.matchLanguage;
  elements.requireRequestContext.checked = Boolean(settings.requireRequestContext);
  elements.fastResponse.checked = Boolean(settings.fastResponse);
  elements.allowBatchAction.checked = Boolean(settings.allowBatchAction);
  setRadioValue(elements.uiLanguage, settings.uiLanguage);
  setRadioValue(elements.actionMode, settings.actionMode);
  setRadioValue(elements.themeColor, settings.themeColor);
}

function readSettingsFromForm() {
  return sanitizeSettings({
    ...settings,
    enabled: elements.enabled.checked,
    actionMode: getRadioValue(elements.actionMode, DEFAULT_SETTINGS.actionMode),
    themeColor: getRadioValue(elements.themeColor, DEFAULT_SETTINGS.themeColor),
    uiLanguage: getRadioValue(elements.uiLanguage, DEFAULT_SETTINGS.uiLanguage),
    matchLanguage: elements.matchLanguage.value,
    requireRequestContext: elements.requireRequestContext.checked,
    fastResponse: elements.fastResponse.checked,
    allowBatchAction: elements.allowBatchAction.checked
  });
}

function toStorageSettings(value) {
  const { admitAll: _admitAll, ...storageSettings } = value;
  return {
    ...storageSettings,
    admitAll: storageSettings.allowBatchAction
  };
}

function persistSettingsImmediately() {
  const saveToken = ++latestSaveToken;
  const expectedEnabled = Boolean(settings.enabled);
  const expectedMode = expectedEnabled ? settings.actionMode : null;

  chrome.storage.sync.set(toStorageSettings(settings), () => {
    if (saveToken !== latestSaveToken) {
      return;
    }

    refreshStatus({
      expectedEnabled,
      expectedMode,
      retriesLeft: 5,
      saveToken
    });
  });
}

function refreshStatus(options = {}) {
  sendMessageToMeetTab({ type: "GET_MEET_AUTO_ADMIT_STATUS" }, (response) => {
    const payload = response && response.payload;

    if (options.saveToken && options.saveToken !== latestSaveToken) {
      return;
    }

    renderStatus(payload, options);

    if (!shouldRetryStatusSync(payload, options)) {
      return;
    }

    window.setTimeout(() => {
      refreshStatus({
        ...options,
        retriesLeft: options.retriesLeft - 1
      });
    }, 120);
  });
}

function renderStatus(payload, options = {}) {
  if (!payload) {
    updateBadge(t("off"), "off");
    elements.pageStatus.textContent = t("noMeet");
    return;
  }

  if (
    payload.runtimeVersion !== EXPECTED_RUNTIME_VERSION ||
    payload.statsMode !== EXPECTED_STATS_MODE
  ) {
    updateBadge(t("off"), "off");
    elements.pageStatus.textContent = t("reloadRequired");
    return;
  }

  const liveMode = payload.actionMode === "deny" ? "deny" : "allow";
  if (!payload.enabled) {
    updateBadge(t("off"), "off");
    elements.pageStatus.textContent = t("disabled");
    return;
  }

  updateBadge(liveMode === "deny" ? t("denyOn") : t("allowOn"), liveMode);
  if (
    typeof options.expectedEnabled === "boolean" &&
    payload.enabled === options.expectedEnabled &&
    options.expectedEnabled &&
    options.expectedMode &&
    liveMode !== options.expectedMode
  ) {
    elements.pageStatus.textContent = t("runtimeSyncPending");
    return;
  }

  const modeMessage = liveMode === "deny" ? t("readyDeny") : t("readyAllow");
  const details = [];
  if (payload.requireRequestContext) {
    details.push(t("safeSingleActive"));
  }
  if (payload.allowBatchAction) {
    details.push(t("batchAllActive"));
  }
  if (payload.fastResponse) {
    details.push(t("readyFast"));
  }
  elements.pageStatus.textContent = [modeMessage, ...details].join(" ");
}

function shouldRetryStatusSync(payload, options = {}) {
  if (!options.expectedMode || !options.expectedEnabled || !options.retriesLeft) {
    return false;
  }

  if (!payload) {
    return false;
  }

  if (
    payload.runtimeVersion !== EXPECTED_RUNTIME_VERSION ||
    payload.statsMode !== EXPECTED_STATS_MODE ||
    !payload.enabled
  ) {
    return false;
  }

  const liveMode = payload.actionMode === "deny" ? "deny" : "allow";
  return liveMode !== options.expectedMode;
}

function sendMessageToMeetTab(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith("https://meet.google.com/")) {
      callback(null);
      return;
    }

    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        callback(null);
        return;
      }

      callback(response);
    });
  });
}

function translate() {
  document.documentElement.lang = settings.uiLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const key = element.getAttribute("data-i18n-title");
    element.title = t(key);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria-label");
    element.setAttribute("aria-label", t(key));
  });
}

function applyVisualState() {
  document.body.dataset.theme = settings.themeColor;
  document.body.dataset.mode = settings.actionMode;
  updateModeLogo();
}

function updateBadge(text, state) {
  elements.statusBadge.textContent = text;
  elements.statusBadge.classList.remove("allow", "deny", "off");
  elements.statusBadge.classList.add(state);
}

function getActiveBadgeText() {
  if (!settings.enabled) {
    return t("off");
  }
  return settings.actionMode === "deny" ? t("denyOn") : t("allowOn");
}

function sanitizeSettings(value) {
  const themeColor = [
    "emerald",
    "sapphire",
    "cobalt",
    "aurora",
    "violet",
    "orchid",
    "gold",
    "coral",
    "rose",
    "graphite"
  ].includes(value.themeColor)
    ? value.themeColor
    : DEFAULT_SETTINGS.themeColor;

  const migratedBatch = value.allowBatchAction || value.admitAll;
  const requireRequestContext = Boolean(value.requireRequestContext ?? DEFAULT_SETTINGS.requireRequestContext);
  const allowBatchAction = Boolean(migratedBatch) && !requireRequestContext;

  return {
    ...DEFAULT_SETTINGS,
    ...value,
    actionMode: ["allow", "deny"].includes(value.actionMode) ? value.actionMode : DEFAULT_SETTINGS.actionMode,
    uiLanguage: ["vi", "en"].includes(value.uiLanguage) ? value.uiLanguage : DEFAULT_SETTINGS.uiLanguage,
    matchLanguage: ["auto", "en", "vi"].includes(value.matchLanguage)
      ? value.matchLanguage
      : DEFAULT_SETTINGS.matchLanguage,
    themeColor,
    requireRequestContext,
    fastResponse: Boolean(value.fastResponse ?? DEFAULT_SETTINGS.fastResponse),
    allowBatchAction
  };
}

function detectDefaultUiLanguage() {
  const locale = (
    typeof chrome !== "undefined" &&
    chrome.i18n &&
    typeof chrome.i18n.getUILanguage === "function"
  )
    ? chrome.i18n.getUILanguage()
    : (typeof navigator !== "undefined" ? navigator.language : "");

  return String(locale || "").toLowerCase().startsWith("vi") ? "vi" : "en";
}

function updateModeLogo() {
  if (!elements.modeLogo) {
    return;
  }

  const isDenyMode = settings.actionMode === "deny";
  const nextSrc = isDenyMode ? "../assets/deny.jpg" : "../assets/allow.jpg";
  const nextAlt = isDenyMode ? "Mike-AutoMeet deny mode" : "Mike-AutoMeet allow mode";

  const currentSrc = elements.modeLogo.getAttribute("src") || "";
  if (!currentSrc.endsWith(nextSrc.replace("../", "")) && currentSrc !== nextSrc) {
    elements.modeLogo.classList.remove("logo-ready");
    elements.modeLogo.classList.add("logo-swapping");
    window.setTimeout(() => {
      elements.modeLogo.src = nextSrc;
      elements.modeLogo.alt = nextAlt;
    }, 90);
    return;
  }

  elements.modeLogo.alt = nextAlt;
}

if (elements.modeLogo) {
  elements.modeLogo.addEventListener("load", () => {
    elements.modeLogo.classList.remove("logo-swapping");
    elements.modeLogo.classList.add("logo-ready");
  });

  if (elements.modeLogo.complete) {
    elements.modeLogo.classList.add("logo-ready");
  }
}

function setRadioValue(radios, value) {
  radios.forEach((radio) => {
    radio.checked = radio.value === value;
  });
}

function getRadioValue(radios, fallback) {
  const selected = radios.find((radio) => radio.checked);
  return selected ? selected.value : fallback;
}

function t(key) {
  const dictionary = I18N[settings.uiLanguage] || I18N.vi;
  return dictionary[key] || I18N.vi[key] || key;
}
