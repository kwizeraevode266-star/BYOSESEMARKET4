// ===============================
// FORGOT PASSWORD LOGIC
// ===============================

const methodSelect = document.getElementById('method');
const identifierInput = document.getElementById('identifier');
const inputLabel = document.getElementById('inputLabel');
const sendBtn = document.getElementById('sendCodeBtn');

// ===============================
// CHANGE INPUT BASED ON METHOD
// ===============================
methodSelect.addEventListener('change', () => {
    const method = methodSelect.value;

    if (method === 'email') {
        inputLabel.innerText = "Email Address";
        identifierInput.placeholder = "Enter your email";
        identifierInput.type = "email";
    } else {
        inputLabel.innerText = "Phone Number";
        identifierInput.placeholder = "Enter your phone (+250...)";
        identifierInput.type = "tel";
    }
});

// ===============================
// VALIDATION FUNCTIONS
// ===============================
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^\+2507\d{8}$/.test(phone); // Rwanda format
}

// ===============================
// SEND CODE
// ===============================
sendBtn.addEventListener('click', async () => {
    const method = methodSelect.value;
    const identifier = identifierInput.value.trim();

    // validation
    if (!identifier) {
        alert("Please enter your details");
        return;
    }

    if (method === "email" && !validateEmail(identifier)) {
        alert("Invalid email format");
        return;
    }

    if (method === "phone" && !validatePhone(identifier)) {
        alert("Invalid phone format. Use +2507XXXXXXXX");
        return;
    }

    sendBtn.innerText = "Sending...";
    sendBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ method, identifier })
        });

        const data = await response.json();

        if (data.success) {

            // Save for next step
            localStorage.setItem("resetMethod", method);
            localStorage.setItem("resetIdentifier", identifier);

            // Go to verify page
            window.location.href = "verify-code.html";

        } else {
            alert(data.message || "Failed to send code");
        }

    } catch (error) {
        console.error(error);
        alert("Server error");
    }

    sendBtn.innerText = "Send Reset Code";
    sendBtn.disabled = false;
});