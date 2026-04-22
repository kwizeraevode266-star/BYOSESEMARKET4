import { escapeHtml, formatCurrency, normalizePhone } from './utils.js';
import {
  getResolvedCustomerName,
  getStageUrl,
  getState,
  initializeOrderFlow,
  resolveStageAccess,
  setStage,
  updateShippingDetails,
  validateShippingStage
} from './state.js';

const ui = {
  progress: document.getElementById('checkoutProgress'),
  sidebar: document.getElementById('checkoutSidebar'),
  form: document.getElementById('shippingForm'),
  message: document.getElementById('shippingMessage'),
  locationStatus: document.getElementById('locationStatus'),
  locationMeta: document.getElementById('locationMeta'),
  locationMapLink: document.getElementById('locationMapLink'),
  detectLocationButton: document.getElementById('detectLocationBtn'),
  refreshLocationButton: document.getElementById('refreshLocationBtn')
};

const steps = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'payment', label: 'Payment' }
];

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
      <span class="orders-sidebar-label">Order source</span>
      <h3>${state.source === 'direct' ? 'Buy Now checkout' : 'Cart checkout'}</h3>
      <p>${escapeHtml(getResolvedCustomerName())}</p>
      <p>${escapeHtml(state.shippingAddress.phone ? normalizePhone(state.shippingAddress.phone) : state.customer.phone || '')}</p>
      <p>${escapeHtml([
        state.shippingAddress.provinceCity || state.shippingAddress.city,
        state.shippingAddress.district,
        state.shippingAddress.sector
      ].filter(Boolean).join(', '))}</p>
    </section>
    <section class="orders-sidebar-card">
      <div class="orders-sidebar-heading">
        <h3>Order totals</h3>
        <span>${itemCount} item${itemCount === 1 ? '' : 's'}</span>
      </div>
      <div class="orders-total-row"><span>Subtotal</span><strong>${formatCurrency(state.totals.subtotal)}</strong></div>
      <div class="orders-total-row"><span>Delivery fee</span><strong>${formatCurrency(state.totals.shippingFee)}</strong></div>
      <div class="orders-total-row is-total"><span>Total</span><strong>${formatCurrency(state.totals.total)}</strong></div>
    </section>
  `;
}

function buildMapLink(latitude, longitude) {
  if (!latitude || !longitude) {
    return '';
  }

  return `https://maps.google.com/?q=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function formatCoordinateLabel(shippingAddress) {
  if (!shippingAddress.latitude || !shippingAddress.longitude) {
    return '';
  }

  return `${shippingAddress.latitude}, ${shippingAddress.longitude}`;
}

function renderLocationState(state, statusText) {
  const shippingAddress = state.shippingAddress || {};
  const mapLink = shippingAddress.mapLink || buildMapLink(shippingAddress.latitude, shippingAddress.longitude);
  const meta = [];

  if (formatCoordinateLabel(shippingAddress)) {
    meta.push(`<span class="orders-location-badge">GPS: ${escapeHtml(formatCoordinateLabel(shippingAddress))}</span>`);
  }

  if (shippingAddress.locationAccuracy) {
    meta.push(`<span class="orders-location-badge">Accuracy: ${escapeHtml(shippingAddress.locationAccuracy)} m</span>`);
  }

  if (shippingAddress.provinceCity || shippingAddress.district) {
    meta.push(`<span class="orders-location-badge">Detected: ${escapeHtml([
      shippingAddress.provinceCity || shippingAddress.city,
      shippingAddress.district
    ].filter(Boolean).join(' / '))}</span>`);
  }

  ui.locationStatus.textContent = statusText || (mapLink
    ? 'Location captured and ready to save with this order.'
    : 'We will ask for permission and store a Google Maps link with the order.');
  ui.locationMeta.innerHTML = meta.join('');

  if (mapLink) {
    ui.locationMapLink.hidden = false;
    ui.locationMapLink.href = mapLink;
  } else {
    ui.locationMapLink.hidden = true;
    ui.locationMapLink.removeAttribute('href');
  }
}

