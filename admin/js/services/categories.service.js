(function (global) {
	"use strict";

	const STORAGE_KEY = "byose_admin_categories_v1";
	const EVENT_NAME = "byose:categories-changed";
	const DEFAULT_CATEGORIES = [
		{ value: "fashion", label: "Fashion", description: "Apparel, bags, and accessories.", image: "img/hiro 3 imyenda.jpg" },
		{ value: "shoes", label: "Shoes", description: "Sneakers, heels, sandals, and more.", image: "img/hiro1 inketo.jpg" },
		{ value: "electronics", label: "Electronics", description: "Phones, gadgets, accessories, and smart devices.", image: "img/hiro  4 electronics.jpg" },
		{ value: "general", label: "General", description: "Mixed catalog items and uncategorized products.", image: "img/logo.png" }
	];

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
	}

	function slugify(value) {
		return String(value || "")
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "general";
	}

	function titleize(value) {
		return String(value || "")
			.replace(/-/g, " ")
			.replace(/(^\w|\s\w)/g, (match) => match.toUpperCase());
	}

	function readMetadata() {
		return safeParse(global.localStorage.getItem(STORAGE_KEY), []);
	}

	function writeMetadata(entries) {
		global.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(entries) ? entries : []));
		dispatchChange();
	}

	function dispatchChange() {
		global.dispatchEvent(new CustomEvent(EVENT_NAME));
		global.dispatchEvent(new CustomEvent("byose:products-changed", { detail: { source: "categories" } }));
	}

	function getCatalogProducts() {
		const catalog = global.ByoseProductCatalog;
		if (catalog && typeof catalog.getCatalog === "function") {
			return catalog.getCatalog();
		}
		if (catalog && typeof catalog.getStorefrontCatalog === "function") {
			return catalog.getStorefrontCatalog();
		}
		return Array.isArray(global.products) ? global.products : [];
	}

	function buildCategories() {
		const metadata = readMetadata();
		const products = getCatalogProducts();
		const categories = new Map();

		DEFAULT_CATEGORIES.forEach((entry) => {
			categories.set(entry.value, {
				id: entry.value,
				name: entry.label,
				label: entry.label,
				description: entry.description,
				image: entry.image,
				productCount: 0,
				isCustom: false,
				updatedAt: ""
			});
		});

		metadata.forEach((entry) => {
			const id = slugify(entry?.id || entry?.value || entry?.name);
			categories.set(id, {
				id,
				name: String(entry?.name || titleize(id)).trim() || titleize(id),
				label: String(entry?.label || entry?.name || titleize(id)).trim() || titleize(id),
				description: String(entry?.description || "").trim(),
				image: String(entry?.image || "").trim(),
				productCount: 0,
				isCustom: !DEFAULT_CATEGORIES.some((item) => item.value === id),
				updatedAt: String(entry?.updatedAt || "").trim()
			});
		});

		products.forEach((product) => {
			const id = slugify(product?.category || "general");
			const current = categories.get(id) || {
				id,
				name: titleize(id),
				label: titleize(id),
				description: "",
				image: String(product?.mainImage || product?.image || "").trim(),
				productCount: 0,
				isCustom: !DEFAULT_CATEGORIES.some((item) => item.value === id),
				updatedAt: ""
			};

			current.productCount += 1;
			if (!current.image) {
				current.image = String(product?.mainImage || product?.image || "").trim();
			}
			categories.set(id, current);
		});

		return Array.from(categories.values()).sort((left, right) => left.label.localeCompare(right.label));
	}

	function getCategoryById(categoryId) {
		const id = slugify(categoryId);
		return buildCategories().find((category) => category.id === id) || null;
	}

	function saveCategory(payload) {
		const metadata = readMetadata();
		const id = slugify(payload?.id || payload?.name);
		const next = {
			id,
			name: String(payload?.name || titleize(id)).trim() || titleize(id),
			label: String(payload?.label || payload?.name || titleize(id)).trim() || titleize(id),
			description: String(payload?.description || "").trim(),
			image: String(payload?.image || "").trim(),
			updatedAt: new Date().toISOString()
		};
		const index = metadata.findIndex((entry) => slugify(entry?.id || entry?.name) === id);
		if (index >= 0) {
			metadata[index] = next;
		} else {
			metadata.push(next);
		}
		writeMetadata(metadata);
		return getCategoryById(id);
	}

	function deleteCategory(categoryId) {
		const id = slugify(categoryId);
		writeMetadata(readMetadata().filter((entry) => slugify(entry?.id || entry?.name) !== id));
	}

	function getCategoryOptions() {
		return buildCategories().map((category) => ({
			value: category.id,
			label: category.label
		}));
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	global.AdminCategoriesService = {
		EVENT_NAME,
		escapeHtml,
		slugify,
		getCategories: buildCategories,
		getCategoryById,
		saveCategory,
		deleteCategory,
		getCategoryOptions
	};
})(window);
