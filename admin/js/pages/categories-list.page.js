(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminCategoriesService;

	if (sidebar && typeof sidebar.init === "function") {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const editId = String(params.get("id") || "");
	const elements = {
		searchInput: document.getElementById("categoriesSearchInput"),
		resultsText: document.getElementById("categoriesResultsText"),
		tableBody: document.getElementById("categoriesTableBody"),
		mobileGrid: document.getElementById("categoriesMobileGrid"),
		form: document.getElementById("categoryEditorForm"),
		feedback: document.getElementById("categoryFormStatus"),
		resetButton: document.getElementById("categoryResetButton"),
		fields: {
			id: document.getElementById("categoryIdInput"),
			name: document.getElementById("categoryNameInput"),
			label: document.getElementById("categoryLabelInput"),
			image: document.getElementById("categoryImageInput"),
			description: document.getElementById("categoryDescriptionInput")
		},
		stats: {
			total: document.getElementById("categoriesTotalStat"),
			linked: document.getElementById("categoriesLinkedStat"),
			custom: document.getElementById("categoriesCustomStat"),
			products: document.getElementById("categoriesProductsStat")
		}
	};

	const state = { query: String(elements.searchInput?.value || "") };

	function getFilteredCategories() {
		const query = String(state.query || "").trim().toLowerCase();
		return service.getCategories().filter((category) => {
			if (!query) {
				return true;
			}
			return [category.label, category.description, category.id].join(" ").toLowerCase().includes(query);
		});
	}

	function createRow(category) {
		return `
			<tr>
				<td><strong>${service.escapeHtml(category.label)}</strong></td>
				<td>${service.escapeHtml(category.id)}</td>
				<td>${service.escapeHtml(category.description || "No description")}</td>
				<td>${category.productCount}</td>
				<td>${category.isCustom ? "Custom" : "Catalog"}</td>
				<td><div class="module-actions-inline"><button type="button" data-action="edit" data-id="${service.escapeHtml(category.id)}">Edit</button><button type="button" data-action="delete" data-id="${service.escapeHtml(category.id)}">Delete</button></div></td>
			</tr>
		`;
	}

	function createCard(category) {
		return `
			<article class="module-mobile-card">
				<strong>${service.escapeHtml(category.label)}</strong>
				<small>${service.escapeHtml(category.id)}</small>
				<p>${service.escapeHtml(category.description || "No description")}</p>
				<div class="module-summary-list"><li><span>Products</span><strong>${category.productCount}</strong></li><li><span>Type</span><strong>${category.isCustom ? "Custom" : "Catalog"}</strong></li></div>
				<div class="module-actions-inline"><button type="button" data-action="edit" data-id="${service.escapeHtml(category.id)}">Edit</button><button type="button" data-action="delete" data-id="${service.escapeHtml(category.id)}">Delete</button></div>
			</article>
		`;
	}

	function populateForm(category) {
		elements.fields.id.value = category?.id || "";
		elements.fields.name.value = category?.id || "";
		elements.fields.label.value = category?.label || "";
		elements.fields.image.value = category?.image || "";
		elements.fields.description.value = category?.description || "";
	}

	function renderStats(categories) {
		const totals = service.getCategories();
		elements.stats.total.textContent = String(totals.length);
		elements.stats.linked.textContent = String(totals.filter((category) => category.productCount > 0).length);
		elements.stats.custom.textContent = String(totals.filter((category) => category.isCustom).length);
		elements.stats.products.textContent = String(totals.reduce((sum, category) => sum + Number(category.productCount || 0), 0));
		elements.resultsText.textContent = `${categories.length} category${categories.length === 1 ? "" : "ies"} found`;
	}

	function renderCategories() {
		const categories = getFilteredCategories();
		renderStats(categories);
		if (!categories.length) {
			elements.tableBody.innerHTML = '<tr><td colspan="6" class="module-empty-row">No categories match the current search.</td></tr>';
			elements.mobileGrid.innerHTML = '<div class="module-empty-state">No categories match the current search.</div>';
			return;
		}
		elements.tableBody.innerHTML = categories.map(createRow).join("");
		elements.mobileGrid.innerHTML = categories.map(createCard).join("");
	}

	function resetForm() {
		populateForm(null);
		elements.feedback.textContent = "";
		elements.feedback.className = "module-feedback";
	}

	function handleAction(event) {
		const action = event.target.closest("[data-action][data-id]");
		if (!action) {
			return;
		}
		const category = service.getCategoryById(action.dataset.id || "");
		if (!category) {
			return;
		}

		if (action.dataset.action === "edit") {
			populateForm(category);
			elements.feedback.textContent = `Editing ${category.label}. Save to update the product editor category list.`;
			elements.feedback.className = "module-feedback";
			return;
		}

		service.deleteCategory(category.id);
		if (elements.fields.id.value === category.id) {
			resetForm();
		}
		renderCategories();
	}

	elements.form?.addEventListener("submit", (event) => {
		event.preventDefault();
		const saved = service.saveCategory({
			id: elements.fields.id.value,
			name: elements.fields.name.value,
			label: elements.fields.label.value,
			image: elements.fields.image.value,
			description: elements.fields.description.value
		});
		populateForm(saved);
		elements.feedback.textContent = `${saved.label} saved. Product editors now use the updated category list.`;
		elements.feedback.className = "module-feedback is-success";
		renderCategories();
	});

	elements.resetButton?.addEventListener("click", resetForm);
	elements.searchInput?.addEventListener("input", () => {
		state.query = elements.searchInput.value || "";
		renderCategories();
	});
	elements.tableBody?.addEventListener("click", handleAction);
		elements.mobileGrid?.addEventListener("click", handleAction);
	window.addEventListener(service.EVENT_NAME, renderCategories);

	if (editId) {
		populateForm(service.getCategoryById(editId));
	}

	renderCategories();
})();
