// ===============================
// RESET PASSWORD SYSTEM (PRO)
// ===============================

const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

const toggleNew = document.getElementById("toggleNew");
const toggleConfirm = document.getElementById("toggleConfirm");

const resetBtn = document.getElementById("resetBtn");

// ===============================
// SHOW / HIDE PASSWORD
// ===============================
toggleNew.addEventListener("click", () => {
    const type = newPasswordInput.type === "password" ? "text" : "password";
    newPasswordInput.type = type;
});

toggleConfirm.addEventListener("click", () => {
    const type = confirmPasswordInput.type === "password" ? "text" : "password";
    confirmPasswordInput.type = type;
});

// ===============================
// VALIDATION
// ===============================
function validatePassword(password) {
    return password.length >= 4;
}

// ===============================
// RESET PASSWORD
// ===============================
resetBtn.addEventListener("click", async () => {

    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!newPassword || !confirmPassword) {
        alert("Fill all fields");
        return;
    }

    if (!validatePassword(newPassword)) {
        alert("Password must be at least 4 characters");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    resetBtn.innerText = "Updating...";
    resetBtn.disabled = true;

    const method = localStorage.getItem("resetMethod");
    const identifier = localStorage.getItem("resetIdentifier");

    try {
        const response = await fetch("http://localhost:3000/api/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                method,
                identifier,
                newPassword
            })
        });

        const data = await response.json();

        if (data.success) {

            alert("Password updated successfully!");

            // clear storage
            localStorage.removeItem("resetMethod");
            localStorage.removeItem("resetIdentifier");

            // redirect to login
            window.location.href = "login.html";

        } else {
            alert("Failed to update password");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }

    resetBtn.innerText = "Reset Password";
    resetBtn.disabled = false;

});