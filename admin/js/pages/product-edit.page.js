(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminProductsService;

	if (sidebar && typeof sidebar.init === 'function') {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const productId = service.getProductIdFromLocation();
	const form = document.getElementById('productEditorForm');
	const status = document.getElementById('productEditorStatus');
	const preview = document.getElementById('productEditorPreview');
	const title = document.getElementById('productEditorTitle');
	const subtitle = document.getElementById('productEditorSubtitle');
	const product = service.getProductById(productId);

	if (!product) {
		status.textContent = 'The selected product could not be found in the shared catalog.';
		status.dataset.state = 'error';
		form.hidden = true;
		return;
	}

	title.textContent = `Edit ${product.name}`;
	subtitle.textContent = `Product ID ${product.id} updates the website catalog everywhere.`;
	service.populateProductForm(form, product);

	function renderPreview(payload) {
		preview.innerHTML = `
			<div class="product-preview-card">
				<img src="${service.escapeHtml(payload.mainImage || '../../img/logo.png')}" alt="${service.escapeHtml(payload.name || product.name)}">
				<div>
					<p class="product-preview-eyebrow">Website preview</p>
					<h3>${service.escapeHtml(payload.name || product.name)}</h3>
					<p>${service.escapeHtml(payload.shortDescription || product.shortDescription || '')}</p>
					<div class="product-preview-meta">
						<span>${service.escapeHtml(service.normalizeCategoryLabel(payload.category || product.category || 'general'))}</span>
						<strong>${service.formatCurrency(payload.price || product.price || 0)}</strong>
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

		const updated = service.updateProduct(product.id, payload);
		if (!updated) {
			status.textContent = 'The product could not be updated.';
			status.dataset.state = 'error';
			return;
		}

		status.textContent = `${updated.name} is now updated across the website catalog.`;
		status.dataset.state = 'success';
		window.setTimeout(() => {
			window.location.href = `view.html?id=${encodeURIComponent(updated.id)}`;
		}, 700);
	});

	refreshPreview();
})();
