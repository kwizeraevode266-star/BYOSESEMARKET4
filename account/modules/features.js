// ===============================
// 🔥 FEATURES MODULE
// ===============================

// Features Data
const featuresData = [
  {
    title: "Wishlist",
    icon: "fa-heart"
  },
  {
    title: "Coupons",
    icon: "fa-ticket"
  },
  {
    title: "History",
    icon: "fa-clock-rotate-left"
  },
  {
    title: "Stores",
    icon: "fa-store"
  }
];

// ===============================
// 🧱 CREATE FEATURE CARD
// ===============================
function createFeatureCard(feature) {
  return `
    <div class="card feature-card">
      <div class="feature-icon">
        <i class="fa-solid ${feature.icon}"></i>
      </div>

      <p>${feature.title}</p>
    </div>
  `;
}

// ===============================
// 📦 LOAD FEATURES
// ===============================
function loadFeatures() {
  const container = document.getElementById("features");

  if (!container) return;

  container.innerHTML = `
    <div class="features-section">

      <div class="section-header">
        <h3>My Features</h3>
      </div>

      <div class="grid-4">
        ${featuresData.map(createFeatureCard).join("")}
      </div>

    </div>
  `;
}

// ===============================
// 🖱️ EVENTS
// ===============================
function initFeaturesEvents() {
  const cards = document.querySelectorAll(".feature-card");

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      alert("Open " + featuresData[index].title);
    });
  });
}

// ===============================
// 🚀 INIT
// ===============================
function initFeatures() {
  loadFeatures();
  initFeaturesEvents();
}