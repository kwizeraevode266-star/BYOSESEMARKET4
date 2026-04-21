(function (global) {
	"use strict";

	const ORDER_KEYS = ["byose_orders", "orders"];
	const USER_KEYS = ["bm_users", "byose_market_users"];
	const EVENT_NAME = "byose:admin-orders-changed";
	const STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
	}

	function readArrayFromKeys(keys) {
		for (const key of keys) {
			const raw = global.localStorage.getItem(key);
			if (!raw) {
				continue;
			}

			const parsed = safeParse(raw, []);
			if (Array.isArray(parsed)) {
				return parsed;
			}
		}

		return [];
	}

	function writeOrders(orders) {
		const serialized = JSON.stringify(Array.isArray(orders) ? orders : []);
		ORDER_KEYS.forEach((key) => {
			global.localStorage.setItem(key, serialized);
		});
	}

	function dispatchChange(detail) {
		global.dispatchEvent(new CustomEvent(EVENT_NAME, {
			detail: detail || {}
		}));
		global.dispatchEvent(new CustomEvent("byose:orders-changed", {
			detail: detail || {}
		}));
	}

	function normalizeText(value) {
		return String(value || "")
			.toLowerCase()
			.trim()
			.replace(/\s+/g, " ");
	}

	function normalizeIdentifier(value) {
		return normalizeText(value).replace(/\s+/g, "");
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function formatCurrency(value) {
		return `RWF ${Number(value || 0).toLocaleString("en-US")}`;
	}

	function formatDate(value) {
		if (!value) {
			return "No date";
		}

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return "No date";
		}

		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		}).format(date);
	}

	function formatDateTime(value) {
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

	function normalizePhone(value) {
		return String(value || "").replace(/\s+/g, "").trim();
	}

	function toIsoDate(value) {
		if (!value) {
			return "";
		}

		if (typeof value === "number") {
			return new Date(value).toISOString();
		}

		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? "" : date.toISOString();
	}

	function normalizeStatus(status) {
		const normalized = normalizeText(status);
		if (normalized.includes("cancel")) {
			return "Cancelled";
		}
		if (normalized.includes("deliver") || normalized.includes("complete")) {
			return "Delivered";
		}
		if (normalized.includes("ship")) {
			return "Shipped";
		}
		if (normalized.includes("process")) {
			return "Processing";
		}
		return "Pending";
	}

	function getStatusTone(status) {
		const normalized = normalizeStatus(status).toLowerCase();
		if (normalized === "cancelled") {
			return "cancelled";
		}
		if (normalized === "delivered") {
			return "delivered";
		}
		if (normalized === "shipped") {
			return "shipped";
		}
		if (normalized === "processing") {
			return "processing";
		}
		return "pending";
	}

	function resolveAddress(record) {
		const source = record?.address && typeof record.address === "object"
			? record.address
			: record?.shippingAddress && typeof record.shippingAddress === "object"
				? record.shippingAddress
				: record || {};

		return {
			firstName: String(source.firstName || "").trim(),
			lastName: String(source.lastName || "").trim(),
			phone: normalizePhone(source.phone || record?.customerPhone || ""),
			street: String(source.street || source.line1 || "").trim(),
			city: String(source.city || "").trim(),
			district: String(source.district || "").trim(),
			sector: String(source.sector || "").trim(),
			cell: String(source.cell || "").trim(),
			village: String(source.village || "").trim()
		};
	}

	function readUsers() {
		return readArrayFromKeys(USER_KEYS)
			.filter((user) => user && typeof user === "object")
			.map((user) => ({
				id: String(user.id || "").trim(),
				name: String(user.name || "").trim(),
				email: String(user.email || "").trim().toLowerCase(),
				phone: normalizePhone(user.phone || ""),
				avatar: String(user.avatar || user.image || "").trim(),
				address: resolveAddress(user)
			}));
	}

	function buildCustomerLookup() {
		const users = readUsers();
		const lookup = new Map();

		users.forEach((user) => {
			if (user.id) {
				lookup.set(`id:${user.id.toLowerCase()}`, user);
			}
			if (user.email) {
				lookup.set(`email:${normalizeIdentifier(user.email)}`, user);
			}
			if (user.phone) {
				lookup.set(`phone:${normalizeIdentifier(user.phone)}`, user);
			}
		});

		return lookup;
	}

	function getCatalogProducts() {
		const catalogService = global.ByoseProductCatalog;
		if (catalogService && typeof catalogService.getCatalog === "function") {
			return catalogService.getCatalog();
		}
		if (catalogService && typeof catalogService.getStorefrontCatalog === "function") {
			return catalogService.getStorefrontCatalog();
		}
		return Array.isArray(global.products) ? global.products : [];
	}

	function findCatalogProduct(item, catalog) {
		const productId = String(item?.productId || item?.catalogProductId || item?.id || "").trim();
		if (productId) {
			const byId = catalog.find((product) => String(product?.id || "").trim() === productId);
			if (byId) {
				return byId;
			}
		}

		const name = normalizeText(item?.name || "");
		if (!name) {
			return null;
		}

		return catalog.find((product) => normalizeText(product?.name || product?.title || "") === name) || null;
	}

	function normalizeProduct(item, catalogProduct) {
		const attributes = item?.attributes && typeof item.attributes === "object" && !Array.isArray(item.attributes)
			? clone(item.attributes)
			: {};
		const image = String(
			item?.image
			|| item?.img
			|| catalogProduct?.mainImage
			|| catalogProduct?.image
			|| ""
		).trim();
		const attributeSummary = Object.keys(attributes).length
			? Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(" | ")
			: String(item?.attributeSummary || "Standard option").trim() || "Standard option";

		return {
			id: String(catalogProduct?.id || item?.productId || item?.id || "").trim(),
			name: String(item?.name || catalogProduct?.name || "Product").trim() || "Product",
			price: Number(item?.price || catalogProduct?.price || 0) || 0,
			qty: Math.max(1, Number(item?.qty || 1) || 1),
			image,
			attributes,
			attributeSummary,
			catalogProduct: catalogProduct ? {
				id: catalogProduct.id,
				category: catalogProduct.category,
				url: catalogProduct.url || catalogProduct.link || "",
				stock: Number(catalogProduct.stock || 0) || 0
			} : null
		};
	}

	function normalizeOrder(order, index, customerLookup, catalog) {
		const customerSeed = order?.customer && typeof order.customer === "object" ? order.customer : {};
		const lookupKeys = [
			String(order?.customerId || customerSeed?.id || "").trim() ? `id:${String(order?.customerId || customerSeed?.id || "").trim().toLowerCase()}` : "",
			String(order?.customerEmail || customerSeed?.email || "").trim() ? `email:${normalizeIdentifier(order?.customerEmail || customerSeed?.email || "")}` : "",
			String(order?.customerPhone || customerSeed?.phone || "").trim() ? `phone:${normalizeIdentifier(order?.customerPhone || customerSeed?.phone || "")}` : ""
		].filter(Boolean);

		const matchedCustomer = lookupKeys.map((key) => customerLookup.get(key)).find(Boolean) || null;
		const shippingAddress = resolveAddress(order?.shippingAddress || matchedCustomer || customerSeed);
		const customerName = String(
			order?.customerName
			|| customerSeed?.name
			|| matchedCustomer?.name
			|| [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(" ")
			|| "Guest Customer"
		).trim() || "Guest Customer";

		const products = Array.isArray(order?.products)
			? order.products.map((item) => normalizeProduct(item, findCatalogProduct(item, catalog)))
			: [];

		const payment = order?.payment && typeof order.payment === "object" ? order.payment : {};
		const status = normalizeStatus(order?.status);

		return {
			...order,
			id: String(order?.id || `ORD-${index + 1}`).trim(),
			date: toIsoDate(order?.date || order?.createdAt || order?.timestamp || Date.now()),
			updatedAt: toIsoDate(order?.updatedAt || order?.date || order?.createdAt || Date.now()),
			status,
			statusTone: getStatusTone(status),
			total: Number(order?.total ?? order?.totalPrice ?? order?.subtotal ?? 0) || 0,
			subtotal: Number(order?.subtotal || 0) || 0,
			shippingFee: Number(order?.shippingFee || 0) || 0,
			codFee: Number(order?.codFee || 0) || 0,
			customerId: String(order?.customerId || matchedCustomer?.id || customerSeed?.id || "").trim(),
			customerName,
			customerEmail: String(order?.customerEmail || matchedCustomer?.email || customerSeed?.email || "").trim().toLowerCase(),
			customerPhone: normalizePhone(order?.customerPhone || matchedCustomer?.phone || customerSeed?.phone || shippingAddress.phone || ""),
			customerImage: String(order?.customerImage || matchedCustomer?.avatar || customerSeed?.avatar || customerSeed?.image || "").trim(),
			customerLink: String(order?.customerId || matchedCustomer?.id || customerSeed?.id || "").trim()
				? `../customers/profile.html?id=${encodeURIComponent(String(order?.customerId || matchedCustomer?.id || customerSeed?.id || "").trim())}`
				: "",
			shippingAddress,
			deliveryMethod: String(order?.deliveryMethod || "delivery").trim() || "delivery",
			deliveryLabel: String(order?.deliveryLabel || "Delivery to address").trim() || "Delivery to address",
			paymentType: String(order?.paymentType || payment?.type || "pay_now").trim() || "pay_now",
			paymentMethod: String(order?.paymentMethod || payment?.method || "").trim(),
			payment: {
				type: String(payment?.type || order?.paymentType || "pay_now").trim() || "pay_now",
				method: String(payment?.method || order?.paymentMethod || "").trim(),
				payerPhone: normalizePhone(payment?.payerPhone || order?.customerPhone || shippingAddress.phone || ""),
				transactionId: String(payment?.transactionId || "").trim()
			},
			products,
			itemsCount: products.reduce((sum, item) => sum + Number(item.qty || 0), 0),
			searchableText: [
				order?.id,
				customerName,
				order?.customerEmail,
				order?.customerPhone,
				status,
				products.map((item) => item.name).join(" ")
			].map(normalizeText).join(" ")
		};
	}

	function getOrders() {
		const customerLookup = buildCustomerLookup();
		const catalog = getCatalogProducts();
		const unique = new Map();

		readArrayFromKeys(ORDER_KEYS)
			.map((order, index) => normalizeOrder(order, index, customerLookup, catalog))
			.forEach((order) => {
				if (!unique.has(order.id)) {
					unique.set(order.id, order);
				}
			});

		return Array.from(unique.values())
			.sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));
	}

	function getOrderById(orderId) {
		return getOrders().find((order) => String(order.id) === String(orderId || "")) || null;
	}

	function sortOrders(orders, sortBy) {
		const list = Array.isArray(orders) ? orders.slice() : [];
		const mode = String(sortBy || "date-desc").toLowerCase();

		return list.sort((left, right) => {
			if (mode === "date-asc") {
				return new Date(left.date || 0) - new Date(right.date || 0);
			}
			if (mode === "total-desc") {
				return Number(right.total || 0) - Number(left.total || 0);
			}
			if (mode === "total-asc") {
				return Number(left.total || 0) - Number(right.total || 0);
			}
			if (mode === "status") {
				return normalizeText(left.status).localeCompare(normalizeText(right.status));
			}
			return new Date(right.date || 0) - new Date(left.date || 0);
		});
	}

	function filterOrders(options) {
		const config = options || {};
		const query = normalizeText(config.query || "");
		const statusFilter = String(config.status || "all").trim();

		const filtered = getOrders().filter((order) => {
			if (statusFilter !== "all" && normalizeStatus(statusFilter) !== order.status) {
				return false;
			}

			if (!query) {
				return true;
			}

			return order.searchableText.includes(query);
		});

		return sortOrders(filtered, config.sortBy);
	}

	function updateStoredOrder(orderId, updater) {
		const orders = readArrayFromKeys(ORDER_KEYS);
		const index = orders.findIndex((order) => String(order?.id || "") === String(orderId || ""));
		if (index === -1) {
			return null;
		}

		const updatedOrder = updater(clone(orders[index]));
		orders.splice(index, 1, updatedOrder);
		writeOrders(orders);
		dispatchChange({ action: "update", orderId: String(orderId) });
		return getOrderById(orderId);
	}

	function updateOrderStatus(orderId, status) {
		return updateStoredOrder(orderId, (order) => ({
			...order,
			status: normalizeStatus(status),
			updatedAt: new Date().toISOString()
		}));
	}

	function deleteOrder(orderId) {
		const orders = readArrayFromKeys(ORDER_KEYS);
		const nextOrders = orders.filter((order) => String(order?.id || "") !== String(orderId || ""));
		if (nextOrders.length === orders.length) {
			return false;
		}

		writeOrders(nextOrders);
		dispatchChange({ action: "delete", orderId: String(orderId) });
		return true;
	}

	function getOrderStats() {
		const orders = getOrders();
		return {
			totalOrders: orders.length,
			pendingOrders: orders.filter((order) => order.status === "Pending").length,
			deliveredOrders: orders.filter((order) => order.status === "Delivered").length,
			totalRevenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
		};
	}

	global.AdminOrdersService = {
		EVENT_NAME,
		STATUS_OPTIONS,
		deleteOrder,
		escapeHtml,
		filterOrders,
		formatCurrency,
		formatDate,
		formatDateTime,
		getOrderById,
		getOrderStats,
		getOrders,
		getStatusTone,
		updateOrderStatus
	};
})(window);
