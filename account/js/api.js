// ===============================
// 🌐 API SYSTEM (PRO)
// ===============================

// ===============================
// 📦 BASE URL (Render Backend)
// ===============================
const BASE_URL = "https://your-backend-url.onrender.com/api";

// ===============================
// 🔁 GENERIC REQUEST
// ===============================
async function request(endpoint, method = "GET", data = null) {

  try {

    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      throw new Error("Server Error");
    }

    const result = await response.json();

    return result;

  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: error.message };
  }

}

// ===============================
// 📥 GET
// ===============================
function apiGet(endpoint) {
  return request(endpoint, "GET");
}

// ===============================
// 📤 POST
// ===============================
function apiPost(endpoint, data) {
  return request(endpoint, "POST", data);
}

// ===============================
// ✏️ PUT
// ===============================
function apiPut(endpoint, data) {
  return request(endpoint, "PUT", data);
}

// ===============================
// ❌ DELETE
// ===============================
function apiDelete(endpoint) {
  return request(endpoint, "DELETE");
}