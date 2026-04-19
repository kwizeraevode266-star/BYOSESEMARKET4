const categoryCards = document.querySelectorAll(".category-card");
const productsPage = document.getElementById("products-page");
const categoriesPage = document.getElementById("categories-page");
const products = document.querySelectorAll(".product-card");
const categoryTitle = document.getElementById("categoryTitle");
const backBtn = document.getElementById("backBtn");

categoryCards.forEach(card => {
  card.addEventListener("click", () => {
    const selectedCategory = card.dataset.category;

    categoriesPage.classList.add("hidden");
    productsPage.classList.remove("hidden");

    categoryTitle.textContent = card.innerText;

    products.forEach(product => {
      product.style.display =
        product.dataset.category === selectedCategory
          ? "block"
          : "none";
    });
  });
});

backBtn.addEventListener("click", () => {
  productsPage.classList.add("hidden");
  categoriesPage.classList.remove("hidden");
});