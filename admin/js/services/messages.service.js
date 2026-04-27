(function (global) {
	"use strict";

	const STORAGE_KEYS = ["byose_market_messages", "byose_messages"];
	const EVENT_NAME = "byose:messages-changed";
	const STATUS_OPTIONS = ["New", "Reviewed", "Resolved"];

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
	}

	function readMessages() {
		const seen = new Set();
		const messages = [];

		STORAGE_KEYS.forEach((key) => {
			const raw = global.localStorage.getItem(key);
			if (!raw) {
				return;
			}

			safeParse(raw, []).forEach((message, index) => {
				const identifier = String(message?.id || `${message?.email || "message"}-${message?.createdAt || index}`).trim();
				if (!identifier || seen.has(identifier)) {
					return;
				}

				seen.add(identifier);
				messages.push(normalizeMessage(message, identifier));
			});
		});

		return messages.sort((left, right) => Number(right.createdAtValue || 0) - Number(left.createdAtValue || 0));
	}

	function writeMessages(messages) {
		const serialized = JSON.stringify(Array.isArray(messages) ? messages : []);
		STORAGE_KEYS.forEach((key) => global.localStorage.setItem(key, serialized));
		dispatchChange();
	}

	function dispatchChange() {
		global.dispatchEvent(new CustomEvent(EVENT_NAME));
		global.dispatchEvent(new CustomEvent("byose:admin-data-changed", { detail: { module: "messages" } }));
	}

	function normalizeStatus(value) {
		const status = String(value || "new").trim().toLowerCase();
		if (status.includes("resolve") || status.includes("close")) {
			return "Resolved";
		}
		if (status.includes("read") || status.includes("review")) {
			return "Reviewed";
		}
		return "New";
	}

	function getStatusTone(value) {
		const status = normalizeStatus(value).toLowerCase();
		if (status === "resolved") {
			return "resolved";
		}
		if (status === "reviewed") {
			return "reviewed";
		}
		return "new";
	}

	function normalizeMessage(message, fallbackId) {
		const createdAtValue = normalizeTimestamp(message?.createdAt || message?.timestamp || message?.date);
		const status = normalizeStatus(message?.status);
		return {
			id: String(message?.id || fallbackId || `message-${Date.now()}`),
			name: String(message?.name || "Unknown sender").trim() || "Unknown sender",
			email: String(message?.email || "").trim().toLowerCase(),
			phone: String(message?.phone || "").trim(),
			message: String(message?.message || "").trim(),
			source: String(message?.source || "contact-form").trim() || "contact-form",
			status,
			createdAt: toIsoString(createdAtValue),
			createdAtValue,
			contactLabel: String(message?.email || message?.phone || "No contact info").trim() || "No contact info"
		};
	}

	function normalizeTimestamp(value) {
		const date = new Date(value || Date.now());
		return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
	}

	function toIsoString(value) {
		const date = new Date(value || Date.now());
		return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
	}

	function formatDate(value) {
		const date = new Date(value || Date.now());
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

	function truncate(value, limit) {
		const text = String(value || "").trim();
		if (text.length <= limit) {
			return text || "No message preview";
		}

		return `${text.slice(0, limit - 1).trim()}...`;
	}

	function getMessagesByFilter(filters) {
		const state = filters || {};
		const query = String(state.query || "").trim().toLowerCase();
		const status = String(state.status || "all").trim().toLowerCase();
		return readMessages().filter((message) => {
			if (status !== "all" && normalizeStatus(message.status).toLowerCase() !== status) {
				return false;
			}

			if (!query) {
				return true;
			}

			const haystack = [message.id, message.name, message.email, message.phone, message.message, message.source]
				.join(" ")
				.toLowerCase();
			return haystack.includes(query);
		});
	}

	function getMessageById(messageId) {
		return readMessages().find((message) => message.id === String(messageId || "")) || null;
	}

	function updateMessageStatus(messageId, nextStatus) {
		const id = String(messageId || "");
		const messages = readMessages().map((message) => {
			if (message.id !== id) {
				return message;
			}

			return {
				...message,
				status: normalizeStatus(nextStatus)
			};
		});

		writeMessages(messages);
		return getMessageById(id);
	}

	function deleteMessage(messageId) {
		const id = String(messageId || "");
		writeMessages(readMessages().filter((message) => message.id !== id));
	}

	function getMessageStats() {
		const messages = readMessages();
		const reviewed = messages.filter((message) => normalizeStatus(message.status) === "Reviewed").length;
		const resolved = messages.filter((message) => normalizeStatus(message.status) === "Resolved").length;
		const latest = messages[0] || null;
		return {
			total: messages.length,
			newCount: messages.length - reviewed - resolved,
			reviewed,
			resolved,
			latestLabel: latest ? `${latest.name} • ${formatDate(latest.createdAt)}` : "No messages yet"
		};
	}

	global.AdminMessagesService = {
		EVENT_NAME,
		STATUS_OPTIONS,
		escapeHtml,
		formatDate,
		formatDateTime,
		truncate,
		getStatusTone,
		normalizeStatus,
		getMessages: readMessages,
		filterMessages: getMessagesByFilter,
		getMessageById,
		updateMessageStatus,
		deleteMessage,
		getMessageStats
	};
})(window);
