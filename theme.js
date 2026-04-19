// ===============================
// 🎛️ THEME SYSTEM (PRO)
// ===============================

const THEME_KEY = "byose_market_theme";

// ===============================
// 🔄 APPLY THEME
// ===============================
function applyTheme(theme) {

    const body = document.body;

    // remove old themes
    body.classList.remove("light-theme", "dark-theme", "gradient-theme");

    // apply new
    if (theme === "light") {
        body.classList.add("light-theme");
    }
    else if (theme === "dark") {
        body.classList.add("dark-theme");
    }
    else {
        body.classList.add("gradient-theme");
    }
}


// ===============================
// 💾 SAVE THEME
// ===============================
function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}


// ===============================
// 🔄 LOAD THEME
// ===============================
function loadTheme() {

    const savedTheme = localStorage.getItem(THEME_KEY) || "dark";

    applyTheme(savedTheme);

    const switcher = document.getElementById("themeSwitcher");
    if (switcher) switcher.value = savedTheme;
}


// ===============================
// 🎛️ INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    loadTheme();

    const switcher = document.getElementById("themeSwitcher");

    if (switcher) {
        switcher.addEventListener("change", (e) => {
            setTheme(e.target.value);
        });
    }

});