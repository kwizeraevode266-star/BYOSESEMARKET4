(function () {
	const sidebar = window.AdminSidebar;
	const service = window.AdminReviewsService;

	if (sidebar && typeof sidebar.init === "function") {
		sidebar.init();
	}

	if (!service) {
		return;
	}

	const elements = {
		searchInput: document.getElementById("reviewsSearchInput"),
		statusFilter: document.getElementById("reviewsStatusFilter"),
		resultsText: document.getElementById("reviewsResultsText"),
		tableBody: document.getElementById("reviewsTableBody"),
		mobileGrid: document.getElementById("reviewsMobileGrid"),
		stats: {
			total: document.getElementById("reviewsTotalStat"),
			approved: document.getElementById("reviewsApprovedStat"),
			pending: document.getElementById("reviewsPendingStat"),
			average: document.getElementById("reviewsAverageStat")
		}
	};

	const state = { query: "", status: "all" };

	function createStatusSelect(review) {
		return `<select class="module-inline-select" data-action="status" data-id="${service.escapeHtml(review.id)}">${service.STATUS_OPTIONS.map((option) => `<option value="${service.escapeHtml(option)}" ${option === review.status ? "selected" : ""}>${service.escapeHtml(option)}</option>`).join("")}</select>`;
	}

	function createRow(review) {
		return `
			<tr>
				<td><div class="module-cell-stack"><strong>${service.escapeHtml(review.productName)}</strong><small>${service.escapeHtml(review.productId || "No product id")}</small></div></td>
				<td><div class="module-cell-stack"><strong>${service.escapeHtml(review.customerName)}</strong><small>${service.escapeHtml(review.customerEmail || "No email")}</small></div></td>
				<td>${"★".repeat(review.rating || 0)}</td>
				<td>${service.escapeHtml(review.comment || "No comment")}</td>
				<td><span class="module-status-pill module-status-pill--${service.getStatusTone(review.status)}">${service.escapeHtml(review.status)}</span></td>
				<td>${service.formatDateTime(review.createdAt)}</td>
				<td><div class="module-actions-inline">${createStatusSelect(review)}<a href="details.html?id=${encodeURIComponent(review.id)}">Open</a></div></td>
			</tr>
		`;
	}

	function createCard(review) {
		return `
			<article class="module-mobile-card">
				<strong>${service.escapeHtml(review.productName)}</strong>
				<small>${service.escapeHtml(review.customerName)}</small>
				<span>${"★".repeat(review.rating || 0)}</span>
				<p>${service.escapeHtml(review.comment || "No comment")}</p>
				<span class="module-status-pill module-status-pill--${service.getStatusTone(review.status)}">${service.escapeHtml(review.status)}</span>
				${createStatusSelect(review)}
				<div class="module-actions-inline"><a href="details.html?id=${encodeURIComponent(review.id)}">Open</a></div>
			</article>
		`;
	}

	function renderStats() {
		const stats = service.getReviewStats();
		elements.stats.total.textContent = String(stats.total);
		elements.stats.approved.textContent = String(stats.approved);
		elements.stats.pending.textContent = String(stats.pending);
		elements.stats.average.textContent = String(stats.averageRating);
	}

	function renderReviews() {
		const reviews = service.filterReviews(state);
		elements.resultsText.textContent = `${reviews.length} review${reviews.length === 1 ? "" : "s"} found`;
		if (!reviews.length) {
			elements.tableBody.innerHTML = '<tr><td colspan="7" class="module-empty-row">No real review records are stored yet.</td></tr>';
			elements.mobileGrid.innerHTML = '<div class="module-empty-state">No real review records are stored yet.</div>';
			return;
		}
		elements.tableBody.innerHTML = reviews.map(createRow).join("");
		elements.mobileGrid.innerHTML = reviews.map(createCard).join("");
	}

	function rerender() {
		renderStats();
		renderReviews();
	}

	function handleChange(event) {
		const select = event.target.closest("select[data-action='status'][data-id]");
		if (!select) {
			return;
		}
		service.updateReviewStatus(select.dataset.id || "", select.value || "Pending");
		rerender();
	}

	elements.searchInput?.addEventListener("input", () => {
		state.query = elements.searchInput.value || "";
		renderReviews();
	});
	elements.statusFilter?.addEventListener("change", () => {
		state.status = elements.statusFilter.value || "all";
		renderReviews();
	});
	elements.tableBody?.addEventListener("change", handleChange);
		elements.mobileGrid?.addEventListener("change", handleChange);
	window.addEventListener(service.EVENT_NAME, rerender);

	rerender();
})();
