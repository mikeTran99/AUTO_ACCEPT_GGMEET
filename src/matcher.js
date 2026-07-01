(function initMikeAutoMeetMatcher(root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.MikeAutoMeetMatcher = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildMatcher() {
  "use strict";

  const LABELS = {
    en: {
      allow: [
        "admit",
        "let in",
        "allow",
        "allow entry",
        "accept",
        "approve",
        "admit guest",
        "admit 1 guest",
        "let guest in",
        "let 1 guest in",
        "let participant in"
      ],
      allowBatch: [
        "admit all",
        "let all in",
        "accept all",
        "allow all",
        "approve all"
      ],
      deny: [
        "deny",
        "deny entry",
        "decline",
        "reject",
        "block",
        "dismiss",
        "deny guest",
        "deny 1 guest",
        "decline guest",
        "reject guest"
      ],
      denyBatch: [
        "deny all",
        "decline all",
        "reject all",
        "block all",
        "dismiss all"
      ],
      context: [
        "wants to join",
        "want to join",
        "is asking to join",
        "asking to join",
        "requests to join",
        "request to join",
        "join request",
        "waiting to join",
        "people waiting",
        "participants waiting",
        "participant waiting",
        "guest waiting",
        "waiting room"
      ]
    },
    vi: {
      allow: [
        "cho phep",
        "chap nhan",
        "cho vao",
        "nhan vao",
        "dong y",
        "cho phep khach vao",
        "cho phep 1 khach vao",
        "cho hoc vien vao",
        "cho thanh vien vao"
      ],
      allowBatch: [
        "chap nhan tat ca",
        "cho phep tat ca",
        "cho tat ca vao",
        "nhan tat ca vao",
        "dong y tat ca"
      ],
      deny: [
        "tu choi",
        "khong cho phep",
        "khong cho vao",
        "chan",
        "huy",
        "bo qua",
        "tu choi khach",
        "tu choi 1 khach",
        "khong cho khach vao"
      ],
      denyBatch: [
        "tu choi tat ca",
        "khong cho tat ca vao",
        "khong cho phep tat ca",
        "chan tat ca",
        "huy tat ca",
        "bo qua tat ca"
      ],
      context: [
        "muon tham gia",
        "xin vao",
        "dang yeu cau tham gia",
        "yeu cau tham gia",
        "dang cho",
        "nguoi dang cho",
        "khach dang cho",
        "phong cho",
        "tham gia cuoc hop",
        "tham gia cuoc goi"
      ]
    }
  };

  const ENTITY_VI = "(?:khach|nguoi|hoc vien|thanh vien)";
  const ENTITY_EN = "(?:guest|guests|participant|participants|person|people)";
  const EDGE = "(?:^|\\s|[.!?:,;])";
  const END = "(?=$|\\s|[.!?:,;])";

  const PATTERNS = {
    vi: {
      allow: [
        new RegExp(`${EDGE}cho phep(?: \\d+)? ${ENTITY_VI} (?:vao|tham gia)${END}`),
        new RegExp(`${EDGE}cho(?: \\d+)? ${ENTITY_VI} (?:vao|tham gia)${END}`),
        new RegExp(`${EDGE}chap nhan(?: \\d+)? ${ENTITY_VI}(?: vao| tham gia)?${END}`),
        new RegExp(`${EDGE}nhan(?: \\d+)? ${ENTITY_VI} (?:vao|tham gia)${END}`),
        new RegExp(`${EDGE}dong y(?: \\d+)? ${ENTITY_VI}(?: vao| tham gia)?${END}`)
      ],
      allowBatch: [
        new RegExp(`${EDGE}(?:chap nhan|cho phep|cho|nhan|dong y) tat ca(?: ${ENTITY_VI})?(?: vao| tham gia)?${END}`)
      ],
      deny: [
        new RegExp(`${EDGE}tu choi(?: \\d+)? ${ENTITY_VI}${END}`),
        new RegExp(`${EDGE}tu choi(?: \\d+)? ${ENTITY_VI} (?:vao|tham gia)${END}`),
        new RegExp(`${EDGE}khong cho(?: phep)?(?: \\d+)? ${ENTITY_VI} (?:vao|tham gia)${END}`),
        new RegExp(`${EDGE}(?:chan|huy|bo qua)(?: \\d+)? ${ENTITY_VI}${END}`)
      ],
      denyBatch: [
        new RegExp(`${EDGE}(?:tu choi|khong cho|khong cho phep|chan|huy|bo qua) tat ca(?: ${ENTITY_VI})?(?: vao| tham gia)?${END}`)
      ]
    },
    en: {
      allow: [
        new RegExp(`${EDGE}admit(?: \\d+)? ${ENTITY_EN}${END}`),
        new RegExp(`${EDGE}let(?: \\d+)? ${ENTITY_EN} (?:in|join)${END}`),
        new RegExp(`${EDGE}allow(?: \\d+)? ${ENTITY_EN} (?:in|join|entry)${END}`),
        new RegExp(`${EDGE}accept(?: \\d+)? ${ENTITY_EN}${END}`),
        new RegExp(`${EDGE}approve(?: \\d+)? ${ENTITY_EN}${END}`)
      ],
      allowBatch: [
        new RegExp(`${EDGE}(?:admit|let|accept|allow|approve) all(?: ${ENTITY_EN})?(?: in| join)?${END}`)
      ],
      deny: [
        new RegExp(`${EDGE}(?:deny|decline|reject|block|dismiss)(?: \\d+)? ${ENTITY_EN}${END}`),
        new RegExp(`${EDGE}deny(?: entry)?${END}`)
      ],
      denyBatch: [
        new RegExp(`${EDGE}(?:deny|decline|reject|block|dismiss) all(?: ${ENTITY_EN})?${END}`)
      ]
    }
  };

  const BLOCKED_ACTION_FRAGMENTS = [
    "dang cho duoc cho phep",
    "dang cho tham gia",
    "nguoi dung chua duoc xac nhan",
    "people waiting",
    "participants waiting",
    "waiting to join",
    "in meeting",
    "trong cuoc hop",
    // Chat / Messaging UI — must never be treated as join-request actions
    "gui tin nhan",
    "send message",
    "send a message",
    "tin nhan trong cuoc",
    "messages in call",
    "in call message",
    "cho phep nguoi tham gia gui",
    "let participants send",
    "allow participants to send",
    "cho phep moi nguoi gui",
    "allow everyone to send",
    "tin nhan",
    "messaging",
    "chat message",
    // Pre-join/Companion Mode UI
    "che do dong hanh",
    "companion mode",
    // Host Controls / Settings
    "quyen quan ly cua nguoi to chuc",
    "host management",
    "cho phep cong tac vien",
    "let contributors",
    "cho phep ung dung",
    "let third-party apps",
    "let apps",
    "chia se man hinh",
    "share screen",
    "share their screen",
    "gui phan ung",
    "send reactions",
    "bat micro",
    "turn on their microphone",
    "turn on their mic",
    "bat video",
    "turn on their video",
    "dieu phoi cuoc hop"
  ];

  function normalizeText(value) {
    return String(value || "")
      .replace(/Đ/g, "D")
      .replace(/đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s.!?:,;]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function getActiveLanguages(matchLanguage) {
    if (matchLanguage === "en") {
      return ["en"];
    }

    if (matchLanguage === "vi") {
      return ["vi"];
    }

    return ["en", "vi"];
  }

  function isActionLabel(label, actionMode, matchLanguage = "auto") {
    const normalizedLabel = normalizeText(label);
    const languages = getActiveLanguages(matchLanguage);

    if (isBlockedActionLabel(normalizedLabel)) {
      return false;
    }

    if (actionMode === "deny") {
      return matchesDeny(normalizedLabel, languages);
    }

    return !matchesDeny(normalizedLabel, languages) && matchesAllow(normalizedLabel, languages);
  }

  function isBatchLabel(label, actionMode, matchLanguage = "auto") {
    const normalizedLabel = normalizeText(label);
    const languages = getActiveLanguages(matchLanguage);
    const key = actionMode === "deny" ? "denyBatch" : "allowBatch";
    return languages.some((language) => matchesKey(normalizedLabel, language, key));
  }

  function isContextLabel(label, matchLanguage = "auto") {
    const normalizedLabel = normalizeText(label);
    const languages = getActiveLanguages(matchLanguage);

    return languages.some((language) => (
      LABELS[language].context.some((phrase) => normalizedLabel.includes(normalizeText(phrase))) ||
      matchesKey(normalizedLabel, language, "allow") ||
      matchesKey(normalizedLabel, language, "allowBatch") ||
      matchesKey(normalizedLabel, language, "deny") ||
      matchesKey(normalizedLabel, language, "denyBatch")
    ));
  }

  function extractActionCount(label, fallback = 1) {
    const normalizedLabel = normalizeText(label);
    const countMatch = normalizedLabel.match(/(?:^|\s)(\d+)(?=\s|$)/);
    const count = countMatch ? Number(countMatch[1]) : Number(fallback);

    if (!Number.isFinite(count) || count < 1) {
      return 1;
    }

    return Math.min(count, 100);
  }

  function matchesAllow(normalizedLabel, languages) {
    return languages.some((language) => (
      matchesKey(normalizedLabel, language, "allow") ||
      matchesKey(normalizedLabel, language, "allowBatch")
    ));
  }

  function matchesDeny(normalizedLabel, languages) {
    return languages.some((language) => (
      matchesKey(normalizedLabel, language, "deny") ||
      matchesKey(normalizedLabel, language, "denyBatch")
    ));
  }

  function matchesKey(normalizedLabel, language, key) {
    const phrases = LABELS[language][key] || [];
    const patterns = (PATTERNS[language] && PATTERNS[language][key]) || [];

    return phrases.some((phrase) => isWholePhrase(normalizedLabel, phrase)) ||
      patterns.some((pattern) => pattern.test(normalizedLabel));
  }

  function isBlockedActionLabel(normalizedLabel) {
    return BLOCKED_ACTION_FRAGMENTS.some((phrase) => (
      normalizedLabel === phrase || normalizedLabel.includes(phrase)
    ));
  }

  function isWholePhrase(normalizedLabel, phrase) {
    const normalizedPhrase = normalizeText(phrase);
    if (normalizedLabel === normalizedPhrase) {
      return true;
    }

    return new RegExp(`(^|\\s|[.!?:,;])${escapeRegExp(normalizedPhrase)}(?=$|\\s|[.!?:,;])`, "i")
      .test(normalizedLabel);
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  return {
    LABELS,
    PATTERNS,
    normalizeText,
    getActiveLanguages,
    isActionLabel,
    isBatchLabel,
    isContextLabel,
    isBlockedActionLabel,
    isWholePhrase,
    extractActionCount
  };
});
