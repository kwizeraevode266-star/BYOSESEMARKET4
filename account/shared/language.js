// ===============================
// 🌍 LANGUAGE SYSTEM (GLOBAL)
// ===============================

// ===============================
// 🧠 TRANSLATIONS
// ===============================
const translations = {
  rw: {
    login_title: "Injira",
    signup_title: "Iyandikishe",
    email: "Email",
    phone: "Telefone",
    password: "Ijambo ry'ibanga",
    confirm_password: "Emeza ijambo ry'ibanga",
    login_btn: "Injira",
    signup_btn: "Iyandikishe",
    forgot_password: "Wibagiwe ijambo ry'ibanga?",
    remember_me: "Unyibuke",
    no_account: "Nta konti ufite?",
    have_account: "Ufite konti?",
    logout: "Sohoka",
    wallet: "Agafuka",
    orders: "Ibyatumijwe",
    notifications: "Amakuru",
    settings: "Igenamiterere"
  },

  en: {
    login_title: "Login",
    signup_title: "Sign Up",
    email: "Email",
    phone: "Phone",
    password: "Password",
    confirm_password: "Confirm Password",
    login_btn: "Login",
    signup_btn: "Sign Up",
    forgot_password: "Forgot password?",
    remember_me: "Remember me",
    no_account: "Don't have an account?",
    have_account: "Already have an account?",
    logout: "Logout",
    wallet: "Wallet",
    orders: "Orders",
    notifications: "Notifications",
    settings: "Settings"
  }
};

// ===============================
// 🔄 APPLY LANGUAGE
// ===============================
function applyLanguage(lang) {

  const elements = document.querySelectorAll("[data-lang]");

  elements.forEach(el => {
    const key = el.getAttribute("data-lang");

    if (translations[lang] && translations[lang][key]) {
      el.innerText = translations[lang][key];
    }
  });

  // update placeholders
  const inputs = document.querySelectorAll("[data-lang-placeholder]");
  inputs.forEach(input => {
    const key = input.getAttribute("data-lang-placeholder");

    if (translations[lang] && translations[lang][key]) {
      input.placeholder = translations[lang][key];
    }
  });

  // save
  localStorage.setItem("bm_lang", lang);
}

// ===============================
// 📥 LOAD LANGUAGE
// ===============================
function loadLanguage() {
  const savedLang = localStorage.getItem("bm_lang") || "rw";
  applyLanguage(savedLang);

  // update dropdown
  const selector = document.getElementById("languageSwitcher");
  if (selector) {
    selector.value = savedLang;
  }
}

// ===============================
// 🔄 SWITCHER
// ===============================
function initLanguageSwitcher() {
  const selector = document.getElementById("languageSwitcher");

  if (!selector) return;

  selector.addEventListener("change", (e) => {
    applyLanguage(e.target.value);
  });
}

// ===============================
// 🚀 INIT
// ===============================
function initLanguageSystem() {
  loadLanguage();
  initLanguageSwitcher();
}

// AUTO START
document.addEventListener("DOMContentLoaded", initLanguageSystem);