function syncForm(state) {
  ui.form.querySelectorAll('[name]').forEach((field) => {
    const nextValue = state.shippingAddress[field.name] || '';
    field.value = nextValue;
  });

  renderLocationState(state);
}

function setMessage(message) {
  ui.message.hidden = !message;
  ui.message.textContent = message || '';
}

async function reverseGeocode(latitude, longitude) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);
  if (!response.ok) {
    throw new Error('Reverse geocoding failed.');
  }

  const payload = await response.json();
  const address = payload?.address || {};
  const provinceCity = address.city || address.town || address.municipality || address.state || address.region || '';
  const district = address.county || address.state_district || address.city_district || '';
  const sector = address.suburb || address.borough || address.neighbourhood || '';
  const street = address.road || address.pedestrian || address.footway || '';

  return {
    provinceCity: String(provinceCity || '').trim(),
    city: String(provinceCity || '').trim(),
    district: String(district || '').trim(),
    sector: String(sector || '').trim(),
    street: String(street || '').trim()
  };
}

function applyAutoDetectedAddress(detectedAddress) {
  const currentState = getState();
  const currentAddress = currentState.shippingAddress || {};
  const patch = {};

  ['provinceCity', 'city', 'district', 'sector', 'street'].forEach((field) => {
    if (!currentAddress[field] && detectedAddress[field]) {
      patch[field] = detectedAddress[field];
    }
  });

  if (Object.keys(patch).length) {
    updateShippingDetails(patch);
    syncForm(getState());
  }
}

function captureLocation(options = {}) {
  if (!navigator.geolocation) {
    renderLocationState(getState(), 'This device does not support GPS location capture.');
    return;
  }

  const { silent = false } = options;
  renderLocationState(getState(), 'Waiting for location permission and GPS signal...');

  navigator.geolocation.getCurrentPosition(async (position) => {
    const latitude = Number(position.coords.latitude).toFixed(6);
    const longitude = Number(position.coords.longitude).toFixed(6);
    const locationAccuracy = Math.round(Number(position.coords.accuracy || 0));
    const mapLink = buildMapLink(latitude, longitude);

    updateShippingDetails({
      latitude,
      longitude,
      mapLink,
      locationAccuracy: locationAccuracy ? String(locationAccuracy) : '',
      locationCapturedAt: new Date().toISOString()
    });

    try {
      const detectedAddress = await reverseGeocode(latitude, longitude);
      applyAutoDetectedAddress(detectedAddress);
      renderSidebar(getState());
      renderLocationState(getState(), detectedAddress.provinceCity || detectedAddress.district
        ? 'Location captured and nearby address fields were auto-filled where possible.'
        : 'Location captured and saved with the order.');
    } catch (error) {
      console.error(error);
      renderSidebar(getState());
      renderLocationState(getState(), 'Location captured and saved with the order. Address auto-fill was not available.');
    }

    if (!silent) {
      setMessage('');
    }
  }, (error) => {
    console.error(error);
    const denied = error?.code === 1;
    renderLocationState(getState(), denied
      ? 'Location permission was denied. You can continue with the manual address or try again.'
      : 'Unable to capture location right now. Check GPS/network access and try again.');
  }, {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0
  });
}

function bindForm() {
  ui.form.querySelectorAll('[name]').forEach((field) => {
    field.addEventListener('input', (event) => {
      updateShippingDetails({ [event.currentTarget.name]: event.currentTarget.value });
      renderSidebar(getState());
      setMessage('');
    });
  });

  ui.detectLocationButton?.addEventListener('click', () => captureLocation());
  ui.refreshLocationButton?.addEventListener('click', () => captureLocation());

  ui.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(ui.form);
    updateShippingDetails(Object.fromEntries(formData.entries()));
    const validation = validateShippingStage();
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    setStage('checkout');
    window.location.assign(getStageUrl('checkout'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeOrderFlow('shipping');
  const access = resolveStageAccess('shipping');
  if (!access.valid) {
    window.location.assign(access.redirectUrl);
    return;
  }

  const state = getState();
  renderProgress('shipping');
  renderSidebar(state);
  syncForm(state);
  bindForm();
  captureLocation({ silent: true });
});
