import { createProductUrl, formatPrice } from './product-data-loader.js';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createCategoryLabel(category) {
  return String(category || 'featured').replace(/(^\w|\s\w)/g, match => match.toUpperCase());
}

function buildCard(product) {
  const name = escapeHtml(product.name);
  const category = escapeHtml(createCategoryLabel(product.category));
  const href = escapeHtml(createProductUrl(product));
  const image = escapeHtml(product.image);
  const badge = product.badge ? `<span class="shop-card-badge">${escapeHtml(product.badge)}</span>` : '';
  const hasOldPrice = Number(product.oldPrice) > Number(product.price);

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
          <span class="shop-card-price">${formatPrice(product.price)}</span>
          ${hasOldPrice ? `<span class="shop-card-old-price">${formatPrice(product.oldPrice)}</span>` : ''}
        </div>
        <div class="shop-card-foot">
          <span class="shop-card-meta">${escapeHtml(product.badge || 'Featured')}</span>
          <a class="shop-card-link" href="${href}">
            <span>View</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </article>
  `;
}

export function renderRelatedProducts(container, products) {
  if (!container) {
    return;
  }

  if (!Array.isArray(products) || !products.length) {
    container.innerHTML = '<div class="related-empty">No related products available right now.</div>';
    return;
  }

  container.innerHTML = products.map(buildCard).join('');
}
