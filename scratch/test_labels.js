const matcher = require("../src/matcher.js");

const testButtons = [
  // Vietnamese pre-join buttons
  "Tham gia ngay",
  "Trình bày",
  "Sử dụng chế độ đồng hành",
  "Tham gia bằng chế độ đồng hành",
  "Yêu cầu tham gia",
  "Chế độ đồng hành",
  
  // English pre-join buttons
  "Join now",
  "Present",
  "Use Companion mode",
  "Companion mode",
  "Ask to join",
  
  // Other buttons that might appear
  "Hủy",
  "Bỏ qua",
  "Dismiss",
  "Decline"
];

console.log("--- TESTING VIETNAMESE ALLOW MODE ---");
testButtons.forEach(label => {
  const isAction = matcher.isActionLabel(label, "allow", "vi");
  const isContext = matcher.isContextLabel(label, "vi");
  console.log(`Label: "${label}" -> isActionLabel: ${isAction}, isContextLabel: ${isContext}`);
});

console.log("\n--- TESTING VIETNAMESE DENY MODE ---");
testButtons.forEach(label => {
  const isAction = matcher.isActionLabel(label, "deny", "vi");
  console.log(`Label: "${label}" -> isActionLabel: ${isAction}`);
});

console.log("\n--- TESTING ENGLISH ALLOW MODE ---");
testButtons.forEach(label => {
  const isAction = matcher.isActionLabel(label, "allow", "en");
  const isContext = matcher.isContextLabel(label, "en");
  console.log(`Label: "${label}" -> isActionLabel: ${isAction}, isContextLabel: ${isContext}`);
});

console.log("\n--- TESTING AUTO MODE (default) ---");
testButtons.forEach(label => {
  const isAction = matcher.isActionLabel(label, "allow", "auto");
  const isContext = matcher.isContextLabel(label, "auto");
  console.log(`Label: "${label}" -> isActionLabel: ${isAction}, isContextLabel: ${isContext}`);
});
