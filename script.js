import { getAllProductContent } from './details/js/product-content.js';

const homeCatalog = getAllProductContent();

function formatCategoryLabel(category) {
  return String(category || 'featured').replace(/(^\w|\s\w)/g, match => match.toUpperCase());
}

window.openProduct = function openProduct(id) {
  window.location.href = `details/product-details1.html?id=${encodeURIComponent(id)}`;
};

document.addEventListener('DOMContentLoaded', () => {
  renderProductGrid('all');
  renderSpotlightGrid();
  setupFilterPills();
  setupCategoryFilters();
  setupHeroSlider();
  setupFooterSubscribe();
});

function currency(value) {
  return `RWF ${Number(value).toLocaleString('en-US')}`;
}

function createProductCard(product) {
  const categoryLabel = formatCategoryLabel(product.category);
  const shortDescription = product.shortDescription || '';
  const oldPrice = Number(product.oldPrice || 0);
  const href = `details/product-details1.html?id=${encodeURIComponent(product.id)}`;

  return `
    <a class="product-card" href="${href}" onclick="openProduct(${JSON.stringify(product.id)}); return false;" aria-label="Reba ${product.name}">
      <div class="product-image-wrap">
        <img src="${product.mainImage}" alt="${product.name}" loading="lazy">
        <span class="product-badge">${product.badge}</span>
      </div>
      <div class="product-content">
        <div class="product-meta">${categoryLabel}</div>
        <h3 class="product-title">${product.name}</h3>
        <div class="product-subtitle">${shortDescription}</div>
        <div class="product-pricing">
          <span class="product-price">${currency(product.price)}</span>
          <span class="product-old-price">${oldPrice > 0 ? currency(oldPrice) : ''}</span>
        </div>
        <div class="product-footer">
          <span class="product-meta">${categoryLabel}</span>
          <span class="tiny-link">Reba</span>
        </div>
      </div>
    </a>
  `;
}

function renderProductGrid(filter) {
  const grid = document.getElementById('homeProductGrid');
  if (!grid) {
    return;
  }

  const items = filter === 'all'
    ? homeCatalog.slice(0, 10)
    : homeCatalog.filter(product => product.category === filter).slice(0, 10);

  grid.innerHTML = items.map(createProductCard).join('');
}

function renderSpotlightGrid() {
  const grid = document.getElementById('spotlightGrid');
  if (!grid) {
    return;
  }

  const spotlightItems = homeCatalog.filter(product => ['phones', 'electronics', 'bags', 'fashion', 'shoes'].includes(product.category)).slice(5, 15);
  grid.innerHTML = spotlightItems.map(createProductCard).join('');
}

function setupFilterPills() {
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(item => item.classList.remove('is-active'));
      pill.classList.add('is-active');
      renderProductGrid(pill.dataset.filter || 'all');
    });
  });
}

function setupCategoryFilters() {
  const cards = document.querySelectorAll('.category-card');
  const homeProducts = document.getElementById('homeProducts');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.dataset.filter || 'all';
      document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('is-active', pill.dataset.filter === filter);
      });
      renderProductGrid(filter);
      if (homeProducts) {
        homeProducts.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupHeroSlider() {
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dotsRoot = document.getElementById('heroDots');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const hero = document.getElementById('heroSection');

  if (!slides.length || !dotsRoot || !hero) {
    return;
  }

  let index = 0;
  let timer = null;

  dotsRoot.innerHTML = slides.map((_, dotIndex) => `
    <button type="button" class="hero-dot${dotIndex === 0 ? ' is-active' : ''}" data-dot-index="${dotIndex}" aria-label="Show slide ${dotIndex + 1}"></button>
  `).join('');

  const dots = Array.from(dotsRoot.querySelectorAll('.hero-dot'));

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(() => show(index + 1), 3500);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      show(Number(dot.dataset.dotIndex || 0));
      start();
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      show(index + 1);
      start();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      show(index - 1);
      start();
    });
  }

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);
  hero.addEventListener('touchstart', stop, { passive: true });
  hero.addEventListener('touchend', start, { passive: true });

  show(0);
  start();
}

function setupFooterSubscribe() {
  const form = document.getElementById('footerSubscribeForm');
  const input = document.getElementById('footerEmail');
  const note = document.getElementById('footerNote');

  if (!form || !input || !note) {
    return;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const email = input.value.trim();
    if (!email || !email.includes('@')) {
      note.textContent = 'Andika email iboneye.';
      note.classList.remove('is-success');
      return;
    }

    try {
      const key = 'byose_market_newsletter_subscribers';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      if (!current.includes(email)) {
        current.push(email);
        localStorage.setItem(key, JSON.stringify(current));
      }
      note.textContent = 'Murakoze. Twakwanditse ku rutonde rwacu.';
      note.classList.add('is-success');
      form.reset();
    } catch (error) {
      note.textContent = 'Ntibyabashije kubika email yawe. Ongera ugerageze.';
      note.classList.remove('is-success');
    }
  });
}