import {
  STORAGE_KEYS,
  clone,
  createOrderId,
  emitCartUpdated,
  formatCurrency,
  getUserAddress,
  isValidPhone,
  normalizePhone,
  persistUserAddress,
  readCartItems,
  readCurrentUser,
  readDirectCheckout,
  readStorage,
  removeStorage,
  saveOrder,
  writeCartItems,
  writeDirectCheckout,
  writeStorage
} from './utils.js';

const DELIVERY_OPTIONS = [
  {
    id: 'delivery',
    label: 'Delivery to address',
    description: 'Ship the full order to the address provided in the shipping step.',
    fee: 5000
  },
  {
    id: 'pickup',
    label: 'Store pickup',
    description: 'Pick up the order directly from the store with no delivery fee.',
    fee: 0
  }
];

const DEFAULT_ADDRESS = {
  firstName: '',
  lastName: '',
  phone: '',
  city: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
  street: ''
};

const DEFAULT_PAYMENT = {
  paymentType: 'pay_now',
  method: '',
  payerPhone: '',
  transactionId: ''
};

const COD_FEE = 2000;
const listeners = new Set();

const state = {
  initialized: false,
  isSubmitting: false,
  currentStep: 0,
  source: 'cart',
  products: [],
  customer: {
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: ''
  },
  shippingAddress: clone(DEFAULT_ADDRESS),
  delivery: clone(DELIVERY_OPTIONS[0]),
  payment: clone(DEFAULT_PAYMENT),
  confirmation: null,
  totals: {
    subtotal: 0,
    shippingFee: DELIVERY_OPTIONS[0].fee,
    codFee: 0,
    total: DELIVERY_OPTIONS[0].fee
  }
};

function emit(reason) {
  const snapshot = getState();
  listeners.forEach((listener) => listener(snapshot, reason));
}

