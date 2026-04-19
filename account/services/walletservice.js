// ===============================
// 🔥 WALLET SERVICE
// ===============================

// ===============================
// 📦 BASE API URL
// ===============================
const WALLET_API = "https://your-backend-url.onrender.com/api/wallet";

// ===============================
// 💰 GET BALANCE
// ===============================
async function getBalance(userId) {
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