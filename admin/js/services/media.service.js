(function (global) {
	"use strict";

	const STORAGE_KEY = "byose_admin_media_v1";
	const EVENT_NAME = "byose:media-changed";

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
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

	function readUploads() {
		return safeParse(global.localStorage.getItem(STORAGE_KEY), []).map((item) => ({
			id: String(item?.id || `media-${Date.now()}`),
			name: String(item?.name || "Uploaded asset").trim() || "Uploaded asset",
			url: String(item?.url || "").trim(),
			type: String(item?.type || "uploaded").trim() || "uploaded",
			createdAt: String(item?.createdAt || new Date().toISOString()),
			sizeLabel: String(item?.sizeLabel || "").trim(),
			origin: "uploaded"
		})).filter((item) => item.url);
	}

	function writeUploads(items) {
		global.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items : []));
		global.dispatchEvent(new CustomEvent(EVENT_NAME));
	}

	function collectCatalogImages() {
		const map = new Map();
		getCatalogProducts().forEach((product) => {
			const images = [];
			if (product?.mainImage) {
				images.push(product.mainImage);
			}
			if (product?.image) {
				images.push(product.image);
			}
			if (Array.isArray(product?.gallery)) {
				images.push(...product.gallery);
			}

			images.forEach((url, index) => {
				const cleaned = String(url || "").trim();
				if (!cleaned) {
					return;
				}
				const id = `product-${product?.id || "item"}-${index}`;
				if (!map.has(id)) {
					map.set(id, {
						id,
						name: String(product?.name || "Catalog image").trim() || "Catalog image",
						url: cleaned,
						type: "catalog",
						createdAt: String(product?.updatedAt || product?.createdAt || new Date().toISOString()),
						sizeLabel: "Catalog asset",
						origin: "catalog"
					});
				}
			});
		});

		return Array.from(map.values());
	}

	function getMediaItems(filters) {
		const state = filters || {};
		const query = String(state.query || "").trim().toLowerCase();
		const type = String(state.type || "all").trim().toLowerCase();
		return collectCatalogImages()
			.concat(readUploads())
			.filter((item) => {
				if (type !== "all" && String(item.origin || item.type || "").toLowerCase() !== type) {
					return false;
				}
				if (!query) {
					return true;
				}
				return [item.name, item.url, item.origin].join(" ").toLowerCase().includes(query);
			})
			.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
	}

	function addMediaItem(payload) {
		const items = readUploads();
		items.unshift({
			id: String(payload?.id || `media-${Date.now()}`),
			name: String(payload?.name || "Uploaded asset").trim() || "Uploaded asset",
			url: String(payload?.url || "").trim(),
			type: String(payload?.type || "uploaded").trim() || "uploaded",
			createdAt: new Date().toISOString(),
			sizeLabel: String(payload?.sizeLabel || "").trim(),
			origin: "uploaded"
		});
		writeUploads(items);
		return items[0];
	}

	function deleteMediaItem(mediaId) {
		const id = String(mediaId || "");
		writeUploads(readUploads().filter((item) => item.id !== id));
	}

	function getMediaStats() {
		const uploads = readUploads();
		const catalogAssets = collectCatalogImages();
		return {
			total: uploads.length + catalogAssets.length,
			uploaded: uploads.length,
			catalog: catalogAssets.length,
			latestLabel: uploads[0] ? uploads[0].name : "No uploaded assets yet"
		};
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	global.AdminMediaService = {
		EVENT_NAME,
		escapeHtml,
		getMediaItems,
		addMediaItem,
		deleteMediaItem,
		getMediaStats
	};
})(window);
