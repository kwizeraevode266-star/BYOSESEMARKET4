// ===============================
// 🔥 PRODUCT MODULE
// ===============================

// Sample Products (later tuzahuza na backend)
const productsData = [
  {
    name: "Wireless Headphones",
    price: "$25",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Smart Watch",
    price: "$40",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Sneakers",
    price: "$30",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Backpack",
    price: "$20",
    image: "https://via.placeholder.com/150"
  }
];

// ===============================
// 🧱 CREATE PRODUCT CARD
// ===============================
function createProductCard(product) {
  return `
    <div class="product-card">

      <img src="${product.image}" alt="${product.name}">

      <h4>${product.name}</h4>

      <p class="price">${product.price}</p>

    </div>
  `;
}

// ===============================
// 📦 LOAD PRODUCTS
// ===============================
function loadProducts() {
  const container = document.getElementById("products");

  if (!container) return;

  container.innerHTML = `
    <div class="products-section">

      <div class="section-header">
        <h3>Recommended</h3>
      </div>

      <div class="products-scroll">
        ${productsData.map(createProductCard).join("")}
      </div>

    </div>
  `;
}

// ===============================
// 🖱️ EVENTS
// ===============================
function initProductEvents() {
  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      alert("Open product: " + productsData[index].name);
    });
  });
}

// ===============================
// 🚀 INIT
// ===============================
function initProducts() {
  loadProducts();
  initProductEvents();
}