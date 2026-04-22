import {
  STORAGE_KEYS,
  clone,
  createOrderId,
  delay,
  emitCartUpdated,
  formatCurrency,
  getUserAddress,
  isValidPhone,
  normalizePhone,
  persistUserAddress,
  readCartItems,
  readCheckoutConfirmation,
  readCurrentUser,
  readOrderById,
  readDirectCheckout,
  readStorage,
  removeStorage,
  saveCheckoutConfirmation,
  saveOrder,
  writeCartItems,
  writeDirectCheckout,
  writeStorage
} from './utils.js';

export const CHECKOUT_STAGE_URLS = {
  shipping: 'shipping.html',
  checkout: 'checkout.html',
  payment: 'payment.html',
  confirmation: 'confirmation.html'
};

const DELIVERY_FEE = 5000;
const SUBMISSION_DELAY_MS = 700;
const listeners = new Set();

const DEFAULT_SHIPPING_ADDRESS = {
  fullName: '',
  firstName: '',
  lastName: '',
  phone: '',
  provinceCity: '',
  city: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
  street: '',
  note: '',
  latitude: '',
  longitude: '',
  mapLink: '',
  locationAccuracy: '',
  locationCapturedAt: ''
};

const DEFAULT_PAYMENT = {
  paymentType: 'mobile_money',
  method: 'mtn',
  phone: ''
};

const state = {
  initialized: false,
  isSubmitting: false,
  stage: 'shipping',
  source: 'cart',
  products: [],
  customer: {
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: ''
  },
  shippingAddress: clone(DEFAULT_SHIPPING_ADDRESS),
  payment: clone(DEFAULT_PAYMENT),
  confirmation: null,
  totals: {
    subtotal: 0,
    shippingFee: 0,
    codFee: 0,
    total: 0
  }
};

function emit(reason) {
  const snapshot = getState();
  listeners.forEach((listener) => {
    try {
      listener(snapshot, reason);
    } catch (error) {
      console.error('Checkout listener failed:', error);
    }
  });
}

function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function joinFullName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function calculateTotals() {
  const subtotal = state.products.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
  const shippingFee = state.products.length ? DELIVERY_FEE : 0;

  state.totals = {
    subtotal,
    shippingFee,
    codFee: 0,
    total: subtotal + shippingFee
  };
}

function buildCustomerState(user) {
  return {
    id: String(user?.id || '').trim(),
    name: String(user?.name || '').trim(),
    email: String(user?.email || '').trim(),
    phone: normalizePhone(user?.phone || ''),
    avatar: String(user?.avatar || user?.image || '').trim()
  };
}

function buildShippingState(userAddress, draftAddress, customer) {
  const merged = {
    ...clone(DEFAULT_SHIPPING_ADDRESS),
    ...(userAddress || {}),
    ...(draftAddress || {})
  };
  const inferredName = joinFullName(merged.firstName, merged.lastName) || customer.name || '';
  const inferredParts = splitFullName(merged.fullName || inferredName);

  return {
    ...merged,
    fullName: String(merged.fullName || inferredName).trim(),
    firstName: String(merged.firstName || inferredParts.firstName).trim(),
    lastName: String(merged.lastName || inferredParts.lastName).trim(),
    phone: String(merged.phone || customer.phone || '').trim(),
    provinceCity: String(merged.provinceCity || merged.city || '').trim(),
    city: String(merged.city || merged.provinceCity || '').trim(),
    district: String(merged.district || '').trim(),
    sector: String(merged.sector || '').trim(),
    cell: String(merged.cell || '').trim(),
    village: String(merged.village || '').trim(),
    street: String(merged.street || merged.streetLandmark || merged.line1 || '').trim(),
    note: String(merged.note || '').trim(),
    latitude: String(merged.latitude || '').trim(),
    longitude: String(merged.longitude || '').trim(),
    mapLink: String(merged.mapLink || '').trim(),
    locationAccuracy: String(merged.locationAccuracy || '').trim(),
    locationCapturedAt: String(merged.locationCapturedAt || '').trim()
  };
}