function calculateTotals() {
  const subtotal = state.products.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
  const shippingFee = state.products.length ? Number(state.delivery.fee || 0) : 0;
  const codFee = state.payment.paymentType === 'cod' ? COD_FEE : 0;

  state.totals = {
    subtotal,
    shippingFee,
    codFee,
    total: subtotal + shippingFee + codFee
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

function mergeAddress(base, override) {
  return {
    ...clone(DEFAULT_ADDRESS),
    ...(base || {}),
    ...(override || {})
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
  if (state.currentStep === 5 || !state.products.length) {
    removeStorage(STORAGE_KEYS.draft);
    return;
  }

  writeStorage(STORAGE_KEYS.draft, {
    currentStep: state.currentStep,
    source: state.source,
    shippingAddress: state.shippingAddress,
    delivery: { id: state.delivery.id },
    payment: state.payment,
    products: state.source === 'direct' ? state.products : []
  });
}

function ensureValidPaymentType() {
  if (!isCodAvailable() && state.payment.paymentType === 'cod') {
    state.payment.paymentType = 'pay_now';
  }

  calculateTotals();
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

export function initializeCheckoutState() {
  const user = readCurrentUser();
  const draft = readStorage(STORAGE_KEYS.draft, null);
  initializeProducts(draft);

  state.customer = buildCustomerState(user);

  const userAddress = getUserAddress(user);
  state.shippingAddress = mergeAddress(userAddress, draft?.shippingAddress);
  if (!state.shippingAddress.phone && state.customer.phone) {
    state.shippingAddress.phone = state.customer.phone;
  }

  const requestedDeliveryId = draft?.delivery?.id;
  state.delivery = clone(DELIVERY_OPTIONS.find((option) => option.id === requestedDeliveryId) || DELIVERY_OPTIONS[0]);

  state.payment = {
    ...clone(DEFAULT_PAYMENT),
    ...(draft?.payment || {})
  };

  if (!state.payment.payerPhone && state.customer.phone) {
    state.payment.payerPhone = state.customer.phone;
  }

  state.currentStep = Math.max(0, Math.min(Number(draft?.currentStep || 0), 4));
  state.confirmation = null;
  state.isSubmitting = false;
  state.initialized = true;

  ensureValidPaymentType();
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

export function getDeliveryOptions() {
  return clone(DELIVERY_OPTIONS);
}

export function isCodAvailable() {
  return state.delivery.id === 'delivery' && String(state.shippingAddress.city || '').trim().toLowerCase() === 'kigali';
}

export function setStep(stepIndex) {
  state.currentStep = Math.max(0, Math.min(stepIndex, state.confirmation ? 5 : 4));
  persistDraft();
  emit('step-changed');
}

export function nextStep() {
  setStep(state.currentStep + 1);
}

export function previousStep() {
  setStep(state.currentStep - 1);
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

export function updateShippingField(field, value) {
  state.shippingAddress = {
    ...state.shippingAddress,
    [field]: value
  };

  ensureValidPaymentType();
  persistDraft();
  emit('shipping-changed');
}

export function selectDeliveryOption(optionId) {
  state.delivery = clone(DELIVERY_OPTIONS.find((option) => option.id === optionId) || DELIVERY_OPTIONS[0]);
  ensureValidPaymentType();
  persistDraft();
  emit('delivery-changed');
}

export function updatePaymentField(field, value) {
  state.payment = {
    ...state.payment,
    [field]: value
  };

  ensureValidPaymentType();
  persistDraft();
  emit('payment-changed');
}

export function validateCartStep() {
  if (!state.products.length) {
    return { valid: false, message: 'Your cart is empty. Add products before checking out.' };
  }

  return { valid: true };
}

export function validateShippingStep() {
  const requiredFields = ['firstName', 'lastName', 'phone', 'city', 'district', 'sector', 'cell', 'village'];
  const missing = requiredFields.find((field) => !String(state.shippingAddress[field] || '').trim());
  if (missing) {
    return { valid: false, message: 'Complete all required shipping fields before continuing.' };
  }

  if (!isValidPhone(state.shippingAddress.phone)) {
    return { valid: false, message: 'Enter a valid Rwanda phone number for delivery updates.' };
  }

  persistUserAddress({
    ...state.shippingAddress,
    phone: normalizePhone(state.shippingAddress.phone)
  });

  return { valid: true };
}

export function validateDeliveryStep() {
  if (!DELIVERY_OPTIONS.some((option) => option.id === state.delivery.id)) {
    return { valid: false, message: 'Select a delivery option before continuing.' };
  }

  return { valid: true };
}

export function validatePaymentStep() {
  if (state.payment.paymentType === 'cod') {
    if (!isCodAvailable()) {
      return { valid: false, message: 'Cash on delivery is only available for Kigali address deliveries.' };
    }

    return { valid: true };
  }

  if (!state.payment.method) {
    return { valid: false, message: 'Choose the mobile money method the customer used to pay.' };
  }

  if (!isValidPhone(state.payment.payerPhone)) {
    return { valid: false, message: 'Enter the payer phone number used for the transaction.' };
  }

  return { valid: true };
}

export function getResolvedCustomerName() {
  const shippingName = [state.shippingAddress.firstName, state.shippingAddress.lastName].filter(Boolean).join(' ').trim();
  return shippingName || state.customer.name || 'Guest Customer';
}

export function submitOrder() {
  const shippingValidation = validateShippingStep();
  if (!shippingValidation.valid) {
    return shippingValidation;
  }

  const paymentValidation = validatePaymentStep();
  if (!paymentValidation.valid) {
    return paymentValidation;
  }

  state.isSubmitting = true;
  emit('submitting-changed');

  const customerName = getResolvedCustomerName();
  const order = {
    id: createOrderId(),
    date: new Date().toISOString(),
    createdAt: Date.now(),
    products: clone(state.products),
    customerId: state.customer.id,
    customerName,
    customerEmail: state.customer.email,
    customerPhone: normalizePhone(state.shippingAddress.phone || state.customer.phone),
    customerImage: state.customer.avatar,
    customer: {
      id: state.customer.id,
      name: customerName,
      email: state.customer.email,
      phone: normalizePhone(state.shippingAddress.phone || state.customer.phone),
      avatar: state.customer.avatar
    },
    shippingAddress: {
      ...clone(state.shippingAddress),
      phone: normalizePhone(state.shippingAddress.phone)
    },
    subtotal: state.totals.subtotal,
    shippingFee: state.totals.shippingFee,
    codFee: state.totals.codFee,
    total: state.totals.total,
    deliveryMethod: state.delivery.id,
    deliveryLabel: state.delivery.label,
    paymentType: state.payment.paymentType,
    paymentMethod: state.payment.paymentType === 'cod' ? 'cod' : state.payment.method,
    payment: {
      type: state.payment.paymentType,
      method: state.payment.paymentType === 'cod' ? 'cod' : state.payment.method,
      payerPhone: normalizePhone(state.payment.payerPhone),
      transactionId: String(state.payment.transactionId || '').trim()
    },
    status: state.payment.paymentType === 'cod' ? 'Pending Delivery (COD)' : 'Pending Payment Verification'
  };

  saveOrder(order);
  persistUserAddress(order.shippingAddress);

  if (state.source === 'cart') {
    writeCartItems([]);
  } else {
    removeStorage(STORAGE_KEYS.directCheckout);
  }

  removeStorage(STORAGE_KEYS.draft);
  emitCartUpdated();

  state.confirmation = {
    orderId: order.id,
    customerName,
    total: state.totals.total,
    placedAt: order.date,
    status: order.status
  };
  state.currentStep = 5;
  state.isSubmitting = false;
  emit('order-submitted');

  return { valid: true, order, message: `${customerName} order placed for ${formatCurrency(state.totals.total)}.` };
}
