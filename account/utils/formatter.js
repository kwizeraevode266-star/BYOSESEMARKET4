// ===============================
// 🔥 FORMATTER UTILS
// ===============================

// ===============================
// 💰 FORMAT MONEY
// ===============================
function formatMoney(amount, currency = "USD") {
  if (!amount) return "0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency
  }).format(amount);
}

// ===============================
// 📅 FORMAT DATE
// ===============================
function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// ===============================
// ⏱️ TIME AGO
// ===============================
function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);

  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 }
  ];

  for (let i of intervals) {
    const count = Math.floor(seconds / i.seconds);

    if (count >= 1) {
      return count + " " + i.label + (count > 1 ? "s ago" : " ago");
    }
  }

  return "Just now";
}

// ===============================
// ✂️ SHORT TEXT
// ===============================
function truncateText(text, maxLength = 20) {
  if (!text) return "";

  return text.length > maxLength
    ? text.substring(0, maxLength) + "..."
    : text;
}