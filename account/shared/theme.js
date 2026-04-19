// ===============================
// 🔥 THEME SYSTEM (GLOBAL)
// ===============================

// ===============================
// 🎨 APPLY THEME
// ===============================
function applyTheme(theme) {

  document.body.classList.remove(
    "light-theme",
    "dark-theme",
    "gradient-theme"
  );

  switch (theme) {
    case "light":
      document.body.classList.add("light-theme");
      break;

    case "dark":
      document.body.classList.add("dark-theme");
      break;

    case "gradient":
      document.body.classList.add("gradient-theme");
      break;

    default:
      document.body.classList.add("light-theme");
  }

  // save
  localStorage.setItem("bm_theme", theme);
}

// ===============================
// 📥 LOAD SAVED THEME
// ===============================
function loadTheme() {
  const savedTheme = localStorage.getItem("bm_theme") || "light";
  applyTheme(savedTheme);

  // update dropdown if exists
  const selector = document.getElementById("themeSwitcher");
  if (selector) {
    selector.value = savedTheme;
  }
}

// ===============================
// 🔄 INIT THEME SWITCHER
// ===============================
function initThemeSwitcher() {
  const selector = document.getElementById("themeSwitcher");

  if (!selector) return;

  selector.addEventListener("change", (e) => {
    applyTheme(e.target.value);
  });
}

// ===============================
// 🚀 INIT
// ===============================
function initThemeSystem() {
  loadTheme();
  initThemeSwitcher();
}

// AUTO START
document.addEventListener("DOMContentLoaded", initThemeSystem);