(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminMediaService;

	if (sidebar && typeof sidebar.init === "function") {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const elements = {
		searchInput: document.getElementById("mediaSearchInput"),
		typeFilter: document.getElementById("mediaTypeFilter"),
		grid: document.getElementById("mediaLibraryGrid"),
		status: document.getElementById("mediaUploadStatus"),
		fileInput: document.getElementById("mediaUploadInput"),
		nameInput: document.getElementById("mediaNameInput"),
		urlInput: document.getElementById("mediaUrlInput"),
		stats: {
			total: document.getElementById("mediaTotalStat"),
			uploaded: document.getElementById("mediaUploadedStat"),
			catalog: document.getElementById("mediaCatalogStat"),
			latest: document.getElementById("mediaLatestNote")
		}
	};

	const state = { query: "", type: "all" };

	function renderStats() {
		const stats = service.getMediaStats();
		elements.stats.total.textContent = String(stats.total);
		elements.stats.uploaded.textContent = String(stats.uploaded);
		elements.stats.catalog.textContent = String(stats.catalog);
		elements.stats.latest.textContent = stats.latestLabel;
	}

	function renderGrid() {
		const items = service.getMediaItems(state);
		if (!items.length) {
			elements.grid.innerHTML = '<div class="module-empty-state">No media assets match the current filters.</div>';
			return;
		}
		elements.grid.innerHTML = items.map((item) => `
			<article class="module-media-card">
				<img src="${service.escapeHtml(item.url)}" alt="${service.escapeHtml(item.name)}">
				<div class="module-card-stack">
					<strong>${service.escapeHtml(item.name)}</strong>
					<small>${service.escapeHtml(item.origin)} • ${service.escapeHtml(item.sizeLabel || item.type)}</small>
				</div>
				<div class="module-actions-inline">
					<a href="${service.escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open</a>
					${item.origin === "uploaded" ? `<button type="button" data-action="delete" data-id="${service.escapeHtml(item.id)}">Delete</button>` : ""}
				</div>
			</article>
		`).join("");
	}

	function rerender() {
		renderStats();
		renderGrid();
	}

	function showStatus(message, type) {
		elements.status.textContent = message;
		elements.status.className = type ? `module-feedback is-${type}` : "module-feedback";
	}

	function saveUpload(payload) {
		service.addMediaItem(payload);
		elements.nameInput.value = "";
		elements.urlInput.value = "";
		if (elements.fileInput) {
			elements.fileInput.value = "";
		}
		showStatus("Media asset saved.", "success");
		rerender();
	}

	elements.fileInput?.addEventListener("change", () => {
		const file = elements.fileInput.files?.[0];
		if (!file) {
			return;
		}
		const reader = new FileReader();
		reader.onload = () => saveUpload({
			name: elements.nameInput.value || file.name,
			url: String(reader.result || ""),
			type: file.type || "uploaded",
			sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`
		});
		reader.onerror = () => showStatus("The selected file could not be read.", "error");
		reader.readAsDataURL(file);
	});

	document.getElementById("mediaUploadForm")?.addEventListener("submit", (event) => {
		event.preventDefault();
		if (elements.urlInput.value.trim()) {
			saveUpload({
				name: elements.nameInput.value || "External asset",
				url: elements.urlInput.value,
				type: "external",
				sizeLabel: "URL"
			});
			return;
		}
		showStatus("Choose a file or enter an image URL.", "error");
	});

	elements.searchInput?.addEventListener("input", () => {
		state.query = elements.searchInput.value || "";
		renderGrid();
	});
	elements.typeFilter?.addEventListener("change", () => {
		state.type = elements.typeFilter.value || "all";
		renderGrid();
	});
	elements.grid?.addEventListener("click", (event) => {
		const button = event.target.closest("[data-action='delete'][data-id]");
		if (!button) {
			return;
		}
		service.deleteMediaItem(button.dataset.id || "");
		rerender();
	});
	window.addEventListener(service.EVENT_NAME, rerender);

	rerender();
})();
