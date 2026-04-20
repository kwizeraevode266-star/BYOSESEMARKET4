(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminProductsService;

	if (sidebar && typeof sidebar.init === 'function') {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const form = document.getElementById('productEditorForm');
	const status = document.getElementById('productEditorStatus');
	const preview = document.getElementById('productEditorPreview');

	function renderPreview(payload) {
		preview.innerHTML = `
			<div class="product-preview-card">
				<img src="${service.escapeHtml(payload.mainImage || '../../img/logo.png')}" alt="${service.escapeHtml(payload.name || 'Product preview')}">
				<div>
					<p class="product-preview-eyebrow">Website preview</p>
					<h3>${service.escapeHtml(payload.name || 'Product name')}</h3>
					<p>${service.escapeHtml(payload.shortDescription || 'Short description will appear here once provided.')}</p>
					<div class="product-preview-meta">
						<span>${service.escapeHtml(service.normalizeCategoryLabel(payload.category || 'general'))}</span>
						<strong>${service.formatCurrency(payload.price || 0)}</strong>
					</div>
				</div>
			</div>
		`;
	}

	function refreshPreview() {
		renderPreview(service.readProductForm(form));
	}

	form.addEventListener('input', refreshPreview);
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const payload = service.readProductForm(form);

		if (!payload.name || !payload.mainImage || !payload.shortDescription || Number(payload.price) <= 0) {
			status.textContent = 'Name, price, image, and short description are required.';
			status.dataset.state = 'error';
			return;
		}

		const created = service.createProduct(payload);
		if (!created) {
			status.textContent = 'The product could not be created.';
			status.dataset.state = 'error';
			return;
		}

		status.textContent = `${created.name} was added to the shared website catalog.`;
		status.dataset.state = 'success';
		window.setTimeout(() => {
			window.location.href = `view.html?id=${encodeURIComponent(created.id)}`;
		}, 700);
	});

	refreshPreview();
})();
