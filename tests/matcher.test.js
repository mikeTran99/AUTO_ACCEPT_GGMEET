"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const matcher = require("../src/matcher.js");

test("normalizes Vietnamese accents and punctuation", () => {
  assert.equal(matcher.normalizeText("Chấp nhận 1 khách vào!"), "chap nhan 1 khach vao!");
  assert.equal(matcher.normalizeText("TỪ CHỐI khách"), "tu choi khach");
  assert.equal(matcher.normalizeText("Đồng ý"), "dong y");
});

test("matches Vietnamese allow phrases", () => {
  [
    "Cho phép",
    "Chấp nhận",
    "Cho vào",
    "Nhận vào",
    "Đồng ý",
    "Cho phép khách vào",
    "Cho phép 1 khách vào",
    "Cho phép 12 khách vào",
    "Cho 3 khách vào",
    "Cho 2 người vào",
    "Cho 9 người tham gia",
    "Cho học viên vào",
    "Cho thành viên vào",
    "Chấp nhận tất cả",
    "Cho phép tất cả",
    "Cho tất cả vào"
  ].forEach((label) => {
    assert.equal(matcher.isActionLabel(label, "allow", "vi"), true, label);
    assert.equal(matcher.isActionLabel(label, "deny", "vi"), false, label);
  });
});

test("matches English allow phrases", () => {
  [
    "Admit",
    "Let in",
    "Allow",
    "Allow entry",
    "Accept",
    "Approve",
    "Admit guest",
    "Admit 1 guest",
    "Admit 12 guests",
    "Let guest in",
    "Let 1 guest in",
    "Let 4 guests in",
    "Let participant in",
    "Let 7 participants in",
    "Admit all",
    "Let all in",
    "Accept all"
  ].forEach((label) => {
    assert.equal(matcher.isActionLabel(label, "allow", "en"), true, label);
    assert.equal(matcher.isActionLabel(label, "deny", "en"), false, label);
  });
});

test("matches Vietnamese deny phrases without leaking into allow mode", () => {
  [
    "Từ chối",
    "Không cho phép",
    "Không cho vào",
    "Chặn",
    "Hủy",
    "Bỏ qua",
    "Từ chối khách",
    "Từ chối 1 khách",
    "Từ chối 8 khách",
    "Từ chối 3 người",
    "Không cho khách vào",
    "Không cho 5 khách vào",
    "Từ chối tất cả",
    "Không cho tất cả vào",
    "Chặn tất cả"
  ].forEach((label) => {
    assert.equal(matcher.isActionLabel(label, "deny", "vi"), true, label);
    assert.equal(matcher.isActionLabel(label, "allow", "vi"), false, label);
  });
});

test("matches English deny phrases without leaking into allow mode", () => {
  [
    "Deny",
    "Deny entry",
    "Decline",
    "Reject",
    "Block",
    "Dismiss",
    "Deny guest",
    "Deny 1 guest",
    "Deny 10 guests",
    "Decline guest",
    "Reject guest",
    "Deny all",
    "Decline all",
    "Reject all",
    "Block all"
  ].forEach((label) => {
    assert.equal(matcher.isActionLabel(label, "deny", "en"), true, label);
    assert.equal(matcher.isActionLabel(label, "allow", "en"), false, label);
  });
});

test("matches safe context phrases", () => {
  [
    "Muốn tham gia",
    "Xin vào",
    "Yêu cầu tham gia",
    "Đang yêu cầu tham gia",
    "Đang chờ",
    "Người đang chờ",
    "Khách đang chờ",
    "Phòng chờ",
    "Tham gia cuộc họp",
    "Tham gia cuộc gọi",
    "wants to join",
    "asking to join",
    "request to join",
    "join request",
    "waiting to join",
    "people waiting",
    "participants waiting",
    "guest waiting",
    "waiting room"
  ].forEach((label) => {
    assert.equal(matcher.isContextLabel(label, "auto"), true, label);
  });
});

test("identifies batch labels separately", () => {
  assert.equal(matcher.isBatchLabel("Cho phép tất cả", "allow", "vi"), true);
  assert.equal(matcher.isBatchLabel("Cho phép 1 khách vào", "allow", "vi"), false);
  assert.equal(matcher.isBatchLabel("Từ chối tất cả", "deny", "vi"), true);
  assert.equal(matcher.isBatchLabel("Deny all", "deny", "en"), true);
  assert.equal(matcher.isBatchLabel("Deny 1 guest", "deny", "en"), false);
});

test("extracts action counts without inflating batch labels", () => {
  assert.equal(matcher.extractActionCount("Cho phép 1 khách vào"), 1);
  assert.equal(matcher.extractActionCount("Cho phép 12 khách vào"), 12);
  assert.equal(matcher.extractActionCount("Let 4 guests in"), 4);
  assert.equal(matcher.extractActionCount("Admit all"), 1);
  assert.equal(matcher.extractActionCount("Từ chối tất cả"), 1);
});

test("compact toast labels are valid action and context labels", () => {
  [
    "Cho phép 1 khách vào",
    "Cho 3 người tham gia",
    "Let 1 guest in",
    "Admit 5 guests"
  ].forEach((label) => {
    assert.equal(matcher.isActionLabel(label, "allow", "auto"), true, label);
    assert.equal(matcher.isContextLabel(label, "auto"), true, label);
  });
});

test("does not treat waiting-status labels as action buttons", () => {
  [
    "Đang chờ được cho phép",
    "Người dùng chưa được xác nhận",
    "People waiting",
    "Waiting to join"
  ].forEach((label) => {
    assert.equal(matcher.isActionLabel(label, "allow", "auto"), false, label);
    assert.equal(matcher.isActionLabel(label, "deny", "auto"), false, label);
  });
});

test("does not treat chat/messaging toggle labels as action buttons", () => {
  [
    "Cho phép người tham gia gửi tin nhắn",
    "Cho phép mọi người gửi tin nhắn",
    "Allow participants to send messages",
    "Let participants send messages",
    "Allow everyone to send messages",
    "Gửi tin nhắn",
    "Send message",
    "Send a message",
    "Tin nhắn trong cuộc gọi",
    "Messages in call",
    "In-call message"
  ].forEach((label) => {
    assert.equal(matcher.isActionLabel(label, "allow", "auto"), false, `should block: ${label}`);
    assert.equal(matcher.isActionLabel(label, "deny", "auto"), false, `should block deny: ${label}`);
    assert.equal(matcher.isBlockedActionLabel(matcher.normalizeText(label)), true, `should be blocked: ${label}`);
  });
});
