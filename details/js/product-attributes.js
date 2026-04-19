function resolveAssetPath(path) {
  const value = String(path || '').trim();

  if (!value || /^(?:[a-z]+:|\/|\.\.\/|\.\/)/i.test(value)) {
    return value;
  }

  return `../${value}`;
}

function normalizeOption(option, fallbackStock) {
  if (typeof option === 'string' || typeof option === 'number') {
    return {
      value: String(option),
      label: String(option),
      stock: Number.isFinite(Number(fallbackStock)) ? Math.max(0, Number(fallbackStock)) : Infinity,
      image: ''
    };
  }

  const value = String(option?.value ?? option?.label ?? '').trim();
  const stock = Number(option?.stock);

  return {
    value,
    label: String(option?.label ?? value),
    stock: Number.isFinite(stock)
      ? Math.max(0, stock)
      : Number.isFinite(Number(fallbackStock))
        ? Math.max(0, Number(fallbackStock))
        : Infinity,
    image: resolveAssetPath(option?.image || option?.thumbnail || '')
  };
}

function inferAttributeType(attribute, options) {
  if (attribute?.type === 'image' || attribute?.type === 'text') {
    return attribute.type;
  }

  return options.some(option => option.image) ? 'image' : 'text';
}

export function normalizeProductAttributes(product) {
  const fallbackStock = Number(product?.stock ?? product?.stockCount);
  const rawAttributes = Array.isArray(product?.attributes)
    ? product.attributes
    : Array.isArray(product?.options)
      ? product.options
      : [];

  return rawAttributes
    .map(attribute => {
      const name = String(attribute?.name || '').trim();
      const rawOptions = Array.isArray(attribute?.options)
        ? attribute.options
        : Array.isArray(attribute?.values)
          ? attribute.values
          : [];
      const options = rawOptions
        .map(option => normalizeOption(option, fallbackStock))
        .filter(option => option.value);

      if (!name || !options.length) {
        return null;
      }

      return {
        name,
        type: inferAttributeType(attribute, options),
        required: attribute?.required !== false,
        options
      };
    })
    .filter(Boolean);
}

export function hasConfigurableAttributes(product) {
  return normalizeProductAttributes(product).length > 0;
}

export function getOptionByValue(attribute, value) {
  return attribute?.options?.find(option => String(option.value) === String(value)) || null;
}

export function findMissingRequiredAttributes(attributes, selectedAttributes) {
  return attributes
    .filter(attribute => attribute.required !== false)
    .filter(attribute => !selectedAttributes?.[attribute.name])
    .map(attribute => attribute.name);
}

export function isSelectionComplete(attributes, selectedAttributes) {
  return findMissingRequiredAttributes(attributes, selectedAttributes).length === 0;
}

export function buildAttributeSummary(attributes, selectedAttributes) {
  return attributes
    .map(attribute => selectedAttributes?.[attribute.name])
    .filter(Boolean)
    .join(' • ');
}

export function buildVariantKey(attributes) {
  return Object.entries(attributes || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
}

export function getSelectionStock(product, attributes, selectedAttributes) {
  const productStock = Number(product?.stock ?? product?.stockCount);
  let maxStock = Number.isFinite(productStock) ? Math.max(0, productStock) : Infinity;

  attributes.forEach(attribute => {
    const selectedValue = selectedAttributes?.[attribute.name];
    if (!selectedValue) {
      return;
    }

    const option = getOptionByValue(attribute, selectedValue);
    const optionStock = Number(option?.stock);
    if (Number.isFinite(optionStock)) {
      maxStock = Math.min(maxStock, Math.max(0, optionStock));
    }
  });

  return Number.isFinite(maxStock) ? maxStock : 99;
}

export function createVariantSelection(product, attributes, selectedAttributes, quantity) {
  const normalizedAttributes = Object.fromEntries(
    attributes
      .map(attribute => [attribute.name, selectedAttributes?.[attribute.name]])
      .filter(([, value]) => Boolean(value))
  );
  const variantKey = buildVariantKey(normalizedAttributes);
  const qty = Math.max(0, Number(quantity) || 0);

  return {
    key: variantKey,
    attributes: normalizedAttributes,
    attributeSummary: buildAttributeSummary(attributes, normalizedAttributes),
    qty,
    price: Number(product?.price || 0),
    total: Number(product?.price || 0) * qty,
    maxQty: getSelectionStock(product, attributes, normalizedAttributes)
  };
}

export function getPrimarySelectionImage(product, attributes, selectedAttributes) {
  for (const attribute of attributes) {
    const selectedValue = selectedAttributes?.[attribute.name];
    if (!selectedValue) {
      continue;
    }

    const option = getOptionByValue(attribute, selectedValue);
    if (option?.image) {
      return option.image;
    }
  }

  return product?.mainImage || product?.image || '';
}