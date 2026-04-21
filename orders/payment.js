import { PAYMENT_ACCOUNTS, escapeHtml } from './utils.js';
import { isCodAvailable, validatePaymentStep } from './state.js';

export const paymentStep = {
  id: 'payment',
  title: 'Payment setup',
  description: 'Record how the customer will pay so the admin order queue receives the right payment status.',
  nextLabel: 'Continue to summary',
  render(container, context) {
    const { state, actions } = context;
    const codAvailable = isCodAvailable();

    container.innerHTML = `
      <div class="orders-step-stack">
        <div class="orders-choice-grid orders-choice-grid--compact">
          <label class="orders-choice-card ${state.payment.paymentType === 'pay_now' ? 'is-selected' : ''}">
            <input type="radio" name="paymentType" value="pay_now" ${state.payment.paymentType === 'pay_now' ? 'checked' : ''}>
            <div>
              <strong>Pay now</strong>
              <p>Customer pays with mobile money and the admin team verifies the transaction.</p>
            </div>
          </label>
          <label class="orders-choice-card ${state.payment.paymentType === 'cod' ? 'is-selected' : ''} ${codAvailable ? '' : 'is-disabled'}">
            <input type="radio" name="paymentType" value="cod" ${state.payment.paymentType === 'cod' ? 'checked' : ''} ${codAvailable ? '' : 'disabled'}>
            <div>
              <strong>Cash on delivery</strong>
              <p>Available only for Kigali address deliveries. Adds an extra RWF 2,000 handling fee.</p>
            </div>
          </label>
        </div>
        ${state.payment.paymentType === 'pay_now' ? `
          <div class="orders-payment-panel">
            <div class="orders-choice-grid">
              ${PAYMENT_ACCOUNTS.map((account) => `
                <label class="orders-choice-card ${state.payment.method === account.id ? 'is-selected' : ''}">
                  <input type="radio" name="paymentMethod" value="${account.id}" ${state.payment.method === account.id ? 'checked' : ''}>
                  <div>
                    <strong>${escapeHtml(account.label)}</strong>
                    <p>${escapeHtml(account.accountName)}<br>${escapeHtml(account.number)}</p>
                  </div>
                </label>
              `).join('')}
            </div>
            <div class="orders-form-grid orders-form-grid--two">
              <label class="orders-field">
                <span>Payer phone *</span>
                <input type="text" name="payerPhone" value="${escapeHtml(state.payment.payerPhone || '')}" placeholder="07XXXXXXXX">
              </label>
              <label class="orders-field">
                <span>Transaction ID</span>
                <input type="text" name="transactionId" value="${escapeHtml(state.payment.transactionId || '')}" placeholder="Optional reference">
              </label>
            </div>
          </div>
        ` : `
          <div class="orders-inline-note is-valid">
            <strong>COD enabled:</strong> Admin receives this order with a pending delivery cash collection status.
          </div>
        `}
      </div>
    `;

    container.querySelectorAll('input[name="paymentType"]').forEach((input) => {
      input.addEventListener('change', (event) => {
        actions.updatePaymentField('paymentType', event.currentTarget.value);
      });
    });

    container.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
      input.addEventListener('change', (event) => {
        actions.updatePaymentField('method', event.currentTarget.value);
      });
    });

    container.querySelectorAll('input[name="payerPhone"], input[name="transactionId"]').forEach((input) => {
      input.addEventListener('input', (event) => {
        const target = event.currentTarget;
        actions.updatePaymentField(target.name, target.value);
      });
    });
  },
  validate() {
    return validatePaymentStep();
  }
};
