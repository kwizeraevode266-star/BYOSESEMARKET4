(function () {
	"use strict";

	const SETTINGS_KEY = "byose_admin_settings_v1";
	const HOMEPAGE_KEY = "byose_admin_homepage_v1";

	function safeParse(value, fallbackValue) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallbackValue;
		}
	}

	function getSitePrefix() {
		const path = String(window.location?.pathname || "");
		if (path.indexOf("/account/settings/") !== -1) {
			return "../../";
		}
		if (
			path.indexOf("/account/") !== -1 ||
			path.indexOf("/logout/") !== -1 ||
			path.indexOf("/components/") !== -1 ||
			path.indexOf("/details/") !== -1 ||
			path.indexOf("/shop/") !== -1 ||
			path.indexOf("/auth/") !== -1
		) {
			return "../";
		}
		return "";
	}

	function resolveAsset(path) {
		const value = String(path || "").trim();
		if (!value) {
			return value;
		}
		if (/^(?:https?:|data:|blob:)/i.test(value)) {
			return value;
		}
		if (value.startsWith("/")) {
			return value;
		}
		return getSitePrefix() + value.replace(/^\.\//, "");
	}

	function setMeta(selector, attribute, value) {
		const node = document.querySelector(selector);
		if (node && value) {
			node.setAttribute(attribute, value);
		}
	}

	function applySettings() {
		const settings = safeParse(localStorage.getItem(SETTINGS_KEY), null);
		if (!settings || typeof settings !== "object") {
			return;
		}

		const branding = settings.branding || {};
		const general = settings.general || {};
		const seo = settings.seo || {};

		document.querySelectorAll(".brand-logo").forEach((image) => {
			if (branding.logo) {
				image.src = resolveAsset(branding.logo);
				image.alt = `${general.siteName || "Byose Market"} logo`;
			}
		});

		if (branding.accentColor) {
			document.documentElement.style.setProperty("--store-admin-accent", branding.accentColor);
		}

		setMeta('meta[name="theme-color"]', 'content', branding.themeColor || "");

		if (document.body.classList.contains("home-page")) {
			if (seo.title) {
				document.title = seo.title;
			}
			setMeta('meta[name="description"]', 'content', seo.description || "");
			setMeta('meta[name="keywords"]', 'content', seo.keywords || "");
			setMeta('meta[name="robots"]', 'content', seo.robots || "");
			setMeta('meta[property="og:image"]', 'content', branding.ogImage || "");
			setMeta('meta[name="twitter:image"]', 'content', branding.ogImage || "");
			setMeta('link[rel="canonical"]', 'href', seo.canonicalUrl || "");
		}
	}

	function applyHomepageConfig() {
		if (!document.body.classList.contains("home-page")) {
			return;
		}

		const homepage = safeParse(localStorage.getItem(HOMEPAGE_KEY), null);
		if (!homepage || typeof homepage !== "object") {
			return;
		}

		const heroSlides = Array.isArray(homepage?.hero?.slides) ? homepage.hero.slides.filter((slide) => slide?.image) : [];
		const slidesRoot = document.querySelector('.hero-slides');
		if (slidesRoot && heroSlides.length) {
			slidesRoot.innerHTML = heroSlides.map((slide, index) => `<img class="hero-slide${index === 0 ? ' active' : ''}" src="${resolveAsset(slide.image)}" alt="${String(slide.alt || 'Homepage slide').replace(/"/g, '&quot;')}" loading="${index === 0 ? 'eager' : 'lazy'}">`).join('');
		}

		const featuredSection = document.getElementById('homeProducts');
		if (featuredSection) {
			const eyebrow = featuredSection.querySelector('.section-kicker');
			const heading = featuredSection.querySelector('h2');
			if (eyebrow && homepage?.featured?.subheading) {
				eyebrow.textContent = homepage.featured.subheading;
			}
			if (heading && homepage?.featured?.heading) {
				heading.textContent = homepage.featured.heading;
			}
		}

		const filterPills = document.getElementById('filterPills');
		if (filterPills && Array.isArray(homepage?.featured?.filters) && homepage.featured.filters.length) {
			filterPills.innerHTML = homepage.featured.filters.map((filter, index) => `<button type="button" class="filter-pill${index === 0 ? ' is-active' : ''}" data-filter="${String(filter || '').trim()}">${String(filter || '').trim().replace(/(^\w|[- ]\w)/g, (match) => match.replace(/[- ]/, ' ').toUpperCase())}</button>`).join('');
		}

		const banner = document.querySelector('.compact-banner');
		if (banner) {
			const title = banner.querySelector('.banner-copy h2');
			const text = banner.querySelector('.banner-copy p');
			const tags = banner.querySelector('.banner-tags');
			if (title && homepage?.banner?.title) {
				title.textContent = homepage.banner.title;
			}
			if (text && homepage?.banner?.text) {
				text.textContent = homepage.banner.text;
			}
			if (tags && Array.isArray(homepage?.banner?.tags) && homepage.banner.tags.length) {
				tags.innerHTML = homepage.banner.tags.map((tag) => `<span>${String(tag || '').trim()}</span>`).join('');
			}
		}
	}

	function init() {
		applySettings();
		applyHomepageConfig();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init, { once: true });
	} else {
		init();
	}
})();