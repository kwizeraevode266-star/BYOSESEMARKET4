(function (global) {
	"use strict";

	const STORAGE_KEYS = ["byose_market_reviews", "byose_reviews"];
	const EVENT_NAME = "byose:reviews-changed";
	const STATUS_OPTIONS = ["Pending", "Approved", "Hidden", "Flagged"];

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
	}

	function normalizeStatus(value) {
		const status = String(value || "pending").trim().toLowerCase();
		if (status.includes("approve")) {
			return "Approved";
		}
		if (status.includes("hide")) {
			return "Hidden";
		}
		if (status.includes("flag")) {
			return "Flagged";
		}
		return "Pending";
	}

	function getStatusTone(value) {
		const status = normalizeStatus(value).toLowerCase();
		if (status === "approved") {
			return "approved";
		}
		if (status === "hidden") {
			return "hidden";
		}
		if (status === "flagged") {
			return "flagged";
		}
		return "pending";
	}

	function readReviews() {
		const seen = new Set();
		const reviews = [];
		STORAGE_KEYS.forEach((key) => {
			const raw = global.localStorage.getItem(key);
			if (!raw) {
				return;
			}
			safeParse(raw, []).forEach((review, index) => {
				const id = String(review?.id || `${review?.productId || review?.productName || "review"}-${index}`).trim();
				if (!id || seen.has(id)) {
					return;
				}
				seen.add(id);
				reviews.push(normalizeReview(review, id));
			});
		});
		return reviews.sort((left, right) => Number(right.createdAtValue || 0) - Number(left.createdAtValue || 0));
	}

	function writeReviews(reviews) {
		const serialized = JSON.stringify(Array.isArray(reviews) ? reviews : []);
		STORAGE_KEYS.forEach((key) => global.localStorage.setItem(key, serialized));
		global.dispatchEvent(new CustomEvent(EVENT_NAME));
	}

	function normalizeReview(review, fallbackId) {
		const createdAtValue = new Date(review?.createdAt || review?.timestamp || Date.now()).getTime();
		return {
			id: String(review?.id || fallbackId),
			productId: String(review?.productId || "").trim(),
			productName: String(review?.productName || review?.product || "Unknown product").trim() || "Unknown product",
			customerName: String(review?.customerName || review?.name || "Anonymous").trim() || "Anonymous",
			customerEmail: String(review?.customerEmail || review?.email || "").trim().toLowerCase(),
			rating: Math.min(5, Math.max(1, Number(review?.rating || 0) || 0)),
			status: normalizeStatus(review?.status),
			comment: String(review?.comment || review?.message || "").trim(),
			createdAt: Number.isNaN(createdAtValue) ? new Date().toISOString() : new Date(createdAtValue).toISOString(),
			createdAtValue: Number.isNaN(createdAtValue) ? Date.now() : createdAtValue
		};
	}

	function getReviewById(reviewId) {
		return readReviews().find((review) => review.id === String(reviewId || "")) || null;
	}

	function filterReviews(filters) {
		const state = filters || {};
		const query = String(state.query || "").trim().toLowerCase();
		const status = String(state.status || "all").trim().toLowerCase();
		return readReviews().filter((review) => {
			if (status !== "all" && normalizeStatus(review.status).toLowerCase() !== status) {
				return false;
			}
			if (!query) {
				return true;
			}
			return [review.productName, review.customerName, review.customerEmail, review.comment]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
	}

	function updateReviewStatus(reviewId, nextStatus) {
		const id = String(reviewId || "");
		writeReviews(readReviews().map((review) => review.id === id ? { ...review, status: normalizeStatus(nextStatus) } : review));
		return getReviewById(id);
	}

	function deleteReview(reviewId) {
		const id = String(reviewId || "");
		writeReviews(readReviews().filter((review) => review.id !== id));
	}

	function getReviewStats() {
		const reviews = readReviews();
		const approved = reviews.filter((review) => normalizeStatus(review.status) === "Approved").length;
		const pending = reviews.filter((review) => normalizeStatus(review.status) === "Pending").length;
		const flagged = reviews.filter((review) => normalizeStatus(review.status) === "Flagged").length;
		const averageRating = reviews.length
			? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
			: "0.0";
		return { total: reviews.length, approved, pending, flagged, averageRating };
	}

	function formatDateTime(value) {
		const date = new Date(value || Date.now());
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

	global.AdminReviewsService = {
		EVENT_NAME,
		STATUS_OPTIONS,
		escapeHtml,
		formatDateTime,
		normalizeStatus,
		getStatusTone,
		getReviews: readReviews,
		filterReviews,
		getReviewById,
		updateReviewStatus,
		deleteReview,
		getReviewStats
	};
})(window);
