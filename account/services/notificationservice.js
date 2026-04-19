// ===============================
// 🔥 NOTIFICATION SERVICE
// ===============================

// ===============================
// 📦 BASE API URL
// ===============================
const NOTIF_API = window.__BYOSE_NOTIFICATION_API__ || "";

// ===============================
// 📥 GET NOTIFICATIONS
// ===============================
async function getNotifications(userId) {
  if (!NOTIF_API) {
    return [];
  }

  try {
    const res = await fetch(`${NOTIF_API}/${userId}`);
    const data = await res.json();

    return data.notifications || [];

  } catch (error) {
    console.error("Notifications Error:", error);
    return [];
  }
}

// ===============================
// 🔴 GET UNREAD COUNT
// ===============================
async function getUnreadCount(userId) {
  if (!NOTIF_API) {
    return 0;
  }

  try {
    const res = await fetch(`${NOTIF_API}/unread/${userId}`);
    const data = await res.json();

    return data.count || 0;

  } catch (error) {
    console.error("Unread Error:", error);
    return 0;
  }
}

// ===============================
// ✔ MARK AS READ
// ===============================
async function markAsRead(notificationId) {
  if (!NOTIF_API) {
    return { success: true, static: true };
  }

  try {
    const res = await fetch(`${NOTIF_API}/read/${notificationId}`, {
      method: "POST"
    });

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("Mark Read Error:", error);
  }
}

// ===============================
// ❌ DELETE NOTIFICATION
// ===============================
async function deleteNotification(notificationId) {
  if (!NOTIF_API) {
    return { success: true, static: true };
  }

  try {
    const res = await fetch(`${NOTIF_API}/delete/${notificationId}`, {
      method: "POST"
    });

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("Delete Error:", error);
  }
}