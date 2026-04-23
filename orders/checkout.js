import { escapeHtml, formatCurrency } from './utils.js';
import {
  getResolvedCustomerName,
  getState,
  initializeOrderFlow,
  isCodAvailable,
  resolveStageAccess,
  submitOrder,
  subscribe,
  updatePaymentDetails,
  updateProductQuantity,
  validatePaymentStage,
  validateShippingStage
} from './state.js';

const steps = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'payment', label: 'Payment' }
];

const paymentOptions = [
  {
    id: 'mtn',
    title: 'MTN Mobile Money',
    detail: 'Pay using MTN MoMo with the customer shipping phone.'
  },
  {
    id: 'airtel',
    title: 'Airtel Money',
    detail: 'Use Airtel Money for quick mobile payment confirmation.'
  },
  {
    id: 'bank',
    title: 'Bank Transfer',
    detail: 'Record the transfer and verify it from the admin payment queue.'
  },
  {
    id: 'card',
    title: 'Visa / Mastercard',
    detail: 'Card payment selected for online authorization and verification.'
  },
  {
    id: 'cod',
    title: 'Pay on Delivery',
    detail: 'Available only for addresses whose Province / City contains Kigali.'
  }
];

const ui = {
  progress: document.getElementById('checkoutProgress'),
  sidebar: document.getElementById('checkoutSidebar'),
  message: document.getElementById('checkoutMessage'),
  content: document.getElementById('checkoutContent'),
  loading: document.getElementById('checkoutLoading')
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

function setMessage(message) {
  ui.message.hidden = !message;
  ui.message.textContent = message || '';
}

function getPaymentLabel(method) {
  return paymentOptions.find((option) => option.id === method)?.title || 'Not selected';
}

function getEstimatedDeliveryLabel(state) {
  const city = String(state.shippingAddress?.provinceCity || state.shippingAddress?.city || '').toLowerCase();
  return city.includes('kigali') ? 'Estimated delivery: 1 to 2 business days' : 'Estimated delivery: 2 to 4 business days';
}

function renderShippingSummary(state) {
  const address = state.shippingAddress || {};
  const addressText = [
    address.provinceCity || address.city,
    address.district,
    address.sector,
    address.cell,
    address.village,
    address.note
  ].filter(Boolean).join(', ');

  return `
    <section class="orders-review-card orders-review-card--summary">
      <div class="orders-section-head">
        <div>
          <span class="orders-sidebar-label">Shipping summary</span>
          <h3>${escapeHtml(getResolvedCustomerName())}</h3>
        </div>
        <a class="orders-text-link" href="shipping.html">Change</a>
      </div>
      <div class="orders-review-list">
        <div class="orders-review-row">
          <span>Phone</span>
          <strong>${escapeHtml(address.phone || '')}</strong>
        </div>
        <div class="orders-review-row">
          <span>Address</span>
          <strong>${escapeHtml(addressText || 'Address not available')}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderProductList(state) {
  return `
    <section class="orders-review-card">
      <div class="orders-section-head">
        <div>
          <span class="orders-sidebar-label">Products</span>
          <h3>Review items</h3>
        </div>
      </div>
      <div class="orders-product-list">
        ${state.products.map((item) => `
          <article class="orders-review-product" data-product-id="${escapeHtml(item.id)}" data-variant-key="${escapeHtml(item.variantKey || '')}">
            <img src="${escapeHtml(item.image || item.img || '')}" alt="${escapeHtml(item.name || 'Product')}">
            <div class="orders-review-product-copy">
              <div class="orders-review-product-top">
                <div>
                  <h4>${escapeHtml(item.name || 'Product')}</h4>
                  <p>${escapeHtml(item.attributeSummary || 'Standard option')}</p>
                </div>
                <strong>${formatCurrency(item.price || 0)}</strong>
              </div>
              <div class="orders-review-product-bottom">
                <div class="orders-qty-control">
                  <button type="button" data-action="decrease" aria-label="Decrease quantity">-</button>
                  <input type="number" min="1" value="${Number(item.qty || 1)}" aria-label="Quantity for ${escapeHtml(item.name || 'Product')}">
                  <button type="button" data-action="increase" aria-label="Increase quantity">+</button>
                </div>
                <div class="orders-review-price-stack">
                  <span>Subtotal</span>
                  <strong>${formatCurrency(item.total || ((Number(item.qty || 0) || 0) * (Number(item.price || 0) || 0)))}</strong>
                </div>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderDeliveryInfo(state) {
  return `
    <section class="orders-review-card">
      <div class="orders-section-head">
        <div>
          <span class="orders-sidebar-label">Delivery information</span>
          <h3>Shipping details</h3>
        </div>
      </div>
      <div class="orders-review-list">
        <div class="orders-review-row">
          <span>Delivery fee</span>
          <strong>${formatCurrency(state.totals.shippingFee)}</strong>
        </div>
        <div class="orders-review-row">
          <span>Timing</span>
          <strong>${escapeHtml(getEstimatedDeliveryLabel(state))}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderPaymentMethods(state) {
  const codVisible = isCodAvailable();
  const visibleOptions = paymentOptions.filter((option) => option.id !== 'cod' || codVisible);

  return `
    <section class="orders-review-card">
      <div class="orders-section-head">
        <div>
          <span class="orders-sidebar-label">Payment methods</span>
          <h3>Select one payment method</h3>
        </div>
      </div>
      <div class="orders-payment-grid">
        ${visibleOptions.map((option) => `
          <label class="orders-choice-card ${state.payment.method === option.id ? 'is-selected' : ''}">
            <input type="radio" name="checkoutPaymentMethod" value="${option.id}" ${state.payment.method === option.id ? 'checked' : ''}>
            <div class="orders-payment-card-copy">
              <strong>${escapeHtml(option.title)}</strong>
              <p>${escapeHtml(option.detail)}</p>
            </div>
          </label>
        `).join('')}
      </div>
      ${codVisible ? '' : '<p class="orders-payment-note">Pay on Delivery is hidden because the Province / City from Step 1 does not contain Kigali.</p>'}
    </section>
  `;
}

function renderSidebar(state) {
  const shippingValid = validateShippingStage().valid;
  const paymentValid = validatePaymentStage().valid;
  const isDisabled = state.isSubmitting || !state.products.length || !shippingValid || !paymentValid;
  const itemCount = state.products.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  ui.sidebar.innerHTML = `
    <section class="orders-sidebar-card orders-sidebar-card--sticky orders-order-summary-card">
      <span class="orders-sidebar-label">Order summary</span>
      <div class="orders-sidebar-heading">
        <h3>${itemCount} item${itemCount === 1 ? '' : 's'}</h3>
        <span>${escapeHtml(getPaymentLabel(state.payment.method))}</span>
      </div>
      <div class="orders-total-row">
        <span>Subtotal</span>
        <strong>${formatCurrency(state.totals.subtotal)}</strong>
      </div>
      <div class="orders-total-row">
        <span>Delivery fee</span>
        <strong>${formatCurrency(state.totals.shippingFee)}</strong>
      </div>
      <div class="orders-total-row is-total">
        <span>Total</span>
        <strong>${formatCurrency(state.totals.total)}</strong>
      </div>
      <button type="button" class="orders-next-button orders-place-order-button" id="placeOrderButton" ${isDisabled ? 'disabled' : ''}>
        ${state.isSubmitting ? 'Placing Order...' : 'Place Order'}
      </button>
    </section>
  `;

  ui.sidebar.querySelector('#placeOrderButton')?.addEventListener('click', async () => {
    const shippingValidation = validateShippingStage();
    if (!shippingValidation.valid) {
      setMessage(shippingValidation.message || 'Shipping data is incomplete.');
      window.location.assign('shipping.html');
      return;
    }

    const paymentValidation = validatePaymentStage();
    if (!paymentValidation.valid) {
      setMessage(paymentValidation.message || 'Select a payment method before placing the order.');
      return;
    }

    setMessage('');
    const result = await submitOrder();
    if (!result.valid) {
      setMessage(result.message || 'Unable to place the order right now.');
      return;
    }

    window.location.assign(result.redirectUrl);
  });
}

function renderContent(state) {
  ui.content.innerHTML = `
    <div class="orders-step-stack orders-step-stack--review">
      ${renderShippingSummary(state)}
      ${renderProductList(state)}
      ${renderDeliveryInfo(state)}
      ${renderPaymentMethods(state)}
    </div>
  `;

  ui.content.querySelectorAll('.orders-review-product').forEach((row) => {
    const productId = row.getAttribute('data-product-id') || '';
    const variantKey = row.getAttribute('data-variant-key') || '';
    const input = row.querySelector('input[type="number"]');
    const readQuantity = () => Math.max(1, Number(input?.value || 1) || 1);

    row.querySelector('[data-action="decrease"]')?.addEventListener('click', () => {
      updateProductQuantity(productId, variantKey, readQuantity() - 1);
    });

    row.querySelector('[data-action="increase"]')?.addEventListener('click', () => {
      updateProductQuantity(productId, variantKey, readQuantity() + 1);
    });

    input?.addEventListener('change', () => {
      updateProductQuantity(productId, variantKey, readQuantity());
    });
  });

  ui.content.querySelectorAll('input[name="checkoutPaymentMethod"]').forEach((input) => {
    input.addEventListener('change', (event) => {
      updatePaymentDetails({ method: event.currentTarget.value });
      setMessage('');
    });
  });
}

function render(state) {
  if (!state.products.length) {
    window.location.assign('../cart.html');
    return;
  }

  renderProgress('checkout');
  renderContent(state);
  renderSidebar(state);

  if (ui.loading) {
    ui.loading.hidden = !state.isSubmitting;
  }
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

  setMessage('');
  render(getState());
});