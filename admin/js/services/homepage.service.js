(function (global) {
	"use strict";

	const STORAGE_KEY = "byose_admin_homepage_v1";
	const EVENT_NAME = "byose:homepage-changed";
	const DEFAULT_STATE = {
		hero: {
			title: "Byose Market Rwanda | Kugura Online Byoroshye",
			slides: [
				{ image: "img/hiro1 inketo.jpg", alt: "Inkweto promotions" },
				{ image: "img/hiro 2 ibikapu.jpg", alt: "Ibikapu promotions" },
				{ image: "img/hiro 3 imyenda.jpg", alt: "Imyenda promotions" },
				{ image: "img/hiro  4 electronics.jpg", alt: "Electronics promotions" }
			]
		},
		featured: {
			heading: "Top deals kuri Home",
			subheading: "Explore products",
			filters: ["all", "fashion", "electronics", "shoes", "bags", "watches", "phones"]
		},
		banner: {
			title: "Dense layout, products nyinshi, no wasted space.",
			text: "Home ni iyo kureba no guhitamo. Cart ibikorwa bisigaye kuri product details na cart page.",
			tags: ["Top rated", "Fast moving", "New arrivals", "Best value"]
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

	function getContent() {
		const stored = safeParse(global.localStorage.getItem(STORAGE_KEY), {});
		return {
			hero: {
				...clone(DEFAULT_STATE.hero),
				...stored.hero,
				slides: Array.isArray(stored?.hero?.slides) && stored.hero.slides.length ? stored.hero.slides : clone(DEFAULT_STATE.hero.slides)
			},
			featured: {
				...clone(DEFAULT_STATE.featured),
				...stored.featured,
				filters: Array.isArray(stored?.featured?.filters) && stored.featured.filters.length ? stored.featured.filters : clone(DEFAULT_STATE.featured.filters)
			},
			banner: {
				...clone(DEFAULT_STATE.banner),
				...stored.banner,
				tags: Array.isArray(stored?.banner?.tags) && stored.banner.tags.length ? stored.banner.tags : clone(DEFAULT_STATE.banner.tags)
			}
		};
	}

	function saveSection(section, payload) {
		const current = getContent();
		current[String(section || "").trim()] = {
			...current[String(section || "").trim()],
			...payload
		};
		global.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
		global.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { section } }));
		return current;
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	global.AdminHomepageService = {
		EVENT_NAME,
		escapeHtml,
		getContent,
		saveSection
	};
})(window);
