// ===============================
// 🔥 APP CONTROLLER (FIXED PRO)
// ===============================

// ===============================
// 🔐 SESSION HELPERS
// ===============================
function isUserLoggedIn() {
  if (typeof window.isLoggedIn === 'function') {
    try { return !!window.isLoggedIn(); } catch (e) {}
  }
  return localStorage.getItem("bm_logged_in") === "true";
}

function getCurrentUser() {
  if (typeof window.getCurrentUser === 'function') {
    try { return window.getCurrentUser(); } catch (e) { /* fallback */ }
  }
  try {
    return JSON.parse(localStorage.getItem("bm_user"));
  } catch {
    return null;
  }
}

// ===============================
// 🔐 AUTH CHECK (PROTECTION)
// ===============================
function checkAuth() {
  const path = window.location.pathname;

  const isProtected =
    path.includes("/account/");

  if (isProtected && !isUserLoggedIn()) {
    window.location.href = "/login.html";
  }
}

// ===============================
// 👤 ACCOUNT CLICK HANDLER (IMPORTANT)
// ===============================
function handleAccountClick() {
  if (isUserLoggedIn()) {
    window.location.href = "/account/account.html";
  } else {
    window.location.href = "/login.html";
  }
}

// ===============================
// 🔓 LOGOUT SYSTEM
// ===============================
function attachLogout() {
  const btn = document.getElementById("logoutBtn");

  if (!btn) return;

  btn.addEventListener("click", function () {
    // go to centralized logout confirmation page
    try { window.location.href = '/logout/logout.html'; } catch (e) { window.location.replace('/logout/logout.html'); }
  });
}

// ===============================
// 🔗 CONNECT NAVIGATION (VERY IMPORTANT)
// ===============================
function connectNavigation() {

  // 🔽 MOBILE (bottom nav)
  const accountBtns = document.querySelectorAll(".nav-account");

  accountBtns.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      handleAccountClick();
    });
  });

  // 🔼 DESKTOP (header)
  const headerAccount = document.querySelector(".header-account");

  if (headerAccount) {
    headerAccount.addEventListener("click", function (e) {
      e.preventDefault();
      handleAccountClick();
    });
  }
}

// ===============================
// 🎨 INIT SYSTEMS
// ===============================
function initGlobalSystems() {
  if (typeof initThemeSystem === "function") initThemeSystem();
  if (typeof initLanguageSystem === "function") initLanguageSystem();
}

// ===============================
// 🧩 INIT COMPONENTS
// ===============================
function initComponents() {
  if (typeof initHeader === "function") initHeader();
  if (typeof initBottomNavComponent === "function") initBottomNavComponent();
}

// ===============================
// 📦 INIT MODULES
// ===============================
function initModules() {
  if (typeof initOrders === "function") initOrders();
  if (typeof initFeatures === "function") initFeatures();
  if (typeof initPromo === "function") initPromo();
  if (typeof initProducts === "function") initProducts();
  if (typeof initWallet === "function") initWallet();
  if (typeof initNotifications === "function") initNotifications();
}

// ===============================
// 🚀 INIT APP
// ===============================
function initApp() {

  console.log("🚀 App Starting...");

  checkAuth();              // protect pages
  connectNavigation();      // 🔥 IMPORTANT FIX
  initGlobalSystems();
  initComponents();
  initModules();
  attachLogout();

  console.log("✅ App Loaded");
}

// ===============================
// 🔄 START
// ===============================
document.addEventListener("DOMContentLoaded", initApp);