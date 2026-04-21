import { escapeHtml, formatCurrency } from './utils.js';

export const confirmationStep = {
  id: 'confirmation',
  title: 'Order confirmed',
  description: 'The order is now available to the admin system and the storefront cart has been updated.',
  render(container, context) {
    const { state } = context;
    const confirmation = state.confirmation;

    container.innerHTML = `
      <div class="orders-confirmation">
        <div class="orders-confirmation-badge">Order sent to admin</div>
        <h2>Checkout completed</h2>
        <p>${escapeHtml(confirmation?.customerName || 'Customer')} order has been saved successfully.</p>
        <div class="orders-confirmation-grid">
          <div>
            <span>Order ID</span>
            <strong>${escapeHtml(confirmation?.orderId || '')}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>${formatCurrency(confirmation?.total || 0)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>${escapeHtml(confirmation?.status || 'Pending')}</strong>
          </div>
          <div>
            <span>Placed at</span>
            <strong>${escapeHtml(new Date(confirmation?.placedAt || Date.now()).toLocaleString())}</strong>
          </div>
        </div>
        <div class="orders-confirmation-actions">
          <a class="orders-link-button" href="../shop.html">Continue shopping</a>
          <a class="orders-secondary-link" href="../admin/orders.html">Open admin orders</a>
        </div>
      </div>
    `;
  },
  validate() {
    return { valid: true };
  }
};
