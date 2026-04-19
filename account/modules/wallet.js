// ===============================
// 🔥 WALLET MODULE
// ===============================

// Sample wallet data (later izava muri backend)
const walletData = {
  balance: "$120.00"
};

// ===============================
// 🧱 CREATE WALLET UI
// ===============================
function loadWallet() {
  const container = document.getElementById("wallet");

  if (!container) return;

  container.innerHTML = `
    <div class="wallet-section">

      <div class="wallet-card">

        <h3>My Wallet</h3>

        <div class="wallet-balance">
          ${walletData.balance}
        </div>

        <div class="wallet-actions">
          <button class="wallet-btn" id="topupBtn">
            <i class="fa-solid fa-plus"></i> Top Up
          </button>

          <button class="wallet-btn" id="withdrawBtn">
            <i class="fa-solid fa-arrow-up"></i> Withdraw
          </button>

          <button class="wallet-btn" id="historyBtn">
            <i class="fa-solid fa-clock"></i> History
          </button>
        </div>

      </div>

    </div>
  `;
}

// ===============================
// 🖱️ EVENTS
// ===============================
function initWalletEvents() {

  const topup = document.getElementById("topupBtn");
  const withdraw = document.getElementById("withdrawBtn");
  const history = document.getElementById("historyBtn");

  if (topup) {
    topup.addEventListener("click", () => {
      alert("Top Up coming soon 💰");
    });
  }

  if (withdraw) {
    withdraw.addEventListener("click", () => {
      alert("Withdraw coming soon 💸");
    });
  }

  if (history) {
    history.addEventListener("click", () => {
      alert("Transaction History 📜");
    });
  }
}

// ===============================
// 🚀 INIT
// ===============================
function initWallet() {
  loadWallet();
  initWalletEvents();
}