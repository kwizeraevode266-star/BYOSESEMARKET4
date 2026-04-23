import { escapeHtml, formatCurrency } from './utils.js';
import {
  getResolvedCustomerName,
  getStageUrl,
  getState,
  initializeOrderFlow,
  resolveStageAccess,
  setStage,
  validateShippingStage
} from './state.js';

const steps = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'payment', label: 'Payment' }
];

const ui = {
  progress: document.getElementById('checkoutProgress'),
  sidebar: document.getElementById('checkoutSidebar'),
  message: document.getElementById('checkoutMessage'),
  content: document.getElementById('checkoutContent')
};

function renderProgress(activeStage) {
  const activeIndex = steps.findIndex((step) => step.id === activeStage);
  ui.progress.innerHTML = steps.map((step, index) => {
    const tone = index < activeIndex ? 'is-complete' : index === activeIndex ? 'is-active' : '';
    return `
      <button type="button" class="orders-progress-step ${tone}" disabled>
        <span>${index + 1}</span>
        <strong>${escapeHtml(step.label)}</strong>
      </button>
    `;
  }).join('');
}

function renderProducts(products) {
  return products.map((item) => `
    <article class="orders-summary-product">
      <img src="${escapeHtml(item.image || item.img || '')}" alt="${escapeHtml(item.name || 'Product')}">
      <div>
        <strong>${escapeHtml(item.name || 'Product')}</strong>
        <p>${escapeHtml(item.attributeSummary || 'Standard option')}</p>
        <span>Qty ${Number(item.qty || 0)} x ${formatCurrency(item.price || 0)}</span>
      </div>
      <strong>${formatCurrency(item.total || ((Number(item.qty || 0) || 0) * (Number(item.price || 0) || 0)))}</strong>
    </article>
  `).join('');
}

function renderSidebar(state) {
  const itemCount = state.products.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  ui.sidebar.innerHTML = `
    <section class="orders-sidebar-card orders-sidebar-card--sticky">
      <span class="orders-sidebar-label">Order summary</span>
      <div class="orders-sidebar-heading">
        <h3>${itemCount} item${itemCount === 1 ? '' : 's'}</h3>
        <span>${escapeHtml(getResolvedCustomerName())}</span>
      </div>
      <div class="orders-summary-product-list orders-summary-product-list--compact">
        ${renderProducts(state.products)}
      </div>
      <div class="orders-total-row"><span>Subtotal</span><strong>${formatCurrency(state.totals.subtotal)}</strong></div>
      <div class="orders-total-row"><span>Shipping</span><strong>${formatCurrency(state.totals.shippingFee)}</strong></div>
      <div class="orders-total-row is-total"><span>Total</span><strong>${formatCurrency(state.totals.total)}</strong></div>
    </section>
  `;
}

function setMessage(message) {
  ui.message.hidden = !message;
  ui.message.textContent = message || '';
}

function renderAddress(state) {
  const address = state.shippingAddress || {};
  const rows = [
    ['Amazina / Full Name', address.fullName],
    ['Telefoni / Phone Number', address.phone],
    ['Intara cyangwa Umujyi / Province or City', address.provinceCity || address.city],
    ['Akarere / District', address.district],
    ['Umurenge / Sector', address.sector],
    ['Akagari / Cell', address.cell],
    ['Umudugudu / Village', address.village],
    ['Ibisobanuro by’inyongera / Optional Note', address.note]
  ].filter(([, value]) => Boolean(value));

  return rows.map(([label, value]) => `
    <div class="orders-review-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function renderContent(state) {
  const mapLink = state.shippingAddress?.mapLink;
  ui.content.innerHTML = `
    <div class="orders-step-stack">
      <section class="orders-review-card">
        <h3>Shipping details</h3>
        <div class="orders-review-list">
          ${renderAddress(state)}
          <div class="orders-review-row">
            <span>GPS</span>
            <strong>${state.shippingAddress?.latitude && state.shippingAddress?.longitude
              ? escapeHtml(`${state.shippingAddress.latitude}, ${state.shippingAddress.longitude}`)
              : 'Not captured'}</strong>
          </div>
        </div>
        ${mapLink ? `<a class="orders-map-link" href="${escapeHtml(mapLink)}" target="_blank" rel="noreferrer noopener">Open Google Maps</a>` : ''}
      </section>

      <section class="orders-review-card">
        <h3>Order review</h3>
        <p>Confirm the delivery address and the products below before moving to payment.</p>
        <div class="orders-summary-product-list">
          ${renderProducts(state.products)}
        </div>
      </section>

      <div class="orders-step-actions">
        <a class="orders-back-button" href="shipping.html">Back to Shipping</a>
        <button type="button" class="orders-next-button" id="continueToPaymentButton">Continue to Payment</button>
      </div>
    </div>
  `;

  ui.content.querySelector('#continueToPaymentButton')?.addEventListener('click', () => {
    const validation = validateShippingStage();
    if (!validation.valid) {
      setMessage(validation.message || 'Complete shipping details before continuing.');
      window.location.assign(getStageUrl('shipping'));
      return;
    }

    setMessage('');
    setStage('payment');
    window.location.assign(getStageUrl('payment'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeOrderFlow('checkout');
  const access = resolveStageAccess('checkout');
  if (!access.valid) {
    window.location.assign(access.redirectUrl);
    return;
  }

  const state = getState();
  renderProgress('checkout');
  renderSidebar(state);
  renderContent(state);
  setMessage('');
});