(function (global) {
	"use strict";

	const STORAGE_KEY = "byose_admin_settings_v1";
	const EVENT_NAME = "byose:settings-changed";
	const DEFAULT_SETTINGS = {
		general: {
			siteName: "Byose Market",
			tagline: "Smart shopping experience for Rwanda.",
			supportEmail: "byosemarket@gmail.com",
			supportPhonePrimary: "+250780430710",
			supportPhoneSecondary: "+250723731250",
			location: "Kigali, Rwanda",
			currency: "RWF",
			locale: "rw-RW"
		},
		branding: {
			logo: "img/logo.png",
			ogImage: "https://byosemarket.com/img/logo.png",
			accentColor: "#f97316",
			themeColor: "#101826"
		},
		delivery: {
			insideKigaliLabel: "Delivery to address",
			insideKigaliFee: "2000",
			pickupLabel: "Store pickup",
			pickupFee: "0",
			codEligibleCity: "Kigali",
			outsideKigaliNote: "Customers outside Kigali are required to pay before delivery."
		},
		seo: {
			title: "Byose Market Rwanda | Kugura Online Byoroshye",
			description: "Byose Market ni online shopping platform yo mu Rwanda igufasha kubona inkweto, imyenda, electronics n'ibindi ku giciro cyiza kandi mu buryo bworoshye.",
			keywords: "byose market, shopping app rwanda, kugura online kigali, inkweto, electronics, imyenda",
			canonicalUrl: "https://byosemarket.com",
			robots: "index, follow"
		}
	};

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
	}

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function getSettings() {
		const stored = safeParse(global.localStorage.getItem(STORAGE_KEY), {});
		return {
			general: { ...clone(DEFAULT_SETTINGS.general), ...stored.general },
			branding: { ...clone(DEFAULT_SETTINGS.branding), ...stored.branding },
			delivery: { ...clone(DEFAULT_SETTINGS.delivery), ...stored.delivery },
			seo: { ...clone(DEFAULT_SETTINGS.seo), ...stored.seo }
		};
	}

	function getSection(section) {
		const settings = getSettings();
		return settings[String(section || "general").trim()] || clone(DEFAULT_SETTINGS.general);
	}

	function saveSection(section, payload) {
		const settings = getSettings();
		settings[String(section || "general").trim()] = {
			...settings[String(section || "general").trim()],
			...payload
		};
		global.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		global.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { section } }));
		return settings;
	}

	function getOverviewCards() {
		const settings = getSettings();
		return [
			{ id: "general", label: "General", value: settings.general.siteName, note: settings.general.supportEmail },
			{ id: "branding", label: "Branding", value: settings.branding.logo, note: settings.branding.accentColor },
			{ id: "delivery", label: "Delivery", value: `${settings.delivery.insideKigaliFee} ${settings.general.currency}`, note: settings.delivery.outsideKigaliNote },
			{ id: "seo", label: "SEO", value: settings.seo.canonicalUrl, note: settings.seo.robots }
		];
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	global.AdminSettingsService = {
		EVENT_NAME,
		escapeHtml,
		getSettings,
		getSection,
		saveSection,
		getOverviewCards
	};
})(window);
