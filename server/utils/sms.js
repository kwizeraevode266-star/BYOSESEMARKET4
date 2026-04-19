// ===============================
// SMS SERVICE (AFRICA'S TALKING)
// ===============================

const africastalking = require('africastalking')({
    apiKey: "atsk_3baa58eb843f2d5c38669db67d6d7d8e702fa3c1f7cbf8b14df4e1bcb93a314f5b77a3fb",
    username: "sandbox"
});

const sms = africastalking.SMS;

// ===============================
// SEND SMS FUNCTION
// ===============================
async function sendSMS(to, message) {

    try {
        const response = await sms.send({
            to: [to],
            message: message
        });

        console.log("SMS SENT:", response);

        return { success: true };

    } catch (error) {
        console.error("SMS ERROR:", error);

        return { success: false, error };
    }
}

// ===============================
// EXPORT
// ===============================
module.exports = {
    sendSMS
};