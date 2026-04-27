(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminSettingsService;

	if (sidebar && typeof sidebar.init === "function") {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const state = {
		section: String(params.get("section") || "general")
	};
	const sections = {
		general: {
			title: "General Store Settings",
			intro: "Core store identity and support contact information used across the website.",
			fields(section) {
				return `
					<label><span>Site Name</span><input name="siteName" type="text" value="${service.escapeHtml(section.siteName)}"></label>
					<label><span>Tagline</span><input name="tagline" type="text" value="${service.escapeHtml(section.tagline)}"></label>
					<label><span>Support Email</span><input name="supportEmail" type="email" value="${service.escapeHtml(section.supportEmail)}"></label>
					<label><span>Primary Phone</span><input name="supportPhonePrimary" type="text" value="${service.escapeHtml(section.supportPhonePrimary)}"></label>
					<label><span>Secondary Phone</span><input name="supportPhoneSecondary" type="text" value="${service.escapeHtml(section.supportPhoneSecondary)}"></label>
					<label><span>Location</span><input name="location" type="text" value="${service.escapeHtml(section.location)}"></label>
					<label><span>Currency</span><input name="currency" type="text" value="${service.escapeHtml(section.currency)}"></label>
					<label><span>Locale</span><input name="locale" type="text" value="${service.escapeHtml(section.locale)}"></label>
				`;
			}
		},
		branding: {
			title: "Branding",
			intro: "Logo and visual tokens that should be reflected across the storefront UI.",
			fields(section) {
				return `
					<label class="module-field-span-2"><span>Logo Path</span><input name="logo" type="text" value="${service.escapeHtml(section.logo)}"></label>
					<label class="module-field-span-2"><span>Open Graph Image</span><input name="ogImage" type="text" value="${service.escapeHtml(section.ogImage)}"></label>
					<label><span>Accent Color</span><input name="accentColor" type="text" value="${service.escapeHtml(section.accentColor)}"></label>
					<label><span>Theme Color</span><input name="themeColor" type="text" value="${service.escapeHtml(section.themeColor)}"></label>
				`;
			}
		},
		delivery: {
			title: "Delivery",
			intro: "Delivery method labels, fees, and messaging used by checkout and order summaries.",
			fields(section) {
				return `
					<label><span>Primary Delivery Label</span><input name="insideKigaliLabel" type="text" value="${service.escapeHtml(section.insideKigaliLabel)}"></label>
					<label><span>Primary Delivery Fee</span><input name="insideKigaliFee" type="text" value="${service.escapeHtml(section.insideKigaliFee)}"></label>
					<label><span>Pickup Label</span><input name="pickupLabel" type="text" value="${service.escapeHtml(section.pickupLabel)}"></label>
					<label><span>Pickup Fee</span><input name="pickupFee" type="text" value="${service.escapeHtml(section.pickupFee)}"></label>
					<label><span>COD Eligible City</span><input name="codEligibleCity" type="text" value="${service.escapeHtml(section.codEligibleCity)}"></label>
					<label class="module-field-span-2"><span>Outside Kigali Note</span><textarea name="outsideKigaliNote" rows="5">${service.escapeHtml(section.outsideKigaliNote)}</textarea></label>
				`;
			}
		},
		seo: {
			title: "SEO",
			intro: "Homepage title, meta description, keywords, canonical URL, and robots directives.",
			fields(section) {
				return `
					<label class="module-field-span-2"><span>Title</span><input name="title" type="text" value="${service.escapeHtml(section.title)}"></label>
					<label class="module-field-span-2"><span>Description</span><textarea name="description" rows="5">${service.escapeHtml(section.description)}</textarea></label>
					<label class="module-field-span-2"><span>Keywords</span><input name="keywords" type="text" value="${service.escapeHtml(section.keywords)}"></label>
					<label><span>Canonical URL</span><input name="canonicalUrl" type="url" value="${service.escapeHtml(section.canonicalUrl)}"></label>
					<label><span>Robots</span><input name="robots" type="text" value="${service.escapeHtml(section.robots)}"></label>
				`;
			}
		}
	};

	const tabs = Array.from(document.querySelectorAll("[data-settings-section]"));
	const overview = document.getElementById("settingsOverviewGrid");
	const form = document.getElementById("settingsSectionForm");
	const title = document.getElementById("settingsSectionTitle");
	const intro = document.getElementById("settingsSectionIntro");
	const fields = document.getElementById("settingsSectionFields");
	const feedback = document.getElementById("settingsSectionFeedback");

	function renderOverview() {
		overview.innerHTML = service.getOverviewCards().map((card) => `
			<article class="module-card">
				<div class="module-card-stack">
					<span>${service.escapeHtml(card.label)}</span>
					<strong>${service.escapeHtml(card.value)}</strong>
					<small>${service.escapeHtml(card.note)}</small>
				</div>
			</article>
		`).join("");
	}

	function renderSection() {
		const config = sections[state.section] || sections.general;
		const section = service.getSection(state.section);
		tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.settingsSection === state.section));
		title.textContent = config.title;
		intro.textContent = config.intro;
		fields.innerHTML = config.fields(section);
	}

	form?.addEventListener("submit", (event) => {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(form).entries());
		service.saveSection(state.section, data);
		feedback.textContent = "Settings saved. Storefront runtime hooks can use the updated values immediately or on the next page load.";
		feedback.className = "module-feedback is-success";
		renderOverview();
		renderSection();
	});

	tabs.forEach((button) => {
		button.addEventListener("click", () => {
			state.section = button.dataset.settingsSection || "general";
			renderSection();
		});
	});

	renderOverview();
	renderSection();
})();
