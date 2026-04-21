import {
  getResolvedCustomerName,
  getState,
  initializeCheckoutState,
  nextStep,
  previousStep,
  removeProduct,
  selectDeliveryOption,
  setStep,
  submitOrder,
  subscribe,
  updatePaymentField,
  updateProductQuantity,
  updateShippingField
} from './state.js';
import { cartStep } from './cart.js';
import { shippingStep } from './shipping.js';
import { deliveryStep } from './delivery.js';
import { paymentStep } from './payment.js';
import { summaryStep } from './summary.js';
import { confirmationStep } from './confirmation.js';
import { escapeHtml, formatCurrency } from './utils.js';

const steps = [cartStep, shippingStep, deliveryStep, paymentStep, summaryStep, confirmationStep];

const ui = {
  progress: document.getElementById('checkoutProgress'),
  stepNumber: document.getElementById('stepNumber'),
  stepTitle: document.getElementById('stepTitle'),
  stepDescription: document.getElementById('stepDescription'),
  stepMessage: document.getElementById('stepMessage'),
  stepContent: document.getElementById('stepContent'),
  backButton: document.getElementById('backButton'),
  nextButton: document.getElementById('nextButton'),
  sidebar: document.getElementById('checkoutSidebar'),
  loading: document.getElementById('checkoutLoading')
};

const actions = {
  updateProductQuantity,
  removeProduct,
  updateShippingField,
  selectDeliveryOption,
  updatePaymentField,
  setStep
};

let messageText = '';

function renderProgress(state) {
  ui.progress.innerHTML = steps.slice(0, 6).map((step, index) => {
    const tone = index < state.currentStep ? 'is-complete' : index === state.currentStep ? 'is-active' : '';
    return `
      <button type="button" class="orders-progress-step ${tone}" data-step-index="${index}" ${index === 5 && !state.confirmation ? 'disabled' : ''}>
        <span>${index + 1}</span>
        <strong>${escapeHtml(step.id)}</strong>
      </button>
    `;
  }).join('');

  ui.progress.querySelectorAll('[data-step-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const stepIndex = Number(button.getAttribute('data-step-index'));
      if (!Number.isFinite(stepIndex)) {
        return;
      }

      if (stepIndex <= state.currentStep || (stepIndex === 5 && state.confirmation)) {
        setStep(stepIndex);
      }
    });
  });
}

function renderSidebar(state) {
  const itemCount = state.products.reduce((sum, item) => sum + item.qty, 0);

  ui.sidebar.innerHTML = `
    <section class="orders-sidebar-card">
      <span class="orders-sidebar-label">Customer</span>
      <h3>${escapeHtml(getResolvedCustomerName())}</h3>
      <p>${escapeHtml(state.customer.email || 'Guest checkout')}</p>
      <p>${escapeHtml(state.shippingAddress.phone || state.customer.phone || '')}</p>
    </section>
    <section class="orders-sidebar-card">
      <div class="orders-sidebar-heading">
        <h3>Order totals</h3>
        <span>${itemCount} item${itemCount === 1 ? '' : 's'}</span>
      </div>
      <div class="orders-total-row">
        <span>Subtotal</span>
        <strong>${formatCurrency(state.totals.subtotal)}</strong>
      </div>
      <div class="orders-total-row">
        <span>Shipping</span>
        <strong>${formatCurrency(state.totals.shippingFee)}</strong>
      </div>
      ${state.totals.codFee ? `
        <div class="orders-total-row">
          <span>COD fee</span>
          <strong>${formatCurrency(state.totals.codFee)}</strong>
        </div>
      ` : ''}
      <div class="orders-total-row is-total">
        <span>Total</span>
        <strong>${formatCurrency(state.totals.total)}</strong>
      </div>
    </section>
    <section class="orders-sidebar-card orders-sidebar-card--muted">
      <span class="orders-sidebar-label">Integration</span>
      <p>Orders are saved to the live admin storage key used by the existing dashboard and customer services.</p>
    </section>
  `;
}

function renderStepMessage() {
  if (!messageText) {
    ui.stepMessage.hidden = true;
    ui.stepMessage.textContent = '';
    return;
  }

  ui.stepMessage.hidden = false;
  ui.stepMessage.textContent = messageText;
}

function renderCurrentStep(state) {
  const step = steps[state.currentStep];
  ui.stepNumber.textContent = `Step ${Math.min(state.currentStep + 1, 6)}`;
  ui.stepTitle.textContent = step.title;
  ui.stepDescription.textContent = step.description;
  step.render(ui.stepContent, { state, actions });

  const isConfirmation = state.currentStep === 5;
  ui.backButton.hidden = state.currentStep === 0 || isConfirmation;
  ui.nextButton.hidden = isConfirmation;
  ui.nextButton.textContent = step.nextLabel || 'Continue';
  ui.nextButton.disabled = state.isSubmitting;
  ui.backButton.disabled = state.isSubmitting;
}

function renderLoading(state) {
  ui.loading.hidden = !state.isSubmitting;
}

function render(state) {
  renderProgress(state);
  renderSidebar(state);
  renderStepMessage();
  renderCurrentStep(state);
  renderLoading(state);
}

function bindNavigation() {
  ui.backButton.addEventListener('click', () => {
    messageText = '';
    previousStep();
  });

  ui.nextButton.addEventListener('click', () => {
    const state = getState();
    const step = steps[state.currentStep];
    const validation = typeof step.validate === 'function' ? step.validate(state) : { valid: true };
    if (!validation.valid) {
      messageText = validation.message || 'Complete this step before continuing.';
      render(getState());
      return;
    }

    messageText = '';
    if (state.currentStep === 4) {
      const result = submitOrder();
      if (!result.valid) {
        messageText = result.message || 'Unable to place the order.';
        render(getState());
        return;
      }

      render(getState());
      return;
    }

    nextStep();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeCheckoutState();
  subscribe((state) => {
    render(state);
  });
  bindNavigation();
  render(getState());
});
