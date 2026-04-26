(function () {
  const service = window.orderService;
  const root = document.getElementById('ordersApp');

  if (!service || !root) {
    return;
  }

  const VIEW_CONFIG = {
    pending: {
      label: 'Pending',
      subtitle: 'Awaiting confirmation',
      icon: 'fa-solid fa-hourglass-half'
    },
    shipping: {
      label: 'Shipping',
      subtitle: 'On the way to you',
      icon: 'fa-solid fa-truck-fast'
    },
    delivered: {
      label: 'Delivered',
      subtitle: 'Completed purchases',
      icon: 'fa-solid fa-circle-check'
    },
    returns: {
      label: 'Returns',
      subtitle: 'Returned or refunded orders',
      icon: 'fa-solid fa-rotate-left'
    }
  };

  const TRACKING_STEPS = ['pending', 'confirmed', 'shipping', 'delivered'];
  const view = document.body.dataset.ordersView || 'pending';
  const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="20" fill="%23E9F8F3"/%3E%3Cpath d="M27 62h42v4H27z" fill="%2300B894" fill-opacity=".2"/%3E%3Crect x="29" y="26" width="38" height="28" rx="10" fill="%2300B894" fill-opacity=".18"/%3E%3Cpath d="M39 38h18v4H39zm0 8h12v4H39z" fill="%23008F72"/%3E%3C/svg%3E';

  function formatDate(value) {
    if (!value) {
      return 'No date';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'No date';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getItemSummary(item) {
    const parts = [];
    if (item.size) {
      parts.push(`Size ${item.size}`);
    }
    if (item.color) {
      parts.push(`Color ${item.color}`);
    }
    return parts.join(' • ') || 'Standard option';
  }

  function getTrackingIndex(status) {
    const index = TRACKING_STEPS.indexOf(String(status || '').toLowerCase());
    return index === -1 ? 0 : index;
  }

  function createTimeline(order) {
    if (order.orderStatus === 'cancelled' || order.orderStatus === 'returned') {
      return '';
    }

    const currentIndex = getTrackingIndex(order.orderStatus);
    return `
      <div class="orders-timeline" aria-label="Order tracking progress">
        ${TRACKING_STEPS.map((step, index) => {
          const label = VIEW_CONFIG[step]?.label || (step.charAt(0).toUpperCase() + step.slice(1));
          const state = index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : '';
          return `<div class="orders-timeline-step ${state}">${escapeHtml(label)}</div>`;
        }).join('')}
      </div>
    `;
  }

  function createStatusNav(groups) {
    return Object.entries(VIEW_CONFIG).map(([key, config]) => {
      const count = groups[key]?.length || 0;
      const activeClass = key === view ? 'is-active' : '';
      return `
        <a class="orders-status-link ${activeClass}" href="${escapeHtml(key)}.html">
          <span><i class="${escapeHtml(config.icon)}" aria-hidden="true"></i> ${escapeHtml(config.label)}</span>
          <strong>${count}</strong>
          <small>${escapeHtml(config.subtitle)}</small>
        </a>
      `;
    }).join('');
  }

  function createSummary(groups, allOrders) {
    const totalSpent = allOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    return `
      <div class="orders-summary-card">
        <span>Total orders</span>
        <strong>${allOrders.length}</strong>
      </div>
      <div class="orders-summary-card">
        <span>Awaiting action</span>
        <strong>${(groups.pending || []).length}</strong>
      </div>
      <div class="orders-summary-card">
        <span>Delivered</span>
        <strong>${(groups.delivered || []).length}</strong>
      </div>
      <div class="orders-summary-card">
        <span>Total spent</span>
        <strong>${escapeHtml(service.formatCurrency(totalSpent))}</strong>
      </div>
    `;
  }

  function createOrderCard(order) {
    const firstItem = order.items[0] || {};
    const moreItems = Math.max(0, order.itemCount - Number(firstItem.quantity || 0));
    return `
      <article class="orders-card">
        <img class="orders-card-image" src="${escapeHtml(firstItem.image || FALLBACK_IMAGE)}" alt="${escapeHtml(firstItem.productName || 'Product')} product image">
        <div class="orders-card-main">
          <div class="orders-card-header">
            <div>
              <h2 class="orders-card-title">${escapeHtml(firstItem.productName || 'Product')}</h2>
              <div class="orders-card-subline">
                <span>${escapeHtml(getItemSummary(firstItem))}</span>
                ${moreItems ? `<span>+${moreItems} more item${moreItems === 1 ? '' : 's'}</span>` : ''}
              </div>
            </div>
            <span class="orders-badge" data-tone="${escapeHtml(order.statusTone)}"><i class="${escapeHtml(order.statusIcon)}" aria-hidden="true"></i>${escapeHtml(order.statusLabel)}</span>
          </div>
          <div class="orders-card-meta">
            <span>Qty ${Number(firstItem.quantity || 1)}</span>
            <span>${escapeHtml(service.formatCurrency(firstItem.price || 0))}</span>
            <span>${escapeHtml(order.orderId)}</span>
            <span>${escapeHtml(formatDate(order.createdAt || order.date))}</span>
          </div>
          <div class="orders-card-tracking">${escapeHtml(order.trackingMessage)}</div>
          ${createTimeline(order)}
          <div class="orders-card-actions">
            <a class="orders-action-link" href="../order-details.html?id=${encodeURIComponent(order.orderId)}"><i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i>Track order</a>
          </div>
        </div>
      </article>
    `;
  }

  function createEmptyState(currentUser) {
    const config = VIEW_CONFIG[view] || VIEW_CONFIG.pending;
    if (!currentUser || !(currentUser.id || currentUser.userId)) {
      return `
        <section class="orders-login-state orders-panel">
          <i class="fa-solid fa-user-lock" aria-hidden="true"></i>
          <h2>Sign in to view your orders</h2>
          <p>Your My Orders page only loads orders linked to your account.</p>
          <a class="orders-action-link" href="../../login.html">Go to login</a>
        </section>
      `;
    }

    return `
      <section class="orders-empty-state orders-panel">
        <i class="${escapeHtml(config.icon)}" aria-hidden="true"></i>
        <h2>No ${escapeHtml(config.label.toLowerCase())} orders yet</h2>
        <p>${escapeHtml(config.subtitle)} orders will appear here as soon as your checkout flow creates them or their status changes.</p>
      </section>
    `;
  }

  async function render() {
    const currentUser = service.getCurrentUser();
    const allOrders = await service.getOrders(currentUser?.id || currentUser?.userId || '');
    const groups = service.groupOrders(allOrders);
    const currentOrders = groups[view] || [];
    const config = VIEW_CONFIG[view] || VIEW_CONFIG.pending;

    root.innerHTML = `
      <div class="orders-topbar">
        <a class="orders-back-link" href="../account.html"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>Back to account</a>
        <button class="orders-refresh-button" type="button" id="ordersRefreshButton"><i class="fa-solid fa-rotate" aria-hidden="true"></i>Refresh</button>
      </div>
      <section class="orders-hero">
        <p class="orders-kicker">My Orders</p>
        <h1>${escapeHtml(config.label)}</h1>
        <p>${escapeHtml(config.subtitle)}. Orders are linked to your account and refresh when checkout or admin status updates change shared order storage.</p>
      </section>
      <section class="orders-status-nav">${createStatusNav(groups)}</section>
      <section class="orders-summary-grid">${createSummary(groups, allOrders)}</section>
      <section class="orders-list">${currentOrders.length ? currentOrders.map(createOrderCard).join('') : createEmptyState(currentUser)}</section>
    `;

    document.getElementById('ordersRefreshButton')?.addEventListener('click', render, { once: true });
  }

  let refreshFrame = 0;
  function queueRender() {
    if (refreshFrame) {
      window.cancelAnimationFrame(refreshFrame);
    }
    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = 0;
      render();
    });
  }

  const unsubscribe = service.subscribe(queueRender);
  window.addEventListener('focus', queueRender);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      queueRender();
    }
  });

  window.addEventListener('beforeunload', () => {
    unsubscribe();
  });

  render();
})();