(function (global) {
	"use strict";

	const STORAGE_KEY = "byose_market_products_catalog_v1";
	const EVENT_NAME = "byose:products-changed";
	const FALLBACK_IMAGE = "img/logo.png";
	const DEFAULT_DETAIL_PAGE = "product-details1.html";
	const CATEGORY_ALIASES = {
		apparel: "fashion",
		bag: "fashion",
		bags: "fashion",
		clothes: "fashion",
		clothing: "fashion",
		footwear: "shoes",
		phone: "electronics",
		phones: "electronics",
		shoe: "shoes",
		sneakers: "shoes",
		smartwatch: "electronics",
		smartwatches: "electronics",
		watch: "electronics",
		watches: "electronics"
	};

	let inMemoryCatalog = [];

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function canUseStorage() {
		try {
			return Boolean(global.localStorage);
		} catch (error) {
			return false;
		}
	}

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
	}

	function normalizeText(value) {
		return String(value || "")
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, " ")
			.trim();
	}

	function normalizeCategory(value) {
		const normalized = normalizeText(value);
		if (!normalized) {
			return "general";
		}

		return CATEGORY_ALIASES[normalized] || normalized.replace(/\s+/g, "-");
	}

	function normalizeVisibility(value) {
		const normalized = normalizeText(value).replace(/\s+/g, "-");
		if (normalized === "home" || normalized === "shop" || normalized === "both") {
			return normalized;
		}

		if (normalized === "home-only") {
			return "home";
		}

		if (normalized === "shop-only") {
			return "shop";
		}

		return "both";
	}

	function normalizePriority(value) {
		return normalizeText(value) === "top" ? "top" : "normal";
	}

	function normalizeHighlightTag(value) {
		const normalized = normalizeText(value).replace(/\s+/g, "-");
		return normalized === "featured" || normalized === "trending" || normalized === "new"
			? normalized
			: "";
	}

	function toNonNegativeNumber(value, fallbackValue) {
		const parsed = Number(value);
		if (Number.isFinite(parsed) && parsed >= 0) {
			return parsed;
		}

		return fallbackValue;
	}

	function toTrimmedString(value, fallbackValue) {
		const result = String(value || "").trim();
		return result || String(fallbackValue || "").trim();
	}

	function toStringArray(value) {
		if (!Array.isArray(value)) {
			return [];
		}

		return value.map((entry) => String(entry || "").trim()).filter(Boolean);
	}

	function uniqueStrings(values) {
		return Array.from(new Set(values.map((entry) => String(entry || "").trim()).filter(Boolean)));
	}

	function isSafePath(value) {
		const path = String(value || "").trim();
		return Boolean(path) && !/^javascript:/i.test(path);
	}

	function createProductUrl(productId) {
		return `${DEFAULT_DETAIL_PAGE}?id=${encodeURIComponent(String(productId))}`;
	}

	function normalizeSpecs(specs) {
		if (!Array.isArray(specs)) {
			return [];
		}

		return specs
			.map((entry) => {
				if (!Array.isArray(entry) || entry.length < 2) {
					return null;
				}

				const label = toTrimmedString(entry[0], "Detail");
				const value = toTrimmedString(entry[1], "Available");
				return [label, value];
			})
			.filter(Boolean);
	}

	function normalizeAttributes(attributes) {
		if (!Array.isArray(attributes)) {
			return [];
		}

		return attributes
			.map((attribute) => {
				if (!attribute || typeof attribute !== "object") {
					return null;
				}

				const options = Array.isArray(attribute.options)
					? attribute.options
						.map((option) => {
							if (!option || typeof option !== "object") {
								return null;
							}

							const normalizedOption = {
								value: toTrimmedString(option.value, "Option"),
								stock: toNonNegativeNumber(option.stock, 0)
							};

							if (isSafePath(option.image)) {
								normalizedOption.image = String(option.image).trim();
							}

							return normalizedOption;
						})
						.filter(Boolean)
					: [];

				return {
					name: toTrimmedString(attribute.name, "Option"),
					type: toTrimmedString(attribute.type, "text"),
					options
				};
			})
			.filter(Boolean);
	}

	function collectKeywords(product) {
		const keywords = toStringArray(product.keywords);
		const tokens = [
			...keywords,
			...normalizeText(product.name).split(/\s+/),
			normalizeCategory(product.category),
			normalizeText(product.badge)
		];

		return uniqueStrings(tokens);
	}

	function normalizeProduct(product, index, usedIds) {
		const rawProduct = product && typeof product === "object" ? product : {};
		const name = toTrimmedString(rawProduct.name || rawProduct.title, `Product ${index + 1}`);
		const category = normalizeCategory(rawProduct.category);
		let id = Number(rawProduct.id);

		if (!Number.isFinite(id) || id <= 0 || usedIds.has(id)) {
			id = 1;
			while (usedIds.has(id)) {
				id += 1;
			}
		}

		usedIds.add(id);

		const price = toNonNegativeNumber(rawProduct.price, 0);
		const oldPrice = toNonNegativeNumber(rawProduct.oldPrice, 0);
		const stock = toNonNegativeNumber(rawProduct.stock, 0);
		const badge = toTrimmedString(rawProduct.badge, "");
		const visibility = normalizeVisibility(rawProduct.visibility);
		const priority = normalizePriority(rawProduct.priority);
		const orderIndex = toNonNegativeNumber(rawProduct.orderIndex, 0);
		const highlightTag = normalizeHighlightTag(rawProduct.highlightTag);
		const mainImage = isSafePath(rawProduct.mainImage)
			? String(rawProduct.mainImage).trim()
			: isSafePath(rawProduct.image)
				? String(rawProduct.image).trim()
				: FALLBACK_IMAGE;

		const gallery = uniqueStrings([mainImage, ...toStringArray(rawProduct.gallery)]);
		const shortDescription = toTrimmedString(
			rawProduct.shortDescription || rawProduct.description,
			`${name} is available in the Byose Market catalog.`
		);
		const longDescription = toStringArray(rawProduct.longDescription);
		const highlights = toStringArray(rawProduct.highlights);
		const trust = toStringArray(rawProduct.trust);
		const now = new Date().toISOString();

		const normalized = {
			...rawProduct,
			id,
			name,
			title: name,
			category,
			badge,
			visibility,
			priority,
			orderIndex,
			highlightTag,
			price,
			oldPrice: oldPrice > price ? oldPrice : 0,
			stock,
			mainImage,
			image: mainImage,
			gallery,
			shortDescription,
			description: toTrimmedString(rawProduct.description, shortDescription),
			longDescription: longDescription.length ? longDescription : [shortDescription],
			highlights,
			trust,
			specs: normalizeSpecs(rawProduct.specs),
			attributes: normalizeAttributes(rawProduct.attributes),
			keywords: [],
			page: DEFAULT_DETAIL_PAGE,
			url: createProductUrl(id),
			status: toTrimmedString(rawProduct.status, "active"),
			createdAt: rawProduct.createdAt || now,
			updatedAt: rawProduct.updatedAt || now
		};

		normalized.keywords = collectKeywords(normalized);
		return normalized;
	}

	function normalizeCatalog(items) {
		const source = Array.isArray(items) ? items : [];
		const usedIds = new Set();
		return source.map((item, index) => normalizeProduct(item, index, usedIds));
	}

	function readPersistedCatalog() {
		if (!canUseStorage()) {
			return [];
		}

		const raw = global.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}

		const parsed = safeParse(raw, []);
		const catalog = Array.isArray(parsed)
			? parsed
			: parsed && Array.isArray(parsed.catalog)
				? parsed.catalog
				: [];

		return normalizeCatalog(catalog);
	}

	function dispatchChange(detail) {
		const eventDetail = {
			catalog: clone(inMemoryCatalog),
			...detail
		};

		global.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: eventDetail }));
		if (global.document && typeof global.document.dispatchEvent === "function") {
			global.document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: eventDetail }));
		}
	}

	function persistCatalog(catalog, metadata) {
		inMemoryCatalog = normalizeCatalog(catalog);

		if (canUseStorage()) {
			global.localStorage.setItem(STORAGE_KEY, JSON.stringify({
				updatedAt: new Date().toISOString(),
				catalog: inMemoryCatalog
			}));
		}

		dispatchChange(metadata || {});
		return clone(inMemoryCatalog);
	}

	function getCatalog() {
		const persisted = readPersistedCatalog();
		if (persisted.length) {
			inMemoryCatalog = persisted;
			return clone(inMemoryCatalog);
		}

		return clone(inMemoryCatalog);
	}

	function registerSeed(seedItems) {
		const normalizedSeed = normalizeCatalog(seedItems);
		if (!normalizedSeed.length) {
			return getCatalog();
		}

		const persisted = readPersistedCatalog();
		if (persisted.length) {
			const seedById = new Map(normalizedSeed.map((item) => [Number(item.id), item]));
			inMemoryCatalog = normalizeCatalog(persisted.map((item) => ({
				...(seedById.get(Number(item.id)) || {}),
				...item,
				mainImage: item.mainImage || item.image || (seedById.get(Number(item.id)) || {}).mainImage,
				image: item.image || item.mainImage || (seedById.get(Number(item.id)) || {}).image,
				gallery: Array.isArray(item.gallery) && item.gallery.length
					? item.gallery
					: (seedById.get(Number(item.id)) || {}).gallery,
				keywords: Array.isArray(item.keywords) && item.keywords.length
					? item.keywords
					: (seedById.get(Number(item.id)) || {}).keywords,
				longDescription: Array.isArray(item.longDescription) && item.longDescription.length
					? item.longDescription
					: (seedById.get(Number(item.id)) || {}).longDescription,
				highlights: Array.isArray(item.highlights) && item.highlights.length
					? item.highlights
					: (seedById.get(Number(item.id)) || {}).highlights,
				trust: Array.isArray(item.trust) && item.trust.length
					? item.trust
					: (seedById.get(Number(item.id)) || {}).trust,
				specs: Array.isArray(item.specs) && item.specs.length
					? item.specs
					: (seedById.get(Number(item.id)) || {}).specs,
				attributes: Array.isArray(item.attributes) && item.attributes.length
					? item.attributes
					: (seedById.get(Number(item.id)) || {}).attributes
			})));
			return clone(inMemoryCatalog);
		}

		if (!inMemoryCatalog.length) {
			return persistCatalog(normalizedSeed, { action: "seed" });
		}

		const seedById = new Map(normalizedSeed.map((item) => [Number(item.id), item]));
		inMemoryCatalog = normalizeCatalog(inMemoryCatalog.map((item) => ({
			...(seedById.get(Number(item.id)) || {}),
			...item
		})));
		return clone(inMemoryCatalog);
	}

	function getProductById(productId) {
		return getCatalog().find((item) => Number(item.id) === Number(productId)) || null;
	}

	function createProduct(payload) {
		const catalog = getCatalog();
		const nextId = catalog.reduce((maxValue, item) => Math.max(maxValue, Number(item.id) || 0), 0) + 1;
		const createdProduct = normalizeCatalog([{
			...payload,
			id: nextId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}])[0];

		catalog.push(createdProduct);
		persistCatalog(catalog, { action: "create", productId: createdProduct.id });
		return clone(createdProduct);
	}

	function updateProduct(productId, updates) {
		const catalog = getCatalog();
		const index = catalog.findIndex((item) => Number(item.id) === Number(productId));
		if (index === -1) {
			return null;
		}

		const updatedProduct = normalizeCatalog([{
			...catalog[index],
			...updates,
			id: Number(productId),
			updatedAt: new Date().toISOString()
		}])[0];

		catalog.splice(index, 1, updatedProduct);
		persistCatalog(catalog, { action: "update", productId: updatedProduct.id });
		return clone(updatedProduct);
	}

	function deleteProduct(productId) {
		const catalog = getCatalog();
		const nextCatalog = catalog.filter((item) => Number(item.id) !== Number(productId));
		if (nextCatalog.length === catalog.length) {
			return false;
		}

		persistCatalog(nextCatalog, { action: "delete", productId: Number(productId) });
		return true;
	}

	function getStorefrontCatalog() {
		return getCatalog().map((item) => ({
			...item,
			image: item.mainImage || item.image || FALLBACK_IMAGE,
			page: DEFAULT_DETAIL_PAGE,
			url: createProductUrl(item.id)
		}));
	}

	function formatPrice(value) {
		return `RWF ${Number(value || 0).toLocaleString("en-US")}`;
	}

	global.ByoseProductCatalog = {
		EVENT_NAME,
		STORAGE_KEY,
		createProduct,
		createProductUrl,
		deleteProduct,
		formatPrice,
		getCatalog,
		getProductById,
		getStorefrontCatalog,
		registerSeed,
		updateProduct
	};
})(window);