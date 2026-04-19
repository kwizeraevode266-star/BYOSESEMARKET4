// ===============================
// OTP VERIFY SYSTEM (PRO)
// ===============================

const inputs = document.querySelectorAll(".otp-input");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");
const countdownEl = document.getElementById("countdown");

// ===============================
// AUTO MOVE INPUT
// ===============================
inputs.forEach((input, index) => {

    input.addEventListener("input", () => {
        if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && input.value === "" && index > 0) {
            inputs[index - 1].focus();
        }
    });

});

// ===============================
// GET OTP VALUE
// ===============================
function getOTP() {
    return Array.from(inputs).map(i => i.value).join("");
}

// ===============================
// TIMER
// ===============================
let time = 60;

const timer = setInterval(() => {
    time--;
    countdownEl.innerText = time;

    if (time <= 0) {
        clearInterval(timer);
        countdownEl.innerText = "0";
    }
}, 1000);


// ===============================
// VERIFY CODE
// ===============================
verifyBtn.addEventListener("click", async () => {

    const otp = getOTP();

    if (otp.length !== 6) {
        alert("Enter full 6-digit code");
        return;
    }

    verifyBtn.innerText = "Verifying...";
    verifyBtn.disabled = true;

    const method = localStorage.getItem("resetMethod");
    const identifier = localStorage.getItem("resetIdentifier");

    try {
        const response = await fetch("http://localhost:3000/api/verify-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ method, identifier, otp })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = "reset-password.html";
        } else {
            alert("Invalid or expired code");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }

    verifyBtn.innerText = "Verify Code";
    verifyBtn.disabled = false;
});


// ===============================
// RESEND CODE
// ===============================
resendBtn.addEventListener("click", async () => {

    const method = localStorage.getItem("resetMethod");
    const identifier = localStorage.getItem("resetIdentifier");

    resendBtn.innerText = "Sending...";

    try {
        const response = await fetch("http://localhost:3000/api/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ method, identifier })
        });

        const data = await response.json();

        if (data.success) {
            alert("Code resent!");
            time = 60;
        } else {
            alert("Failed to resend code");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }

    resendBtn.innerText = "Resend";
});