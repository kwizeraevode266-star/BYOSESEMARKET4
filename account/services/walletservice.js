// ===============================
// 🔥 WALLET SERVICE
// ===============================

// ===============================
// 📦 BASE API URL
// ===============================
const WALLET_API = window.__BYOSE_WALLET_API__ || "";

// ===============================
// 💰 GET BALANCE
// ===============================
async function getBalance(userId) {
  if (!WALLET_API) {
    return 0;
  }

  try {
    const res = await fetch(`${WALLET_API}/balance/${userId}`);
    const data = await res.json();

    return data.balance || 0;

  } catch (error) {
    console.error("Balance Error:", error);
    return 0;
  }
}

// ===============================
// 📜 GET TRANSACTIONS
// ===============================
async function getTransactions(userId) {
  if (!WALLET_API) {
    return [];
  }

  try {
    const res = await fetch(`${WALLET_API}/transactions/${userId}`);
    const data = await res.json();

    return data.transactions || [];

  } catch (error) {
    console.error("Transaction Error:", error);
    return [];
  }
}

// ===============================
// ➕ TOP UP
// ===============================
async function topUp(userId, amount) {
  if (!WALLET_API) {
    return { success: false, message: 'Static hosting mode: wallet API unavailable.' };
  }

  try {
    const res = await fetch(`${WALLET_API}/topup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, amount })
    });

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("TopUp Error:", error);
  }
}

// ===============================
// ➖ WITHDRAW
// ===============================
async function withdraw(userId, amount) {
  if (!WALLET_API) {
    return { success: false, message: 'Static hosting mode: wallet API unavailable.' };
  }

  try {
    const res = await fetch(`${WALLET_API}/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, amount })
    });

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("Withdraw Error:", error);
  }
}