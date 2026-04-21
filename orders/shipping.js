import { escapeHtml, formatCurrency, normalizePhone } from './utils.js';
import {
  getResolvedCustomerName,
  getStageUrl,
  getState,
  initializeOrderFlow,
  resolveStageAccess,
  setStage,
  updateShippingDetails,
  validateShippingStage
} from './state.js';

const ui = {
  progress: document.getElementById('checkoutProgress'),
  sidebar: document.getElementById('checkoutSidebar'),
  form: document.getElementById('shippingForm'),
  message: document.getElementById('shippingMessage')
};

const steps = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'payment', label: 'Payment' }
];

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
      <span class="orders-sidebar-label">Order source</span>
      <h3>${state.source === 'direct' ? 'Buy Now checkout' : 'Cart checkout'}</h3>
      <p>${escapeHtml(getResolvedCustomerName())}</p>
      <p>${escapeHtml(state.shippingAddress.phone ? normalizePhone(state.shippingAddress.phone) : state.customer.phone || '')}</p>
    </section>
    <section class="orders-sidebar-card">
      <div class="orders-sidebar-heading">
        <h3>Order totals</h3>
        <span>${itemCount} item${itemCount === 1 ? '' : 's'}</span>
      </div>
      <div class="orders-total-row"><span>Subtotal</span><strong>${formatCurrency(state.totals.subtotal)}</strong></div>
      <div class="orders-total-row"><span>Delivery fee</span><strong>${formatCurrency(state.totals.shippingFee)}</strong></div>
      <div class="orders-total-row is-total"><span>Total</span><strong>${formatCurrency(state.totals.total)}</strong></div>
    </section>
  `;
}

function syncForm(state) {
  ui.form.querySelectorAll('[name]').forEach((field) => {
    const nextValue = state.shippingAddress[field.name] || '';
    field.value = nextValue;
  });
}

function setMessage(message) {
  ui.message.hidden = !message;
  ui.message.textContent = message || '';
}

function bindForm() {
  ui.form.querySelectorAll('[name]').forEach((field) => {
    field.addEventListener('input', (event) => {
      updateShippingDetails({ [event.currentTarget.name]: event.currentTarget.value });
      renderSidebar(getState());
      setMessage('');
    });
  });

  ui.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(ui.form);
    updateShippingDetails(Object.fromEntries(formData.entries()));
    const validation = validateShippingStage();
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    setStage('checkout');
    window.location.assign(getStageUrl('checkout'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeOrderFlow('shipping');
  const access = resolveStageAccess('shipping');
  if (!access.valid) {
    window.location.assign(access.redirectUrl);
    return;
  }

  const state = getState();
  renderProgress('shipping');
  renderSidebar(state);
  syncForm(state);
  bindForm();
});
