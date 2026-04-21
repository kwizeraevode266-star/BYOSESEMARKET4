import { escapeHtml, formatCurrency } from './utils.js';
import { getDeliveryOptions, isCodAvailable, validateDeliveryStep } from './state.js';

export const deliveryStep = {
  id: 'delivery',
  title: 'Delivery method',
  description: 'Choose how the order reaches the customer and update the shipping cost in real time.',
  nextLabel: 'Continue to payment',
  render(container, context) {
    const { state, actions } = context;
    const options = getDeliveryOptions();

    container.innerHTML = `
      <div class="orders-step-stack">
        <div class="orders-step-intro">
          <span>Shipping city: ${escapeHtml(state.shippingAddress.city || 'Not set yet')}</span>
          <p>Select the fulfillment path for this order. The summary panel updates as soon as the choice changes.</p>
        </div>
        <div class="orders-choice-grid">
          ${options.map((option) => `
            <label class="orders-choice-card ${state.delivery.id === option.id ? 'is-selected' : ''}">
              <input type="radio" name="deliveryOption" value="${option.id}" ${state.delivery.id === option.id ? 'checked' : ''}>
              <div>
                <strong>${escapeHtml(option.label)}</strong>
                <p>${escapeHtml(option.description)}</p>
              </div>
              <span>${formatCurrency(option.fee)}</span>
            </label>
          `).join('')}
        </div>
        <div class="orders-inline-note ${isCodAvailable() ? 'is-valid' : ''}">
          <strong>Cash on delivery:</strong>
          ${isCodAvailable()
            ? 'Available because the destination city is Kigali and the order is set for address delivery.'
            : 'Unavailable until the shipping city is Kigali and the order is delivered to the address.'}
        </div>
      </div>
    `;

    container.querySelectorAll('input[name="deliveryOption"]').forEach((input) => {
      input.addEventListener('change', (event) => {
        actions.selectDeliveryOption(event.currentTarget.value);
      });
    });
  },
  validate() {
    return validateDeliveryStep();
  }
};
