import { escapeHtml, formatCurrency } from './utils.js';
import {
  getResolvedCustomerName,
  getStageUrl,
  getState,
  initializeOrderFlow,
  removeProduct,
  resolveStageAccess,
  setStage,
  subscribe,
  updateProductQuantity,
  validateCheckoutStage
} from './state.js';

const ui = {
  progress: document.getElementById('checkoutProgress'),
  content: document.getElementById('checkoutContent'),
  message: document.getElementById('checkoutMessage'),
  sidebar: document.getElementById('checkoutSidebar')
};

const steps = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'payment', label: 'Payment' }
];

function setMessage(message) {
  ui.message.hidden = !message;
  ui.message.textContent = message || '';
}

function renderProgress(activeStage) {
  ui.progress.innerHTML = steps.map((step, index) => {
    const activeIndex = steps.findIndex((item) => item.id === activeStage);
    const tone = index < activeIndex ? 'is-complete' : index === activeIndex ? 'is-active' : '';
    return `
      <button type="button" class="orders-progress-step ${tone}" disabled>
        <span>${index + 1}</span>
        <strong>${escapeHtml(step.label)}</strong>
      </button>
    `;
  }).join('');
}

function renderSidebar(state) {
  const itemCount = state.products.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  ui.sidebar.innerHTML = `
    <section class="orders-sidebar-card">
      <span class="orders-sidebar-label">Shipping</span>
      <h3>${escapeHtml(getResolvedCustomerName())}</h3>
      <p>${escapeHtml(state.shippingAddress.phone || state.customer.phone || '')}</p>
      <p>${escapeHtml([
        state.shippingAddress.city,
        state.shippingAddress.district,
        state.shippingAddress.sector,
        state.shippingAddress.street
      ].filter(Boolean).join(', '))}</p>
    </section>
    <section class="orders-sidebar-card">
      <div class="orders-sidebar-heading">
        <h3>Order totals</h3>
        <span>${itemCount} item${itemCount === 1 ? '' : 's'}</span>
      </div>
      <div class="orders-total-row"><span>Subtotal</span><strong>${formatCurrency(state.totals.subtotal)}</strong></div>
      <div class="orders-total-row"><span>Delivery fee</span><strong>${formatCurrency(state.totals.shippingFee)}</strong></div>
      <div class="orders-total-row is-total"><span>Final total</span><strong>${formatCurrency(state.totals.total)}</strong></div>
    </section>
  `;
}

function renderProducts(state) {
  if (!state.products.length) {
    ui.content.innerHTML = `
      <div class="orders-empty-state">
        <h3>No products to review</h3>
        <p>Add products before continuing to payment.</p>
        <a class="orders-link-button" href="../shop.html">Go to shop</a>
      </div>
    `;
    return;
  }

  ui.content.innerHTML = `
    <div class="orders-step-stack">
      <section class="orders-review-card">
        <h3>Shipping summary</h3>
        <p>${escapeHtml(getResolvedCustomerName())}</p>
        <p>${escapeHtml(state.shippingAddress.phone || '')}</p>
        <p>${escapeHtml([
          state.shippingAddress.city,
          state.shippingAddress.district,
          state.shippingAddress.sector,
          state.shippingAddress.street
        ].filter(Boolean).join(', '))}</p>
        ${state.shippingAddress.note ? `<p>${escapeHtml(state.shippingAddress.note)}</p>` : ''}
      </section>
      <div class="orders-cart-list">
        ${state.products.map((item) => `
          <article class="orders-cart-item" data-product-id="${escapeHtml(item.id)}" data-variant-key="${escapeHtml(item.variantKey || '')}">
            <img src="${escapeHtml(item.image || item.img || '')}" alt="${escapeHtml(item.name)}">
            <div class="orders-cart-copy">
              <div class="orders-cart-topline">
                <div>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p>${escapeHtml(item.attributeSummary || 'Standard option')}</p>
                  <span>Price per item: ${formatCurrency(item.price)}</span>
                </div>
                <strong>${formatCurrency(item.total || (item.price * item.qty))}</strong>
              </div>
              <div class="orders-cart-bottomline">
                <div class="orders-inline-actions">
                  <div class="orders-qty-control">
                    <button type="button" data-action="decrease">-</button>
                    <input type="number" min="1" value="${Number(item.qty || 1)}" aria-label="Quantity for ${escapeHtml(item.name)}">
                    <button type="button" data-action="increase">+</button>
                  </div>
                  <button type="button" class="orders-text-button" data-action="apply">Update quantity</button>
                </div>
                <div class="orders-cart-actions">
                  <strong>Total: ${formatCurrency(item.total || (item.price * item.qty))}</strong>
                  <button type="button" class="orders-text-button" data-action="remove">Remove</button>
                </div>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
      <div class="orders-step-actions">
        <a class="orders-back-button" href="shipping.html">Back to Shipping</a>
        <button type="button" class="orders-next-button" id="continueToPaymentButton">Continue to Payment</button>
      </div>
    </div>
  `;

  ui.content.querySelectorAll('.orders-cart-item').forEach((row) => {
    const productId = row.getAttribute('data-product-id') || '';
    const variantKey = row.getAttribute('data-variant-key') || '';
    const quantityInput = row.querySelector('input');
    const readQuantity = () => Math.max(1, Number(quantityInput?.value || 1) || 1);

    row.querySelector('[data-action="decrease"]')?.addEventListener('click', () => {
      updateProductQuantity(productId, variantKey, readQuantity() - 1);
    });

    row.querySelector('[data-action="increase"]')?.addEventListener('click', () => {
      updateProductQuantity(productId, variantKey, readQuantity() + 1);
    });

    row.querySelector('[data-action="apply"]')?.addEventListener('click', () => {
      updateProductQuantity(productId, variantKey, readQuantity());
    });

    row.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      removeProduct(productId, variantKey);
    });
  });

  ui.content.querySelector('#continueToPaymentButton')?.addEventListener('click', () => {
    const validation = validateCheckoutStage();
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    setMessage('');
    setStage('payment');
    window.location.assign(getStageUrl('payment'));
  });
}

function render(state) {
  renderProgress('checkout');
  renderSidebar(state);
  renderProducts(state);
}

document.addEventListener('DOMContentLoaded', () => {
  initializeOrderFlow('checkout');
  const access = resolveStageAccess('checkout');
  if (!access.valid) {
    window.location.assign(access.redirectUrl);
    return;
  }

  subscribe((state) => {
    render(state);
  });

  render(getState());
});
