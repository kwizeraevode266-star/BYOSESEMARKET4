const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("searchResults");
const searchParams = new URLSearchParams(window.location.search);
const queryFromUrl = searchParams.get("q") || "";

/* ===== Debounce ===== */
function debounce(func, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/* ===== Render Products ===== */
function renderProducts(items) {
  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML = "";

  if (items.length === 0) {
    resultsContainer.innerHTML = `<div class="no-results">No products found</div>`;
    return;
  }

  items.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <img src="${product.image}" data-id="${product.id}">
      <div class="product-info">
        <h4 data-id="${product.id}">${product.name}</h4>
        <p>$${product.price}</p>
        <button class="add-cart-btn" data-id="${product.id}">
          Add to Cart
        </button>
      </div>
    `;

    resultsContainer.appendChild(card);
  });
}

/* ===== Search Logic ===== */
function searchProducts(query) {
  if (!resultsContainer || typeof products === "undefined" || !Array.isArray(products)) {
    return;
  }

  const term = query.toLowerCase().trim();

  if (!term) {
    resultsContainer.innerHTML = "";
    return;
  }

  const filtered = products.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(term);
    const keywordMatch = product.keywords.some(k =>
      k.toLowerCase().includes(term)
    );
    return nameMatch || keywordMatch;
  });

  renderProducts(filtered);
}

/* ===== Header Redirect ===== */
function goToSearch() {
  if (!searchInput) {
    return;
  }

  const value = searchInput.value.trim();
  if (!value) {
    searchInput.focus();
    return;
  }

  window.location.href = `search.html?q=${encodeURIComponent(value)}`;
}

const isHeaderPreviewSearch = Boolean(
  searchInput && searchInput.closest("#desktopSearchPreview")
);

if (searchBtn && isHeaderPreviewSearch) {
  searchBtn.addEventListener("click", event => {
    event.preventDefault();
    goToSearch();
  });
}

if (searchInput && isHeaderPreviewSearch) {
  searchInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToSearch();
    }
  });
}

/* ===== Search Page State ===== */
if (searchInput && resultsContainer) {
  searchInput.value = queryFromUrl;

  searchInput.addEventListener("input", debounce(event => {
    searchProducts(event.target.value);
  }, 300));

  if (queryFromUrl.trim()) {
    searchProducts(queryFromUrl);
  }
}

/* ===== Click Events ===== */
if (resultsContainer) {
  resultsContainer.addEventListener("click", e => {
  const id = e.target.dataset.id;
  if (!id) return;

  // Open product page
  if (e.target.tagName === "IMG" || e.target.tagName === "H4") {
    window.location.href = `product.html?id=${id}`;
  }

  // Add to cart
  if (e.target.classList.contains("add-cart-btn")) {
    const selected = products.find(p => p.id == id);
    if (selected && typeof addToCart === "function") {
      addToCart(selected);
    }
  }
  });
}

/* ===== Hamburger Menu ===== */
const hamburger = document.getElementById("hamburger");
const nav = document.getElementById("mainNav");

if (hamburger && nav) {
  hamburger.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
}