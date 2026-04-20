(function (global) {
	"use strict";

	const CATEGORY_OPTIONS = [
		{ value: "fashion", label: "Fashion" },
		{ value: "shoes", label: "Shoes" },
		{ value: "electronics", label: "Electronics" },
		{ value: "general", label: "General" }
	];

	function getCatalogService() {
		return global.ByoseProductCatalog || null;
	}

	function getProducts() {
		const catalogService = getCatalogService();
		return catalogService && typeof catalogService.getCatalog === "function"
			? catalogService.getCatalog()
			: [];
	}

	function getProductById(productId) {
		const catalogService = getCatalogService();
		return catalogService && typeof catalogService.getProductById === "function"
			? catalogService.getProductById(productId)
			: null;
	}

	function createProduct(payload) {
		const catalogService = getCatalogService();
		return catalogService && typeof catalogService.createProduct === "function"
			? catalogService.createProduct(payload)
			: null;
	}

	function updateProduct(productId, payload) {
		const catalogService = getCatalogService();
		return catalogService && typeof catalogService.updateProduct === "function"
			? catalogService.updateProduct(productId, payload)
			: null;
	}

	function deleteProduct(productId) {
		const catalogService = getCatalogService();
		return catalogService && typeof catalogService.deleteProduct === "function"
			? catalogService.deleteProduct(productId)
			: false;
	}

	function formatCurrency(value) {
		const amount = Number(value || 0);
		return `RWF ${amount.toLocaleString("en-US")}`;
	}

	function formatDate(value) {
		if (!value) {
			return "No timestamp";
		}

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return "No timestamp";
		}

		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit"
		}).format(date);
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function normalizeCategoryLabel(category) {
		return String(category || "general")
			.replace(/-/g, " ")
			.replace(/(^\w|\s\w)/g, (match) => match.toUpperCase());
	}

	function resolveStorefrontImagePath(path) {
		const value = String(path || "").trim();
		if (!value) {
			return "";
		}

		if (/^(?:https?:|data:|blob:|\/)/i.test(value)) {
			return value;
		}

		if (/^(?:\.\.\/|\.\/)/.test(value)) {
			return value;
		}

		return `../../${value.replace(/^\/+/, "")}`;
	}

	function parseLineList(value) {
		return String(value || "")
			.split(/\r?\n|,/)
			.map((entry) => entry.trim())
			.filter(Boolean);
	}

	function parseSpecs(value) {
		return String(value || "")
			.split(/\r?\n/)
			.map((entry) => entry.trim())
			.filter(Boolean)
			.map((entry) => {
				const parts = entry.split(":");
				if (parts.length < 2) {
					return null;
				}

				return [parts[0].trim(), parts.slice(1).join(":").trim()];
			})
			.filter(Boolean);
	}

	function serializeSpecs(specs) {
		return Array.isArray(specs)
			? specs.map((entry) => `${entry[0]}: ${entry[1]}`).join("\n")
			: "";
	}

	function getFormValue(form, name) {
		const field = form.elements.namedItem(name);
		return field ? String(field.value || "").trim() : "";
	}

	function readProductForm(form) {
		const name = getFormValue(form, "name");
		const category = getFormValue(form, "category") || "general";
		const price = Number(getFormValue(form, "price")) || 0;
		const oldPrice = Number(getFormValue(form, "oldPrice")) || 0;
		const stock = Number(getFormValue(form, "stock")) || 0;
		const badge = getFormValue(form, "badge");
		const mainImage = getFormValue(form, "mainImage");
		const gallery = parseLineList(getFormValue(form, "gallery"));
		const keywords = parseLineList(getFormValue(form, "keywords"));
		const shortDescription = getFormValue(form, "shortDescription");
		const longDescription = parseLineList(getFormValue(form, "longDescription"));
		const highlights = parseLineList(getFormValue(form, "highlights"));
		const trust = parseLineList(getFormValue(form, "trust"));
		const specs = parseSpecs(getFormValue(form, "specs"));

		return {
			name,
			category,
			price,
			oldPrice,
			stock,
			badge,
			mainImage,
			image: mainImage,
			gallery,
			keywords,
			shortDescription,
			description: shortDescription,
			longDescription,
			highlights,
			trust,
			specs
		};
	}

	function populateProductForm(form, product) {
		if (!form || !product) {
			return;
		}

		form.elements.namedItem("name").value = product.name || "";
		form.elements.namedItem("category").value = product.category || "general";
		form.elements.namedItem("price").value = Number(product.price || 0);
		form.elements.namedItem("oldPrice").value = Number(product.oldPrice || 0);
		form.elements.namedItem("stock").value = Number(product.stock || 0);
		form.elements.namedItem("badge").value = product.badge || "";
		form.elements.namedItem("mainImage").value = product.mainImage || product.image || "";
		form.elements.namedItem("gallery").value = Array.isArray(product.gallery) ? product.gallery.join("\n") : "";
		form.elements.namedItem("keywords").value = Array.isArray(product.keywords) ? product.keywords.join(", ") : "";
		form.elements.namedItem("shortDescription").value = product.shortDescription || product.description || "";
		form.elements.namedItem("longDescription").value = Array.isArray(product.longDescription) ? product.longDescription.join("\n") : "";
		form.elements.namedItem("highlights").value = Array.isArray(product.highlights) ? product.highlights.join("\n") : "";
		form.elements.namedItem("trust").value = Array.isArray(product.trust) ? product.trust.join("\n") : "";
		form.elements.namedItem("specs").value = serializeSpecs(product.specs);
	}

	function getProductIdFromLocation() {
		const params = new URLSearchParams(global.location.search);
		return Number(params.get("id") || 0) || null;
	}

	function filterProducts(options) {
		const config = options || {};
		const query = String(config.query || "").trim().toLowerCase();
		const category = String(config.category || "all").trim().toLowerCase();

		return getProducts()
			.filter((product) => {
				if (category !== "all" && String(product.category || "").toLowerCase() !== category) {
					return false;
				}

				if (!query) {
					return true;
				}

				const haystack = [
					product.name,
					product.category,
					product.badge,
					product.shortDescription,
					Array.isArray(product.keywords) ? product.keywords.join(" ") : ""
				].join(" ").toLowerCase();

				return haystack.includes(query);
			})
			.sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0));
	}

	function getStats(products) {
		const list = Array.isArray(products) ? products : getProducts();
		const totalStock = list.reduce((sum, product) => sum + Number(product.stock || 0), 0);
		const lowStock = list.filter((product) => Number(product.stock || 0) <= 5).length;
		const totalValue = list.reduce((sum, product) => sum + (Number(product.price || 0) * Number(product.stock || 0)), 0);
		const activeCategories = new Set(list.map((product) => String(product.category || "general").toLowerCase())).size;

		return {
			totalProducts: list.length,
			totalStock,
			lowStock,
			totalValue,
			activeCategories
		};
	}

	global.AdminProductsService = {
		CATEGORY_OPTIONS,
		createProduct,
		deleteProduct,
		escapeHtml,
		filterProducts,
		formatCurrency,
		formatDate,
		getProductById,
		getProductIdFromLocation,
		getProducts,
		getStats,
		normalizeCategoryLabel,
		populateProductForm,
		readProductForm,
		resolveStorefrontImagePath,
		serializeSpecs,
		updateProduct
	};
})(window);
