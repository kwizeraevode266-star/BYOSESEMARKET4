// ===============================
// 🔔 Notifications Module (Upgraded)
// - Real-time (simulated), interactive, and modular
// - Integrates with notificationService.js and AppState
// ===============================

;(function () {
  const DEFAULT_TYPES = ["order", "system", "promo"];

  // Internal store
  let notifications = [];
  let unreadCount = 0;
  let realtimeTimer = null;

  // DOM IDs / selectors
  const DROPDOWN_ID = "notificationsDropdown";
  const LIST_ID = "notificationsList";
  const BADGE_ID = "notificationCount";
  const TOGGLE_ID = "notificationBtn";

  // Helpers
  function uid() {
    return 'n_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }

  function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff} sec${diff === 1 ? '' : 's'} ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m} min${m === 1 ? '' : 's'} ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`;
    const d = Math.floor(h / 24);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  }

  function iconForType(type) {
    switch (type) {
      case 'order': return 'fa-box';
      case 'promo': return 'fa-tags';
      default: return 'fa-bell';
    }
  }

  function updateBadge() {
    const badge = document.getElementById(BADGE_ID);
    if (!badge) return;
    badge.innerText = unreadCount > 0 ? unreadCount : '';
    badge.classList.toggle('has-unread', unreadCount > 0);
  }

  function renderDropdown() {
    // Ensure single dropdown
    let dropdown = document.getElementById(DROPDOWN_ID);
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = DROPDOWN_ID;
      dropdown.className = 'notifications-dropdown hidden';
      dropdown.innerHTML = `
        <div class="nd-header">
          <strong>Notifications</strong>
          <button class="nd-clear" id="notifClearAll">Clear all</button>
        </div>
        <div class="nd-list" id="${LIST_ID}"></div>
      `;

      // Basic styles (lightweight) to avoid breaking layout
      dropdown.style.position = 'absolute';
      dropdown.style.right = '16px';
      dropdown.style.top = '56px';
      dropdown.style.width = '360px';
      dropdown.style.maxHeight = '420px';
      dropdown.style.overflow = 'auto';
      dropdown.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      dropdown.style.borderRadius = '8px';
      dropdown.style.background = '#fff';
      dropdown.style.zIndex = 2000;

      document.body.appendChild(dropdown);

      // Clear all
      dropdown.querySelector('#notifClearAll').addEventListener('click', (e) => {
        e.stopPropagation();
        clearAllNotifications(true);
      });
    }

    renderList();
  }

  function renderList() {
    const list = document.getElementById(LIST_ID);
    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = `<div class="nd-empty">No notifications yet</div>`;
      return;
    }

    list.innerHTML = notifications.map(n => createItemHTML(n)).join('');

    // Attach item listeners (event delegation)
    list.querySelectorAll('.nd-item').forEach(el => {
      const id = el.getAttribute('data-id');

      el.addEventListener('click', (ev) => {
        // Prevent clicks on action buttons from triggering navigation
        if (ev.target.closest('.nd-action')) return;
        handleNotificationClick(id);
      });

      const del = el.querySelector('.nd-delete');
      if (del) del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        deleteNotification(id, true);
      });
    });
  }

  function createItemHTML(n) {
    const unreadClass = n.status === 'unread' ? 'nd-unread' : '';
    const dot = n.status === 'unread' ? '<span class="nd-dot" aria-hidden="true"></span>' : '';

    return `
      <div class="nd-item ${unreadClass}" data-id="${n.id}">
        <div class="nd-left">
          <i class="fa ${iconForType(n.type)} nd-icon"></i>
        </div>
        <div class="nd-body">
          <div class="nd-message">${n.message}</div>
          <div class="nd-meta">${timeAgo(n.time)} ${dot}</div>
        </div>
        <div class="nd-actions nd-action">
          <button class="nd-delete" title="Delete"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    `;
  }

  // Core behaviors
  async function handleNotificationClick(id) {
    const n = notifications.find(x => x.id === id);
    if (!n) return;

    if (n.status === 'unread') {
      n.status = 'read';
      unreadCount = Math.max(0, unreadCount - 1);
      updateBadge();
      renderList();

      // try to call backend markAsRead if available
      if (typeof markAsRead === 'function') {
        markAsRead(id).catch(() => {});
      }
    }

    // navigate based on type
    if (n.type === 'order' && n.link) {
      window.location.href = n.link;
      return;
    }

    if (n.type === 'promo' && n.link) {
      window.location.href = n.link;
      return;
    }

    if (n.type === 'system') {
      // show modal or expand inline; for now show a lightweight alert modal
      showSystemModal(n);
    }
  }

  function showSystemModal(n) {
    alert(n.message);
  }

  async function deleteNotification(id, updateBackend = false) {
    const idx = notifications.findIndex(x => x.id === id);
    if (idx === -1) return;

    const wasUnread = notifications[idx].status === 'unread';
    notifications.splice(idx, 1);
    if (wasUnread) unreadCount = Math.max(0, unreadCount - 1);
    renderList();
    updateBadge();

    if (updateBackend && typeof deleteNotification === 'function') {
      try {
        await window.deleteNotification(id);
      } catch (e) {}
    }
  }

  async function clearAllNotifications(remote = false) {
    notifications = [];
    unreadCount = 0;
    renderList();
    updateBadge();

    // remote clear not implemented in service; if available call it
    if (remote && typeof clearAll === 'function') {
      try { await clearAll(); } catch (e) {}
    }
  }

  // Public API used by simulated realtime or external service
  function addNotification({ id, message, type = 'system', time = new Date(), status = 'unread', link = '' }) {
    const notification = {
      id: id || uid(),
      message,
      type: DEFAULT_TYPES.includes(type) ? type : 'system',
      time: new Date(time).toISOString(),
      status,
      link
    };

    notifications.unshift(notification);
    if (notification.status === 'unread') unreadCount += 1;

    // animate insert by re-rendering
    renderList();
    updateBadge();
    // subtle animation
    const list = document.getElementById(LIST_ID);
    if (list && list.firstElementChild) {
      list.firstElementChild.style.transform = 'translateY(-6px)';
      list.firstElementChild.style.opacity = '0';
      requestAnimationFrame(() => {
        list.firstElementChild.style.transition = 'all 260ms ease';
        list.firstElementChild.style.transform = 'translateY(0)';
        list.firstElementChild.style.opacity = '1';
      });
    }
  }

  // Initialize: load from service if available, else use simulated data
  async function initNotifications() {
    renderDropdown();

    // hook toggle
    const toggle = document.getElementById(TOGGLE_ID);
    if (toggle) {
      toggle.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const dd = document.getElementById(DROPDOWN_ID);
        if (!dd) return;
        dd.classList.toggle('hidden');
      });
    }

    // close on outside click
    document.addEventListener('click', (ev) => {
      const dd = document.getElementById(DROPDOWN_ID);
      if (!dd) return;
      if (!ev.target.closest('#' + DROPDOWN_ID) && !ev.target.closest('#' + TOGGLE_ID)) {
        dd.classList.add('hidden');
      }
    });

    // try to fetch from backend service
    try {
      const user = (typeof getState === 'function') ? getState().user : null;
      if (user && typeof getNotifications === 'function') {
        const serverNotifs = await getNotifications(user.id || user.userId || user.uid);
        if (Array.isArray(serverNotifs) && serverNotifs.length) {
          // normalize
          serverNotifs.forEach(s => {
            addNotification({
              id: s.id,
              message: s.message || s.title || 'Notification',
              type: s.type || 'system',
              time: s.time || s.createdAt || new Date(),
              status: s.status || 'unread',
              link: s.link || ''
            });
          });
        }
      }
    } catch (e) {
      console.warn('Notification fetch failed:', e);
    }

    // If no notifications loaded, show friendly empty state (list renderer does this)

    // start simulated realtime updates (safe if notificationsService provides real-time instead)
    startSimulatedRealtime();
  }

  // Simulated real-time: adds a random notification every 25-45s
  function startSimulatedRealtime() {
    if (realtimeTimer) return;
    function tick() {
      const types = ['order','promo','system'];
      const t = types[Math.floor(Math.random()*types.length)];
      const sample = {
        message: t === 'order' ? 'Order #'+Math.floor(Math.random()*9000)+' status updated' : (t === 'promo' ? 'Limited-time offer: 20% off' : 'System message: Maintenance scheduled'),
        type: t,
        time: new Date().toISOString(),
        status: 'unread',
        link: t === 'order' ? 'order-details.html?id='+Math.floor(Math.random()*9000) : (t === 'promo' ? '../product-details.html?id='+Math.floor(Math.random()*9000) : '')
      };
      addNotification(sample);

      // schedule next
      const next = 25000 + Math.floor(Math.random()*20000);
      realtimeTimer = setTimeout(tick, next);
    }

    // initial start after short delay
    realtimeTimer = setTimeout(tick, 8000);
  }

  function stopSimulatedRealtime() {
    if (realtimeTimer) clearTimeout(realtimeTimer);
    realtimeTimer = null;
  }

  // expose API to window for other modules (header, tests, services)
  window.NotificationsModule = {
    init: initNotifications,
    add: addNotification,
    delete: deleteNotification,
    clearAll: clearAllNotifications,
    stopRealtime: stopSimulatedRealtime
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
  } else {
    initNotifications();
  }

})();