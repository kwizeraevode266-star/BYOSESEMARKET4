/* ========================================
   UTILITY FUNCTIONS - Shared Across App
   ======================================== */

const Util = {
  // DOM SELECTION
  select: (selector, parent = document) => parent.querySelector(selector),
  selectAll: (selector, parent = document) => Array.from(parent.querySelectorAll(selector)),

  // FORMATTING
  formatRWF: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  },

  formatPrice: (amount) => {
    if (!amount) return 'RWF 0';
    return 'RWF ' + Math.round(amount).toLocaleString('en-US');
  },

  // STORAGE
  getFromStorage: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage read error:', e);
      return defaultValue;
    }
  },

  setToStorage: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write error:', e);
      return false;
    }
  },

  removeFromStorage: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  // STRING & TEXT
  slugify: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // ARRAYS & OBJECTS
  findInArray: (arr, key, value) => arr.find(item => item[key] === value),

  filterArray: (arr, key, value) => arr.filter(item => item[key] === value),

  sumArray: (arr, key) => arr.reduce((sum, item) => sum + (item[key] || 0), 0),

  // EVENTS
  onEvent: (selector, event, callback, parent = document) => {
    const element = typeof selector === 'string' ? parent.querySelector(selector) : selector;
    if (element) {
      element.addEventListener(event, callback);
    }
  },

  onEventAll: (selector, event, callback, parent = document) => {
    parent.querySelectorAll(selector).forEach(element => {
      element.addEventListener(event, callback);
    });
  },

  // TIME & DATE
  getTimeAgo: (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  },

  // VALIDATION
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidPhone: (phone) => {
    const re = /^[0-9+\-\s()]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 7;
  },

  // NOTIFICATIONS
  showAlert: (message, type = 'info') => {
    const alertId = 'alert-' + Date.now();
    const alertHTML = `
      <div class="alert alert-${type}" id="${alertId}" role="alert">
        <strong>${type.toUpperCase()}:</strong> ${message}
        <button onclick="document.getElementById('${alertId}').remove()" style="float: right; background: none; border: none; cursor: pointer; font-size: 20px; color: inherit;">&times;</button>
      </div>
    `;
    
    const alertContainer = document.querySelector('.alert-container') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = alertHTML;
    alertContainer.insertBefore(alertDiv.firstChild, alertContainer.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      const el = document.getElementById(alertId);
      if (el) el.remove();
    }, 5000);
  },

  showSuccess: (message) => Util.showAlert(message, 'success'),
  showError: (message) => Util.showAlert(message, 'error'),
  showWarning: (message) => Util.showAlert(message, 'warning'),
  showInfo: (message) => Util.showAlert(message, 'info'),

  // LOADING STATE
  setLoadingState: (selector, isLoading = true, loadingText = 'Loading...') => {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!element) return;

    if (isLoading) {
      element.disabled = true;
      element.dataset.originalText = element.textContent;
      element.textContent = loadingText;
      element.classList.add('is-loading');
    } else {
      element.disabled = false;
      element.textContent = element.dataset.originalText || 'Submit';
      element.classList.remove('is-loading');
    }
  },

  // COOKIES
  setCookie: (name, value, days = 7) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/';
  },

  getCookie: (name) => {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) return cookie.substring(nameEQ.length);
    }
    return null;
  },

  deleteCookie: (name) => {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  },

  // DEEP CLONE
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

  // DEBOUNCE
  debounce: (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  // THROTTLE
  throttle: (func, limit = 300) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // SCROLL
  scrollToElement: (selector) => {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  scrollToTop: () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // VISIBILITY
  isElementInViewport: (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // SCREEN SIZE
  getScreenSize: () => {
    if (window.innerWidth <= 640) return 'mobile';
    if (window.innerWidth <= 1024) return 'tablet';
    return 'desktop';
  },

  // RATING DISPLAY
  getStarDisplay: (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push('★');
      } else if (i - rating < 1) {
        stars.push('◆');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  },

  // FETCH WITH ERROR HANDLING
  fetchData: async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  },

  // REDIRECT
  redirect: (url, delay = 0) => {
    if (delay) {
      setTimeout(() => window.location.href = url, delay);
    } else {
      window.location.href = url;
    }
  },

  // URL PARAMETERS
  getUrlParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  getAllUrlParams: () => {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },

  setUrlParam: (param, value) => {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },
};

// Make Util available globally
window.Util = Util;
