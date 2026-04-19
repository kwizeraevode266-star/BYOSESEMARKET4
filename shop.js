(function () {
  let currentFilter = "all";

  const VALID_PRODUCT_PAGES = new Set([
    "product-details.html",
    "product-details1.html",
    "product-details2.html"
  ]);

  const grid = document.getElementById("shopProductGrid");
  const resultsSummary = document.getElementById("resultsSummary");
  const filterButtons = Array.from(document.querySelectorAll(".filters button"));

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPrice(value) {
    return `RWF ${Number(value || 0).toLocaleString()}`;
  }

  function getProductHref(product) {
    if (product && product.url) {
      return String(product.url);
    }

    if (product && product.page && VALID_PRODUCT_PAGES.has(String(product.page))) {
      return String(product.page);
    }

    return `product-details.html?id=${encodeURIComponent(product && product.id ? product.id : "")}`;
  }

  function createCategoryLabel(category) {
    return String(category || "general").replace(/(^\w|\s\w)/g, match => match.toUpperCase());
  }

  function buildProductCard(product) {
    const name = escapeHtml(product && product.name);
    const category = escapeHtml(createCategoryLabel(product && product.category));
    const href = escapeHtml(getProductHref(product));
    const image = escapeHtml(product && product.image);
    const badge = product && product.badge ? `<span class="shop-card-badge">${escapeHtml(product.badge)}</span>` : "";
    const meta = escapeHtml((product && product.badge) || "Featured");
    const hasOldPrice = Number(product && product.oldPrice) > Number(product && product.price);

    return `
      <article class="shop-card" aria-label="${name}">
        <a class="shop-card-media" href="${href}" aria-label="View ${name}">
          <img src="${image}" alt="${name}" loading="lazy">
          ${badge}
        </a>

        <div class="shop-card-content">
          <span class="shop-card-category">${category}</span>
          <h3 class="shop-card-title">${name}</h3>

          <div class="shop-card-price-row">
            <span class="shop-card-price">${formatPrice(product && product.price)}</span>
            ${hasOldPrice ? `<span class="shop-card-old-price">${formatPrice(product.oldPrice)}</span>` : ""}
          </div>

          <div class="shop-card-foot">
            <span class="shop-card-meta">${meta}</span>
            <a class="shop-card-link" href="${href}">
              <span>View</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function renderProductGrid(targetGrid, items, emptyMessage) {
    if (!targetGrid) {
      return;
    }

    if (!Array.isArray(items) || !items.length) {
      targetGrid.innerHTML = `<div class="shop-empty">${escapeHtml(emptyMessage || "No products available right now.")}</div>`;
      return;
    }

    targetGrid.innerHTML = items.map(buildProductCard).join("");
  }

  function updateResultsSummary(targetSummary, count, label) {
    if (!targetSummary) {
      return;
    }

    targetSummary.textContent = `${count} items${label ? ` • ${label}` : ""}`;
  }

  function filterProductsByCategory(items, category) {
    if (!Array.isArray(items)) {
      return [];
    }

    if (!category || category === "all") {
      return items;
    }

    return items.filter(product => String(product.category || "").toLowerCase() === String(category).toLowerCase());
  }

  function renderShopPage() {
    if (!grid || !Array.isArray(window.products)) {
      return;
    }

    const filtered = filterProductsByCategory(window.products, currentFilter);
    renderProductGrid(grid, filtered, "No products available in this category right now.");

    const label = currentFilter === "all" ? "All items" : createCategoryLabel(currentFilter);
    updateResultsSummary(resultsSummary, filtered.length, label);
  }

  window.ByoseShop = {
    buildProductCard,
    createCategoryLabel,
    filterProductsByCategory,
    formatPrice,
    getProductHref,
    renderProductGrid,
    updateResultsSummary
  };

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter || "all";

      filterButtons.forEach(item => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      renderShopPage();
    });
  });

  renderShopPage();
})();