function syncProductsToSource() {
  if (state.source === 'direct') {
    const [item] = state.products;
    writeDirectCheckout(item || null);
    return;
  }

  writeCartItems(state.products);
}

function persistDraft() {
  if (!state.products.length) {
    removeStorage(STORAGE_KEYS.draft);
    return;
  }

  writeStorage(STORAGE_KEYS.draft, {
    stage: state.stage,
    source: state.source,
    shippingAddress: state.shippingAddress,
    payment: state.payment,
    products: state.source === 'direct' ? state.products : []
  });
}

function initializeProducts(draft) {
  const directItem = readDirectCheckout();
  if (directItem) {
    state.source = 'direct';
    state.products = [directItem];
    return;
  }

  const cartItems = readCartItems();
  if (cartItems.length) {
    state.source = 'cart';
    state.products = cartItems;
    return;
  }

  if (draft?.source === 'direct' && Array.isArray(draft.products) && draft.products.length) {
    state.source = 'direct';
    state.products = draft.products;
    return;
  }

  state.source = 'cart';
  state.products = [];
}

function normalizeShippingPatch(values) {
  const next = {
    ...state.shippingAddress,
    ...(values || {})
  };
  const fullName = values && Object.prototype.hasOwnProperty.call(values, 'fullName')
    ? values.fullName
    : next.fullName || joinFullName(next.firstName, next.lastName);
  const parts = splitFullName(fullName);

  next.fullName = String(fullName || '').trim();
  next.firstName = String(next.firstName || parts.firstName).trim();
  next.lastName = String(next.lastName || parts.lastName).trim();
  next.phone = String(next.phone || '').trim();
  next.provinceCity = String(next.provinceCity || next.city || '').trim();
  next.city = String(next.city || next.provinceCity || '').trim();
  next.district = String(next.district || '').trim();
  next.sector = String(next.sector || '').trim();
  next.cell = String(next.cell || '').trim();
  next.village = String(next.village || '').trim();
  next.street = String(next.street || next.streetLandmark || '').trim();
  next.note = String(next.note || '').trim();
  next.latitude = String(next.latitude || '').trim();
  next.longitude = String(next.longitude || '').trim();
  next.mapLink = String(next.mapLink || '').trim();
  next.locationAccuracy = String(next.locationAccuracy || '').trim();
  next.locationCapturedAt = String(next.locationCapturedAt || '').trim();

  return next;
}

function buildStoredAddress() {
  return {
    ...clone(state.shippingAddress),
    fullName: getResolvedCustomerName(),
    firstName: state.shippingAddress.firstName,
    lastName: state.shippingAddress.lastName,
    phone: normalizePhone(state.shippingAddress.phone),
    provinceCity: state.shippingAddress.provinceCity || state.shippingAddress.city,
    city: state.shippingAddress.city || state.shippingAddress.provinceCity,
    street: state.shippingAddress.street,
    streetLandmark: state.shippingAddress.street
  };
}

function getPaymentLabel(method) {
  if (method === 'airtel') {
    return 'Airtel Money';
  }

  if (method === 'mtn') {
    return 'MTN Mobile Money';
  }

  return 'Mobile Money';
}

function clearCheckoutSource() {
  if (state.source === 'cart') {
    writeCartItems([]);
  } else {
    removeStorage(STORAGE_KEYS.directCheckout);
  }
}

export function initializeOrderFlow(requestedStage = 'shipping') {
  const user = readCurrentUser();
  const draft = readStorage(STORAGE_KEYS.draft, null);

  initializeProducts(draft);
  state.customer = buildCustomerState(user);
  state.shippingAddress = buildShippingState(getUserAddress(user), draft?.shippingAddress, state.customer);
  state.payment = {
    ...clone(DEFAULT_PAYMENT),
    ...(draft?.payment || {})
  };
  if (!state.payment.phone) {
    state.payment.phone = state.customer.phone || state.shippingAddress.phone || '';
  }

  state.stage = Object.prototype.hasOwnProperty.call(CHECKOUT_STAGE_URLS, draft?.stage)
    ? draft.stage
    : requestedStage;
  state.confirmation = null;
  state.isSubmitting = false;
  state.initialized = true;

  calculateTotals();
  persistDraft();
  emit('initialized');
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return clone(state);
}

