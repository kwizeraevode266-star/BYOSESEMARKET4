(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminReviewsService;

	if (sidebar && typeof sidebar.init === "function") {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const review = service.getReviewById(params.get("id") || "");
	const detail = document.getElementById("reviewDetailCard");
	const select = document.getElementById("reviewStatusSelect");
	const feedback = document.getElementById("reviewDetailFeedback");
	const deleteButton = document.getElementById("reviewDeleteButton");

	if (!detail) {
		return;
	}

	if (!review) {
		detail.innerHTML = '<div class="module-empty-state">The selected review could not be found.</div>';
		return;
	}

	if (select) {
		select.innerHTML = service.STATUS_OPTIONS.map((option) => `<option value="${service.escapeHtml(option)}" ${option === review.status ? "selected" : ""}>${service.escapeHtml(option)}</option>`).join("");
	}

	detail.innerHTML = `
		<div class="module-detail-head">
			<div>
				<p class="dashboard-eyebrow">Review Details</p>
				<h2>${service.escapeHtml(review.productName)}</h2>
			</div>
			<span class="module-status-pill module-status-pill--${service.getStatusTone(review.status)}">${service.escapeHtml(review.status)}</span>
		</div>
		<dl class="module-data-list">
			<div><dt>Customer</dt><dd>${service.escapeHtml(review.customerName)}</dd></div>
			<div><dt>Email</dt><dd>${service.escapeHtml(review.customerEmail || "Not provided")}</dd></div>
			<div><dt>Rating</dt><dd>${"★".repeat(review.rating || 0)}</dd></div>
			<div><dt>Date</dt><dd>${service.formatDateTime(review.createdAt)}</dd></div>
			<div><dt>Reference</dt><dd>${service.escapeHtml(review.id)}</dd></div>
			<div><dt>Product Id</dt><dd>${service.escapeHtml(review.productId || "Not provided")}</dd></div>
		</dl>
		<div class="module-note-box">${service.escapeHtml(review.comment || "No comment was stored with this review.")}</div>
	`;

	select?.addEventListener("change", () => {
		service.updateReviewStatus(review.id, select.value || "Pending");
		feedback.textContent = "Review status updated.";
		feedback.className = "module-feedback is-success";
	});

	deleteButton?.addEventListener("click", () => {
		service.deleteReview(review.id);
		window.location.href = "index.html";
	});
})();
