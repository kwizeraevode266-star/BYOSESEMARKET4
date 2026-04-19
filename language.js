// ===============================
// 🌐 LANGUAGE SYSTEM (COMPATIBLE)
// ===============================

const LANG_KEY = "byose_market_language";

// TRANSLATIONS
const translations = {
    rw: {
        login_title: "Injira",
        signup_title: "Iyandikishe",
        email: "Email",
        phone: "Nimero",
        password: "Ijambo ry'ibanga",
        confirm_password: "Emeza ijambo ry'ibanga",
        name: "Amazina yawe",
        login_btn: "Injira",
        signup_btn: "Iyandikishe",
        forgot: "Wibagiwe ijambo ry'ibanga?",
        remember: "Unyibuke",
        no_account: "Nta account ufite?",
        have_account: "Ufite account?",
        signup_link: "Iyandikishe",
        login_link: "Injira",
        back_login: "Subira ku kwinjira"
    },

    en: {
        login_title: "Login",
        signup_title: "Sign Up",
        email: "Email",
        phone: "Phone",
        password: "Password",
        confirm_password: "Confirm Password",
        name: "Full Name",
        login_btn: "Login",
        signup_btn: "Sign Up",
        forgot: "Forgot password?",
        remember: "Remember me",
        no_account: "Don't have an account?",
        have_account: "Already have an account?",
        signup_link: "Sign Up",
        login_link: "Login",
        back_login: "Back to login"
    }
};

// ===============================
// 🔄 APPLY LANGUAGE
// ===============================
// ===============================
// 🔄 APPLY LANGUAGE
// ===============================
function applyLanguage(lang) {
    if (!translations[lang]) lang = Object.keys(translations)[0];

    // Replace innerText for elements with data-lang attribute
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (!key) return;
        const text = translations[lang][key];
        if (text === undefined) return;
        el.innerText = text;
    });

    // Replace placeholders for inputs with data-lang-placeholder
    document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
        const key = el.getAttribute('data-lang-placeholder');
        if (!key) return;
        const text = translations[lang][key];
        if (text === undefined) return;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = text;
        else el.setAttribute('placeholder', text);
    });

    // For elements that need small fragments inside text (like bottom text), keep them in translations
    document.querySelectorAll('.auth-bottom-text').forEach(el => {
        // pick correct form by existence of signup link in markup
        const a = el.querySelector('a');
        const href = (a && (a.getAttribute('href') || ''));
        if (href.endsWith('signup.html')) {
            el.innerHTML = `${translations[lang].no_account} <a href="signup.html">${translations[lang].signup_link}</a>`;
        } else {
            el.innerHTML = `${translations[lang].have_account} <a href="login.html">${translations[lang].login_link}</a>`;
        }
    });
}


// ===============================
// 💾 SAVE LANGUAGE
// ===============================
function setLanguage(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyLanguage(lang);
}

// ===============================
// 🔄 LOAD LANGUAGE
// ===============================
function loadLanguage() {
    const savedLang = localStorage.getItem(LANG_KEY) || "rw";

    applyLanguage(savedLang);

    const switcher = document.getElementById("languageSwitcher");
    if (switcher) switcher.value = savedLang;
}

// ===============================
// 🎛️ INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    loadLanguage();

    const switcher = document.getElementById("languageSwitcher");

    if (switcher) {
        switcher.addEventListener("change", (e) => {
            setLanguage(e.target.value);
        });
    }

});