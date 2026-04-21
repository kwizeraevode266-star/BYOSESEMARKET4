import { escapeHtml, formatCurrency } from './utils.js';
import {
  getResolvedCustomerName,
  getStageUrl,
  getState,
  initializeOrderFlow,
  resolveStageAccess,
  setStage,
  submitOrder,
  subscribe,
  updatePaymentDetails,
  validatePaymentStage
} from './state.js';

const ui = {
  progress: document.getElementById('checkoutProgress'),
  sidebar: document.getElementById('checkoutSidebar'),
  form: document.getElementById('paymentForm'),
  message: document.getElementById('paymentMessage'),
  loading: document.getElementById('checkoutLoading')
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
      <span class="orders-sidebar-label">Customer</span>
      <h3>${escapeHtml(getResolvedCustomerName())}</h3>
      <p>${escapeHtml(state.payment.phone || state.shippingAddress.phone || '')}</p>
      <p>${escapeHtml(state.payment.method === 'airtel' ? 'Airtel Money' : 'MTN Mobile Money')}</p>
    </section>
    <section class="orders-sidebar-card">
      <div class="orders-sidebar-heading">
        <h3>Final total</h3>
        <span>${itemCount} item${itemCount === 1 ? '' : 's'}</span>
      </div>
      <div class="orders-total-row"><span>Subtotal</span><strong>${formatCurrency(state.totals.subtotal)}</strong></div>
      <div class="orders-total-row"><span>Delivery fee</span><strong>${formatCurrency(state.totals.shippingFee)}</strong></div>
      <div class="orders-total-row is-total"><span>Total</span><strong>${formatCurrency(state.totals.total)}</strong></div>
    </section>
  `;
}

function syncForm(state) {
  ui.form.querySelectorAll('input[name="method"]').forEach((input) => {
    input.checked = input.value === state.payment.method;
    input.closest('.orders-choice-card')?.classList.toggle('is-selected', input.checked);
  });

  const phoneInput = ui.form.querySelector('input[name="phone"]');
  if (phoneInput) {
    phoneInput.value = state.payment.phone || '';
  }
}

function bindForm() {
  ui.form.querySelectorAll('input[name="method"]').forEach((input) => {
    input.addEventListener('change', (event) => {
      updatePaymentDetails({ method: event.currentTarget.value });
      syncForm(getState());
      renderSidebar(getState());
      setMessage('');
    });
  });

  ui.form.querySelector('input[name="phone"]')?.addEventListener('input', (event) => {
    updatePaymentDetails({ phone: event.currentTarget.value });
    renderSidebar(getState());
    setMessage('');
  });

  ui.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const phoneInput = ui.form.querySelector('input[name="phone"]');
    const methodInput = ui.form.querySelector('input[name="method"]:checked');
    updatePaymentDetails({
      phone: phoneInput?.value || '',
      method: methodInput?.value || 'mtn'
    });

    const validation = validatePaymentStage();
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    setMessage('');
    setStage('payment');
    const result = await submitOrder();
    if (!result.valid) {
      setMessage(result.message || 'Unable to place the order right now.');
      return;
    }

    window.location.assign(result.redirectUrl);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeOrderFlow('payment');
  const access = resolveStageAccess('payment');
  if (!access.valid) {
    window.location.assign(access.redirectUrl);
    return;
  }

  subscribe((state) => {
    ui.loading.hidden = !state.isSubmitting;
  });

  const state = getState();
  renderProgress('payment');
  renderSidebar(state);
  syncForm(state);
  bindForm();
});
