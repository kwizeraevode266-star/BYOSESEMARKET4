// ===============================
// 🔥 PROMO BANNER MODULE
// ===============================

// Promo Data
const promoData = [
  {
    title: "Earn Coins",
    desc: "Get rewards every day",
    icon: "fa-coins"
  },
  {
    title: "Super Deals",
    desc: "Up to 50% off",
    icon: "fa-fire"
  }
];

// ===============================
// 🧱 CREATE PROMO CARD
// ===============================
function createPromoCard(promo) {
  return `
    <div class="promo-card">
      
      <div class="promo-icon">
        <i class="fa-solid ${promo.icon}"></i>
      </div>

      <div class="promo-text">
        <h4>${promo.title}</h4>
        <p>${promo.desc}</p>
      </div>

    </div>
  `;
}

// ===============================
// 📦 LOAD PROMO
// ===============================
function loadPromo() {
  const container = document.getElementById("promo");

  if (!container) return;

  container.innerHTML = `
    <div class="promo-section fade-in">

      <div class="grid-2">
        ${promoData.map(createPromoCard).join("")}
      </div>

    </div>
  `;
}

// ===============================
// 🖱️ EVENTS
// ===============================
function initPromoEvents() {
  const cards = document.querySelectorAll(".promo-card");

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      alert("Open " + promoData[index].title);
    });
  });
}

// ===============================
// 🚀 INIT
// ===============================
function initPromo() {
  loadPromo();
  initPromoEvents();
}