export function getStageUrl(stage) {
  return CHECKOUT_STAGE_URLS[stage] || CHECKOUT_STAGE_URLS.shipping;
}

export function setStage(stage) {
  if (!Object.prototype.hasOwnProperty.call(CHECKOUT_STAGE_URLS, stage)) {
    return;
  }

  state.stage = stage;
  persistDraft();
  emit('stage-changed');
}

export function hasProducts() {
  return state.products.length > 0;
}

export function updateProductQuantity(productId, variantKey, quantity) {
  const nextQuantity = Math.max(0, Number(quantity) || 0);
  state.products = state.products
    .map((item) => {
      if (String(item.id) !== String(productId) || String(item.variantKey || '') !== String(variantKey || '')) {
        return item;
      }

      return {
        ...item,
        qty: Math.max(1, nextQuantity),
        total: (Number(item.price) || 0) * Math.max(1, nextQuantity)
      };
    })
    .filter((item) => !(String(item.id) === String(productId) && String(item.variantKey || '') === String(variantKey || '') && nextQuantity === 0));

  syncProductsToSource();
  calculateTotals();
  persistDraft();
  emitCartUpdated();
  emit('products-changed');
}

export function removeProduct(productId, variantKey) {
  state.products = state.products.filter(
    (item) => !(String(item.id) === String(productId) && String(item.variantKey || '') === String(variantKey || ''))
  );

  syncProductsToSource();
  calculateTotals();
  persistDraft();
  emitCartUpdated();
  emit('products-changed');
}

export function updateShippingDetails(values) {
  state.shippingAddress = normalizeShippingPatch(values);
  if (!state.payment.phone && state.shippingAddress.phone) {
    state.payment.phone = state.shippingAddress.phone;
  }
  persistDraft();
  emit('shipping-changed');
}

export function updatePaymentDetails(values) {
  state.payment = {
    ...state.payment,
    ...(values || {})
  };
  state.payment.method = String(state.payment.method || 'mtn').trim() || 'mtn';
  state.payment.phone = String(state.payment.phone || '').trim();

  persistDraft();
  emit('payment-changed');
}

export function validateShippingStage() {
  if (!hasProducts()) {
    return { valid: false, message: 'Add at least one product before starting checkout.' };
  }

  const shipping = normalizeShippingPatch();
  const requiredFields = ['fullName', 'phone', 'provinceCity', 'district', 'sector', 'cell', 'village', 'street'];
  const missingField = requiredFields.find((field) => !String(shipping[field] || '').trim());
  if (missingField) {
    return { valid: false, message: 'Complete the shipping form before continuing to checkout.' };
  }

  if (!isValidPhone(shipping.phone)) {
    return { valid: false, message: 'Enter a valid Rwanda phone number for delivery updates.' };
  }

  return { valid: true };
}

export function validateCheckoutStage() {
  if (!hasProducts()) {
    return { valid: false, message: 'Your order has no products to review.' };
  }

  return validateShippingStage();
}

export function validatePaymentStage() {
  const checkoutValidation = validateCheckoutStage();
  if (!checkoutValidation.valid) {
    return checkoutValidation;
  }

  if (!String(state.payment.method || '').trim()) {
    return { valid: false, message: 'Choose a payment method before placing the order.' };
  }

  if (!isValidPhone(state.payment.phone)) {
    return { valid: false, message: 'Enter the mobile money phone number that will pay for this order.' };
  }

  return { valid: true };
}

export function getResolvedCustomerName() {
  return joinFullName(state.shippingAddress.firstName, state.shippingAddress.lastName)
    || state.shippingAddress.fullName
    || state.customer.name
    || 'Guest Customer';
}

export function resolveStageAccess(stage) {
  if (!hasProducts()) {
    return {
      valid: false,
      redirectUrl: '../shop.html',
      message: 'No products are available for checkout.'
    };
  }

  if (stage === 'shipping') {
    return { valid: true };
  }

  const shippingValidation = validateShippingStage();
  if (!shippingValidation.valid) {
    return {
      valid: false,
      redirectUrl: getStageUrl('shipping'),
      message: shippingValidation.message
    };
  }

  return { valid: true };
}

