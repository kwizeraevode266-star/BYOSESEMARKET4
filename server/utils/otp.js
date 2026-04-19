// ===============================
// OTP SYSTEM (IN-MEMORY)
// ===============================

// store OTPs temporarily
const otpStore = {};

// ===============================
// GENERATE OTP
// ===============================
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===============================
// SAVE OTP
// ===============================
function saveOTP(identifier, otp) {

    otpStore[identifier] = {
        code: otp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

}

// ===============================
// VERIFY OTP
// ===============================
function verifyOTP(identifier, otp) {

    const record = otpStore[identifier];

    if (!record) {
        return { success: false, message: "No OTP found" };
    }

    if (Date.now() > record.expiresAt) {
        delete otpStore[identifier];
        return { success: false, message: "OTP expired" };
    }

    if (record.code !== otp) {
        return { success: false, message: "Invalid OTP" };
    }

    // success → delete OTP
    delete otpStore[identifier];

    return { success: true };
}

// ===============================
// EXPORT
// ===============================
module.exports = {
    generateOTP,
    saveOTP,
    verifyOTP
};