(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminHomepageService;

	if (sidebar && typeof sidebar.init === "function") {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const state = {
		section: String(params.get("section") || "hero")
	};
	const sectionConfig = {
		hero: {
			title: "Hero Slides",
			intro: "Manage the homepage hero images and slide labels used by the storefront slider.",
			buildFields(content) {
				return `
					<label class="module-field-span-2"><span>Hero Title</span><input name="title" type="text" value="${service.escapeHtml(content.hero.title)}"></label>
					<label class="module-field-span-2"><span>Slides</span><textarea name="slides" rows="8">${service.escapeHtml(content.hero.slides.map((slide) => `${slide.image} | ${slide.alt}`).join("\n"))}</textarea><small class="module-helper-text">One slide per line in the format image | alt text.</small></label>
				`;
			}
		},
		featured: {
			title: "Featured Products Section",
			intro: "Control the homepage featured products section headings and active filter pills.",
			buildFields(content) {
				return `
					<label><span>Eyebrow</span><input name="subheading" type="text" value="${service.escapeHtml(content.featured.subheading)}"></label>
					<label><span>Heading</span><input name="heading" type="text" value="${service.escapeHtml(content.featured.heading)}"></label>
					<label class="module-field-span-2"><span>Filters</span><input name="filters" type="text" value="${service.escapeHtml(content.featured.filters.join(", "))}"><small class="module-helper-text">Comma-separated values. These should match product categories or aliases used by the storefront.</small></label>
				`;
			}
		},
		banner: {
			title: "Quick Selection Banner",
			intro: "Manage the compact banner headline, supporting copy, and tag pills on the homepage.",
			buildFields(content) {
				return `
					<label><span>Heading</span><input name="title" type="text" value="${service.escapeHtml(content.banner.title)}"></label>
					<label class="module-field-span-2"><span>Body Text</span><textarea name="text" rows="5">${service.escapeHtml(content.banner.text)}</textarea></label>
					<label class="module-field-span-2"><span>Tags</span><input name="tags" type="text" value="${service.escapeHtml(content.banner.tags.join(", "))}"></label>
				`;
			}
		}
	};

	const tabs = Array.from(document.querySelectorAll("[data-homepage-section]"));
	const form = document.getElementById("homepageSectionForm");
	const title = document.getElementById("homepageSectionTitle");
	const intro = document.getElementById("homepageSectionIntro");
	const fields = document.getElementById("homepageSectionFields");
	const feedback = document.getElementById("homepageSectionFeedback");

	function getContent() {
		return service.getContent();
	}

	function setActiveTab() {
		tabs.forEach((button) => {
			button.classList.toggle("is-active", button.dataset.homepageSection === state.section);
		});
	}

	function renderSection() {
		const section = sectionConfig[state.section] || sectionConfig.hero;
		const content = getContent();
		setActiveTab();
		title.textContent = section.title;
		intro.textContent = section.intro;
		fields.innerHTML = section.buildFields(content);
	}

	function parseList(value) {
		return String(value || "").split(",").map((entry) => entry.trim()).filter(Boolean);
	}

	function parseSlides(value) {
		return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
			const parts = line.split("|");
			return {
				image: String(parts[0] || "").trim(),
				alt: String(parts.slice(1).join("|") || parts[0] || "Homepage slide").trim()
			};
		}).filter((slide) => slide.image);
	}

	form?.addEventListener("submit", (event) => {
		event.preventDefault();
		const data = new FormData(form);
		if (state.section === "hero") {
			service.saveSection("hero", {
				title: String(data.get("title") || "").trim(),
				slides: parseSlides(data.get("slides"))
			});
		} else if (state.section === "featured") {
			service.saveSection("featured", {
				heading: String(data.get("heading") || "").trim(),
				subheading: String(data.get("subheading") || "").trim(),
				filters: parseList(data.get("filters"))
			});
		} else {
			service.saveSection("banner", {
				title: String(data.get("title") || "").trim(),
				text: String(data.get("text") || "").trim(),
				tags: parseList(data.get("tags"))
			});
		}
		feedback.textContent = "Homepage configuration saved. The storefront will read this on the next page load.";
		feedback.className = "module-feedback is-success";
		renderSection();
	});

	tabs.forEach((button) => {
		button.addEventListener("click", () => {
			state.section = button.dataset.homepageSection || "hero";
			feedback.textContent = "";
			feedback.className = "module-feedback";
			renderSection();
		});
	});

	renderSection();
})();
