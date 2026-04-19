(function () {
	if (window.AdminSidebar && typeof window.AdminSidebar.init === 'function') {
		window.AdminSidebar.init();
	}

	const dashboardService = window.AdminDashboardService;
	const welcomeNode = document.getElementById('dashboardWelcomeText');
	const dateNode = document.getElementById('dashboardCurrentDate');
	const totalSalesNode = document.getElementById('dashboardTotalSales');
	const salesNoteNode = document.getElementById('dashboardSalesNote');
	const ordersCountNode = document.getElementById('dashboardOrdersCount');
	const ordersNoteNode = document.getElementById('dashboardOrdersNote');
	const customersCountNode = document.getElementById('dashboardCustomersCount');
	const customersNoteNode = document.getElementById('dashboardCustomersNote');
	const productsCountNode = document.getElementById('dashboardProductsCount');
	const productsNoteNode = document.getElementById('dashboardProductsNote');
	const activityTableBody = document.getElementById('dashboardActivityTableBody');
	const summaryList = document.getElementById('dashboardSummaryList');
	let refreshTimerId = null;

	if (dateNode) {
		const formatter = new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});

		dateNode.textContent = formatter.format(new Date());
	}

	if (welcomeNode) {
		const currentHour = new Date().getHours();
		let greeting = 'Welcome back';

		if (currentHour < 12) {
			greeting = 'Good morning';
		} else if (currentHour < 18) {
			greeting = 'Good afternoon';
		} else {
			greeting = 'Good evening';
		}

		welcomeNode.textContent = `${greeting}. Here is a clean overview of store activity and admin shortcuts.`;
	}

	function renderStats(snapshot) {
		if (!snapshot || !snapshot.stats || !dashboardService) {
			return;
		}

		if (totalSalesNode) totalSalesNode.textContent = dashboardService.formatCurrency(snapshot.stats.totalSales);
		if (salesNoteNode) salesNoteNode.textContent = snapshot.stats.salesNote;
		if (ordersCountNode) ordersCountNode.textContent = Number(snapshot.stats.ordersCount || 0).toLocaleString('en-US');
		if (ordersNoteNode) ordersNoteNode.textContent = snapshot.stats.ordersNote;
		if (customersCountNode) customersCountNode.textContent = Number(snapshot.stats.customersCount || 0).toLocaleString('en-US');
		if (customersNoteNode) customersNoteNode.textContent = snapshot.stats.customersNote;
		if (productsCountNode) productsCountNode.textContent = Number(snapshot.stats.productsCount || 0).toLocaleString('en-US');
		if (productsNoteNode) productsNoteNode.textContent = snapshot.stats.productsNote;
	}

	function renderActivity(snapshot) {
		if (!activityTableBody || !snapshot || !Array.isArray(snapshot.activity) || !dashboardService) {
			return;
		}

		if (!snapshot.activity.length) {
			activityTableBody.innerHTML = '<tr><td colspan="4" class="activity-empty-cell">No real orders, customers, messages, or visits have been recorded yet.</td></tr>';
			return;
		}

		activityTableBody.innerHTML = snapshot.activity.map((item) => `
			<tr>
				<td>${escapeHtml(item.type)}</td>
				<td>${escapeHtml(item.reference)}</td>
				<td><span class="status-pill status-${escapeHtml(item.statusTone)}">${escapeHtml(item.statusLabel)}</span></td>
				<td>${escapeHtml(item.details)}</td>
			</tr>
		`).join('');
	}

	function renderSummary(snapshot) {
		if (!summaryList || !snapshot || !Array.isArray(snapshot.summary)) {
			return;
		}

		summaryList.innerHTML = snapshot.summary.map((entry) => `
			<li>
				<span>${escapeHtml(entry.label)}</span>
				<strong>${escapeHtml(entry.value)}</strong>
			</li>
		`).join('');
	}

	function escapeHtml(value) {
		return String(value || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function refreshDashboard() {
		if (!dashboardService || typeof dashboardService.createSnapshot !== 'function') {
			return;
		}

		const snapshot = dashboardService.createSnapshot();
		renderStats(snapshot);
		renderActivity(snapshot);
		renderSummary(snapshot);
	}

	refreshDashboard();

	window.addEventListener('storage', refreshDashboard);
	window.addEventListener('focus', refreshDashboard);
	document.addEventListener('visibilitychange', () => {
		if (!document.hidden) {
			refreshDashboard();
		}
	});

	if (refreshTimerId) {
		window.clearInterval(refreshTimerId);
	}

	refreshTimerId = window.setInterval(() => {
		if (!document.hidden) {
			refreshDashboard();
		}
	}, 15000);
})();
