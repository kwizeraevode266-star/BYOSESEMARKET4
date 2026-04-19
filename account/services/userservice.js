// ===============================
// 🔥 USER SERVICE
// ===============================

// ===============================
// 📦 BASE API URL (use local API namespace)
// ===============================
const API_URL = "/api";

// ===============================
// 👤 GET USER (LOCAL)
// ===============================
function getUser() {
  if (typeof window.getCurrentUser === 'function') {
    try { return window.getCurrentUser(); } catch (e) {}
  }
  try { return JSON.parse(localStorage.getItem("bm_user")); } catch (e) { return null; }
}

// ===============================
// 💾 SAVE USER
// ===============================
function saveUser(user) {
  if (typeof window.setCurrentUser === 'function') {
    try { window.setCurrentUser(user); return; } catch (e) {}
  }
  localStorage.setItem("bm_user", JSON.stringify(user));
}

// ===============================
// 🔄 UPDATE PROFILE
// ===============================
async function updateProfile(data) {
  try {
    const fetchFn = (typeof authService !== 'undefined' && typeof authService.authFetch === 'function') ? authService.authFetch : fetch;
    const response = await fetchFn(`${API_URL}/update-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) { saveUser(result.user); return result.user; }
    else throw new Error(result.message || 'update_failed');
  } catch (error) {
    console.error("Update Error:", error);
  }
}

// ===============================
// 🚪 LOGOUT
// ===============================
function logout() {
  // Redirect to centralized logout page for confirmation and session cleanup
  try { window.location.href = '../logout/logout.html'; } catch (e) { window.location.replace('../logout/logout.html'); }
}

// ===============================
// 🔍 CHECK LOGIN
// ===============================
function isLoggedIn() {
  if (typeof window.isLoggedIn === 'function') {
    try { return !!window.isLoggedIn(); } catch (e) {}
  }
  return !!localStorage.getItem("bm_user");
}