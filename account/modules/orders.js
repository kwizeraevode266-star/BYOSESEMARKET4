// ===============================
// 🔥 Orders Module — Upgraded Order Management
// ===============================

(function () {
  const STATUS_KEYS = ["pending", "processing", "shipped", "delivered"];

  // Public API (attach to window for integration)
  async function initOrders(options = {}) {
    const container = document.getElementById(options.containerId || "orders");
    if (!container) return;

    const userId = resolveUserId();

    // fetch orders (try service -> api -> localStorage)
    const orders = await fetchOrders(userId);

    // state
    const state = {
      orders,
      filter: "all"
    };

    renderModule(container, state);
    bindModuleEvents(container, state);
  }

  // Resolve logged-in user id from common storage patterns
  function resolveUserId() {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u && u.id) return u.id;
    } catch (e) {}
    const id = localStorage.getItem("userId") || localStorage.getItem("uid");
    return id || "guest";
  }

  async function fetchOrders(userId) {
    // prefer orderService.getOrders if available
    try {
      if (window.getOrders) {
        return await window.getOrders(userId) || [];
      }
      if (window.getOrderHistory) {
        return await window.getOrderHistory(userId) || [];
      }
      if (window.orderService && typeof window.orderService.getOrders === "function") {
        return await window.orderService.getOrders(userId) || [];
      }
      if (typeof getOrders === "function") {
        return await getOrders(userId) || [];
      }
    } catch (err) {
      console.warn("orderService fetch failed:", err);
    }

    // fallback to localStorage
    try {
      const raw = localStorage.getItem("orders");
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return [];
  }

  // Render module shell
  function renderModule(container, state) {
    container.innerHTML = `
      <div class="oms">
        <div class="oms-header">
          <h3>My Orders</h3>
          <div class="oms-tabs" role="tablist">
            <button class="oms-tab active" data-status="all">All</button>
            <button class="oms-tab" data-status="pending">Pending</button>
            <button class="oms-tab" data-status="processing">Processing</button>
            <button class="oms-tab" data-status="shipped">Shipped</button>
            <button class="oms-tab" data-status="delivered">Delivered</button>
          </div>
        </div>

        <div id="oms-list" class="oms-list"></div>
      </div>
    `;

    // initial render of list
    renderList(container.querySelector("#oms-list"), state.orders, state.filter);
  }

  function bindModuleEvents(container, state) {
    const tabs = container.querySelectorAll(".oms-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const status = tab.dataset.status;
        state.filter = status;
        const list = container.querySelector("#oms-list");
        renderList(list, state.orders, state.filter);
      });
    });

    // delegate clicks on order cards
    container.addEventListener("click", (e) => {
      const card = e.target.closest('.oms-order-card');
      if (!card) return;
      const orderId = card.dataset.orderId;
      const productId = card.dataset.productId;

      // if click on details button or card itself -> open product-details
      if (productId) {
        window.location.href = `../product-details.html?product=${productId}&order=${orderId}`;
      } else if (orderId) {
        window.location.href = `../product-details.html?order=${orderId}`;
      }
    });
  }

  // Render list with filtering and empty state
  function renderList(listEl, orders, filter) {
    const filtered = applyFilter(orders, filter);

    if (!filtered || filtered.length === 0) {
      listEl.innerHTML = `
        <div class="oms-empty">
          <p>No orders yet</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(renderOrderCard).join("");
  }

  function applyFilter(orders, filter) {
    if (!orders) return [];
    if (!filter || filter === "all") return orders.slice().sort(sortByDateDesc);

    return orders.filter(o => mapStatus(o.status) === filter).sort(sortByDateDesc);
  }

  function sortByDateDesc(a, b) {
    return new Date(b.date) - new Date(a.date);
  }

  // Normalize status values to our keys
  function mapStatus(status) {
    if (!status) return "pending";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "pending";
    if (s.includes("process") || s === "processing") return "processing";
    if (s.includes("ship") || s === "shipped") return "shipped";
    if (s.includes("deliver") || s === "delivered" || s === "completed") return "delivered";
    return "pending";
  }

  // Try to use external orderCard renderer if provided, otherwise internal
  function renderOrderCard(order) {
    if (window.renderOrderCard && typeof window.renderOrderCard === "function") {
      return window.renderOrderCard(order);
    }

    // internal rendering
    const statusKey = mapStatus(order.status);
    const img = order.image || (order.items && order.items[0] && order.items[0].image) || "../img/placeholder.png";
    const name = order.title || (order.items && order.items[0] && order.items[0].name) || "Product";
    const qty = order.quantity || (order.items && order.items[0] && order.items[0].qty) || 1;
    const price = order.total || (order.items && order.items[0] && order.items[0].price) || order.price || 0;
    const date = formatDate(order.date);

    return `
      <article class="card oms-order-card ${statusKey}" data-order-id="${order.id || ''}" data-product-id="${(order.items && order.items[0] && order.items[0].id) || ''}">
        <div class="oms-order-left">
          <img src="${img}" alt="${escapeHtml(name)}" class="oms-order-img"/>
        </div>
        <div class="oms-order-main">
          <div class="oms-order-row">
            <h4 class="oms-order-title">${escapeHtml(name)}</h4>
            <span class="oms-order-price">${formatPrice(price)}</span>
          </div>
          <div class="oms-order-row small muted">
            <span>Qty: ${qty}</span>
            <span>Order: ${order.id || '—'}</span>
            <span>${date}</span>
          </div>
          <div class="oms-order-row">
            <div class="oms-status-badge ${statusKey}">${capitalize(statusKey)}</div>
          </div>

          ${renderTrackingTimeline(order)}

        </div>
      </article>
    `;
  }

  // Simple tracking timeline for processing / shipped
  function renderTrackingTimeline(order) {
    const key = mapStatus(order.status);
    if (key === 'pending' || key === 'delivered') return '';

    const stages = [
      { k: 'pending', t: 'Order received' },
      { k: 'processing', t: 'Processing' },
      { k: 'shipped', t: 'Shipped' },
      { k: 'delivered', t: 'Delivered' }
    ];

    const currentIndex = stages.findIndex(s => s.k === key);

    return `
      <div class="oms-tracking">
        ${stages.map((s, i) => `
          <div class="oms-stage ${i <= currentIndex ? 'done' : ''} ${i === currentIndex ? 'current' : ''}">
            <span class="dot"></span>
            <small>${s.t}</small>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Utilities
  function formatDate(d) {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString();
    } catch (e) { return d; }
  }

  function formatPrice(n) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
    } catch (e) { return n; }
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"'`]/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[m];
    });
  }

  // expose public functions
  window.initOrders = initOrders;
  window.refreshOrders = async function () {
    const userId = resolveUserId();
    const orders = await fetchOrders(userId);
    const container = document.getElementById('orders');
    if (!container) return;
    const list = container.querySelector('#oms-list');
    if (list) renderList(list, orders, container.querySelector('.oms-tab.active')?.dataset.status || 'all');
  };

})();