export function buildOrderPayload() {
  const paymentValidation = validatePaymentStage();
  if (!paymentValidation.valid) {
    return paymentValidation;
  }

  const customerName = getResolvedCustomerName();
  const shippingAddress = buildStoredAddress();
  const order = {
    id: createOrderId(),
    date: new Date().toISOString(),
    createdAt: Date.now(),
    products: clone(state.products),
    customerId: state.customer.id,
    customerName,
    customerEmail: state.customer.email,
    customerPhone: normalizePhone(shippingAddress.phone || state.customer.phone),
    customerImage: state.customer.avatar,
    customer: {
      id: state.customer.id,
      name: customerName,
      email: state.customer.email,
      phone: normalizePhone(shippingAddress.phone || state.customer.phone),
      avatar: state.customer.avatar
    },
    shippingAddress,
    subtotal: state.totals.subtotal,
    shippingFee: state.totals.shippingFee,
    codFee: 0,
    total: state.totals.total,
    deliveryMethod: 'delivery',
    deliveryLabel: 'Standard delivery',
    paymentType: 'Mobile Money',
    paymentMethod: state.payment.method,
    payment: {
      type: 'mobile_money',
      method: state.payment.method,
      payerPhone: normalizePhone(state.payment.phone)
    },
    status: 'Pending'
  };

  return { valid: true, order, customerName };
}

export async function submitOrder() {
  if (state.isSubmitting) {
    return { valid: false, message: 'Order submission is already in progress.' };
  }

  try {
    const prepared = buildOrderPayload();
    if (!prepared.valid) {
      return prepared;
    }

    const { order, customerName } = prepared;

    state.isSubmitting = true;
    emit('submitting-changed');

    saveOrder(order);
    persistUserAddress(order.shippingAddress);
    clearCheckoutSource();
    removeStorage(STORAGE_KEYS.draft);
    emitCartUpdated();

    const confirmation = {
      orderId: order.id,
      customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      codFee: 0,
      placedAt: order.date,
      status: order.status,
      products: clone(order.products),
      shippingAddress: clone(order.shippingAddress),
      deliveryLabel: order.deliveryLabel,
      paymentLabel: getPaymentLabel(order.paymentMethod),
      paymentType: order.paymentType,
      paymentMethod: order.paymentMethod
    };

    saveCheckoutConfirmation(confirmation);
    state.confirmation = confirmation;

    await delay(SUBMISSION_DELAY_MS);

    return {
      valid: true,
      order,
      confirmation,
      redirectUrl: `${getStageUrl('confirmation')}?orderId=${encodeURIComponent(order.id)}`,
      message: `${customerName} order placed for ${formatCurrency(order.total)}.`
    };
  } catch (error) {
    console.error('Checkout submission failed:', error);
    return {
      valid: false,
      message: 'Unable to complete the order right now. Please try again.'
    };
  } finally {
    if (state.isSubmitting) {
      state.isSubmitting = false;
      emit('submitting-changed');
    }
  }
}

export function getConfirmationState(orderId) {
  const savedConfirmation = state.confirmation || readCheckoutConfirmation();
  if (savedConfirmation && (!orderId || String(savedConfirmation.orderId) === String(orderId))) {
    return clone(savedConfirmation);
  }

  const order = readOrderById(orderId);
  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    customerName: order.customerName || order.customer?.name || 'Customer',
    customerPhone: order.customerPhone || order.customer?.phone || order.shippingAddress?.phone || '',
    total: order.total || 0,
    subtotal: order.subtotal || 0,
    shippingFee: order.shippingFee || 0,
    codFee: order.codFee || 0,
    placedAt: order.date || order.createdAt || new Date().toISOString(),
    status: order.status || 'Pending',
    products: clone(order.products || []),
    shippingAddress: clone(order.shippingAddress || {}),
    deliveryLabel: order.deliveryLabel || order.deliveryMethod || 'Standard delivery',
    paymentLabel: getPaymentLabel(order.paymentMethod),
    paymentType: order.paymentType || 'Mobile Money',
    paymentMethod: order.paymentMethod || 'mtn'
  };
}
