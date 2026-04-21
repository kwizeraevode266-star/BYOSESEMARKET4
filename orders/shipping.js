import { escapeHtml, isValidPhone, normalizePhone } from './utils.js';
import { validateShippingStep } from './state.js';

const FIELDS = [
  { name: 'firstName', label: 'First name', required: true, autocomplete: 'given-name' },
  { name: 'lastName', label: 'Last name', required: true, autocomplete: 'family-name' },
  { name: 'phone', label: 'Phone number', required: true, autocomplete: 'tel' },
  { name: 'city', label: 'City', required: true, autocomplete: 'address-level2' },
  { name: 'district', label: 'District', required: true, autocomplete: 'address-level1' },
  { name: 'sector', label: 'Sector', required: true, autocomplete: 'address-level3' },
  { name: 'cell', label: 'Cell', required: true, autocomplete: 'address-level4' },
  { name: 'village', label: 'Village', required: true, autocomplete: 'address-line2' },
  { name: 'street', label: 'Street or landmark', required: false, autocomplete: 'street-address' }
];

export const shippingStep = {
  id: 'shipping',
  title: 'Shipping details',
  description: 'Capture the customer destination once and reuse it in payment, summary, and future orders.',
  nextLabel: 'Continue to delivery',
  render(container, context) {
    const { state, actions } = context;

    container.innerHTML = `
      <div class="orders-step-stack">
        <div class="orders-step-intro">
          <span>Saved to the signed-in customer profile when available</span>
          <p>Use the exact address the delivery team should follow. Kigali addresses unlock cash on delivery in the next steps.</p>
        </div>
        <form class="orders-form-grid" novalidate>
          ${FIELDS.map((field) => `
            <label class="orders-field ${field.name === 'street' ? 'orders-field--full' : ''}">
              <span>${escapeHtml(field.label)}${field.required ? ' *' : ''}</span>
              <input
                type="text"
                name="${field.name}"
                value="${escapeHtml(state.shippingAddress[field.name] || '')}"
                autocomplete="${field.autocomplete}"
                placeholder="${escapeHtml(field.label)}"
              >
            </label>
          `).join('')}
        </form>
        <div class="orders-inline-note ${isValidPhone(state.shippingAddress.phone) ? 'is-valid' : ''}">
          <strong>Phone format:</strong> Rwanda numbers are normalized to +250 for admin and delivery records.
          ${state.shippingAddress.phone ? `<span>${escapeHtml(normalizePhone(state.shippingAddress.phone))}</span>` : ''}
        </div>
      </div>
    `;

    container.querySelectorAll('input[name]').forEach((input) => {
      input.addEventListener('input', (event) => {
        const target = event.currentTarget;
        actions.updateShippingField(target.name, target.value);
      });
    });
  },
  validate() {
    return validateShippingStep();
  }
};
