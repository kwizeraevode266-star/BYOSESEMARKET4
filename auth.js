// Lightweight auth helper (guarded for pages without these controls)
let emailBtn, phoneBtn, emailField, phoneField, passwordInput, togglePassword;

function activateEmailMode() {
    if (!emailField || !phoneField || !emailBtn || !phoneBtn) return;
    emailField.style.display = "block";
    emailField.hidden = false;
    phoneField.style.display = "none";
    phoneField.hidden = true;
    emailBtn.classList.add("active");
    phoneBtn.classList.remove("active");
    emailBtn.setAttribute("aria-pressed", "true");
    phoneBtn.setAttribute("aria-pressed", "false");
}

function activatePhoneMode() {
    if (!emailField || !phoneField || !emailBtn || !phoneBtn) return;
    emailField.style.display = "none";
    emailField.hidden = true;
    phoneField.style.display = "block";
    phoneField.hidden = false;
    phoneBtn.classList.add("active");
    emailBtn.classList.remove("active");
    phoneBtn.setAttribute("aria-pressed", "true");
    emailBtn.setAttribute("aria-pressed", "false");
}

function togglePasswordVisibility() {
    if (!passwordInput || !togglePassword) return;
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    togglePassword.innerHTML = isHidden
        ? '<i class="fa fa-eye-slash"></i>'
        : '<i class="fa fa-eye"></i>';
}

document.addEventListener("DOMContentLoaded", () => {
    emailBtn = document.getElementById("emailBtn");
    phoneBtn = document.getElementById("phoneBtn");
    emailField = document.getElementById("emailField");
    phoneField = document.getElementById("phoneField");
    passwordInput = document.getElementById("password");
    togglePassword = document.getElementById("togglePassword");

    if (emailBtn && phoneBtn) {
        emailBtn.addEventListener("click", activateEmailMode);
        phoneBtn.addEventListener("click", activatePhoneMode);
    }

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", togglePasswordVisibility);
    }
});