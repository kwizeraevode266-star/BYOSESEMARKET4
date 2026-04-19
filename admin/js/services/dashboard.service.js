(function () {
	const STORAGE_KEYS = {
		orders: ['byose_orders', 'orders'],
		users: ['bm_users', 'byose_market_users'],
		visits: 'byose_market_visitors_v1',
		messages: ['byose_market_messages', 'byose_messages']
	};

	function safeParse(value, fallback) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return fallback;
		}
	}

	function readStorageArray(keys) {
		const list = Array.isArray(keys) ? keys : [keys];
		for (const key of list) {
			const raw = window.localStorage.getItem(key);
			if (!raw) {
				continue;
			}

			const parsed = safeParse(raw, []);
			if (Array.isArray(parsed)) {
				return parsed;
			}
		}

		return [];
	}

	function readProducts() {
		const products = Array.isArray(window.products) ? window.products : [];
		const seen = new Set();

		return products.filter((item) => {
			const id = String(item && item.id ? item.id : '');
			if (!id || seen.has(id)) {
				return false;
			}

			seen.add(id);
			return true;
		});
	}

	function normalizeTimestamp(value) {
		if (!value) {
			return null;
		}

		const parsed = new Date(value).getTime();
		if (Number.isFinite(parsed) && parsed > 0) {
			return parsed;
		}

		const numberValue = Number(value);
		return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
	}

	function normalizeUser(user, index) {
		return {
			id: user && user.id ? String(user.id) : `user-${index}`,
			name: String((user && (user.name || user.email || user.phone)) || `User ${index + 1}`).trim(),
			createdAt: normalizeTimestamp(user && user.createdAt)
		};
	}

	function readUsers() {
		const users = readStorageArray(STORAGE_KEYS.users).map(normalizeUser);
		const unique = new Map();

		users.forEach((user) => {
			if (!unique.has(user.id)) {
				unique.set(user.id, user);
			}
		});

		return Array.from(unique.values());
	}

	function readVisits() {
		return readStorageArray(STORAGE_KEYS.visits)
			.filter((visit) => visit && visit.timestamp)
			.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
	}

	function normalizeMessage(message, index) {
		const createdAt = normalizeTimestamp(message && (message.createdAt || message.timestamp || message.date));
		const name = String(message && message.name ? message.name : `Contact ${index + 1}`).trim();
		const email = String(message && message.email ? message.email : '').trim();
		const phone = String(message && message.phone ? message.phone : '').trim();
		const content = String(message && message.message ? message.message : '').trim();

		return {
			id: String(message && message.id ? message.id : `message-${index}`),
			name,
			email,
			phone,
			message: content,
			createdAt,
			status: String(message && message.status ? message.status : 'new').trim() || 'new'
		};
	}

	function readMessages() {
		return readStorageArray(STORAGE_KEYS.messages)
			.map(normalizeMessage)
			.filter((message) => message && message.id)
			.sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
	}

	function normalizeOrder(order, index) {
		const rawStatus = String(order && order.status ? order.status : 'pending').trim();
		const total = Number(order && (order.totalPrice ?? order.total ?? order.subtotal)) || 0;
		const createdAt = normalizeTimestamp(order && (order.createdAt || order.date || order.timestamp));
		const customer = String(order && (order.customerName || order.name || order.userName || order.user || order.firstName || 'Guest customer')).trim() || 'Guest customer';
		const items = Array.isArray(order && order.products)
			? order.products
			: Array.isArray(order && order.items)
				? order.items
				: [];

		return {
			id: String(order && order.id ? order.id : `order-${index}`),
			status: rawStatus,
			total,
			createdAt,
			customer,
			itemsCount: items.length,
			items,
			source: 'orders'
		};
	}

	function readOrders() {
		const storageOrders = readStorageArray(STORAGE_KEYS.orders).map(normalizeOrder);
		const unique = new Map();

		storageOrders.forEach((order) => {
			if (!unique.has(order.id)) {
				unique.set(order.id, order);
			}
		});

		return Array.from(unique.values()).sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
	}

	function mapOrderStatus(status) {
		const normalized = String(status || '').toLowerCase();
		if (normalized.includes('deliver') || normalized.includes('complete')) {
			return { label: 'Completed', tone: 'completed' };
		}
		if (normalized.includes('ship')) {
			return { label: 'Shipped', tone: 'shipped' };
		}
		if (normalized.includes('process') || normalized.includes('payment')) {
			return { label: 'Processing', tone: 'processing' };
		}
		return { label: 'Pending', tone: 'review' };
	}

	function mapMessageStatus(status) {
		const normalized = String(status || '').toLowerCase();
		if (normalized.includes('resolved') || normalized.includes('closed')) {
			return { label: 'Resolved', tone: 'completed' };
		}
		if (normalized.includes('read')) {
			return { label: 'Reviewed', tone: 'shipped' };
		}
		return { label: 'New', tone: 'processing' };
	}

	function getRelativeTimeLabel(timestamp) {
		const value = Number(timestamp || 0);
		if (!value) {
			return 'No timestamp';
		}

		const elapsed = Date.now() - value;
		const minute = 60 * 1000;
		const hour = 60 * minute;
		const day = 24 * hour;

		if (elapsed < hour) {
			const minutes = Math.max(1, Math.round(elapsed / minute));
			return `${minutes} min ago`;
		}

		if (elapsed < day) {
			const hours = Math.max(1, Math.round(elapsed / hour));
			return `${hours} hr ago`;
		}

		const days = Math.max(1, Math.round(elapsed / day));
		return `${days} day${days === 1 ? '' : 's'} ago`;
	}

	function getRecentActivity(orders, visits, users, messages) {
		const orderActivity = orders.slice(0, 6).map((order) => {
			const status = mapOrderStatus(order.status);
			return {
				type: 'Order',
				reference: order.id,
				statusLabel: status.label,
				statusTone: status.tone,
				details: `${order.customer} • ${formatCurrency(order.total)} • ${getRelativeTimeLabel(order.createdAt)}`,
				date: order.createdAt
			};
		});

		const messageActivity = messages.slice(0, 4).map((message) => {
			const status = mapMessageStatus(message.status);
			const descriptor = message.email || message.phone || 'No contact info';
			return {
				type: 'Message',
				reference: message.name,
				statusLabel: status.label,
				statusTone: status.tone,
				details: `${descriptor} • ${truncateText(message.message, 54)} • ${getRelativeTimeLabel(message.createdAt)}`,
				date: message.createdAt
			};
		});

		const userActivity = users.slice(0, 3).map((user) => ({
			type: 'Customer',
			reference: user.id,
			statusLabel: 'Registered',
			statusTone: 'completed',
			details: `${user.name} • ${getRelativeTimeLabel(user.createdAt)}`,
			date: user.createdAt
		}));

		const visitActivity = visits.slice(0, 4).map((visit) => ({
			type: 'Visit',
			reference: visit.path || 'Site visit',
			statusLabel: 'Tracked',
			statusTone: 'shipped',
			details: `${String(visit.device || 'device').replace(/^./, (match) => match.toUpperCase())}${visit.city ? ` • ${visit.city}` : ''} • ${getRelativeTimeLabel(normalizeTimestamp(visit.timestamp))}`,
			date: normalizeTimestamp(visit.timestamp)
		}));

		return orderActivity
			.concat(messageActivity)
			.concat(userActivity)
			.concat(visitActivity)
			.sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
			.slice(0, 6);
	}

	function truncateText(value, limit) {
		const text = String(value || '').trim();
		if (text.length <= limit) {
			return text || 'No message preview';
		}

		return `${text.slice(0, limit - 1).trim()}...`;
	}

	function formatCurrency(value) {
		return `RWF ${Number(value || 0).toLocaleString('en-US')}`;
	}

	function countRecentUsers(users, now) {
		const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
		return users.filter((user) => Number(user.createdAt) && Number(user.createdAt) >= weekAgo).length;
	}

	function buildSummary(products, orders, users, visits, messages) {
		const pendingOrders = orders.filter((order) => mapOrderStatus(order.status).label === 'Pending').length;
		const newMessages = messages.filter((message) => mapMessageStatus(message.status).label === 'New').length;
		const recentOrders = orders.filter((order) => {
			const createdAt = Number(order.createdAt || 0);
			const now = Date.now();
			return createdAt && createdAt >= now - (24 * 60 * 60 * 1000);
		}).length;

		return [
			{
				label: 'Catalog coverage',
				value: products.length ? `${products.length} live products in the shop catalog` : 'No catalog products detected'
			},
			{
				label: 'Order queue',
				value: orders.length ? `${pendingOrders} pending from ${orders.length} total orders` : 'No saved orders in checkout history'
			},
			{
				label: 'Customer base',
				value: users.length ? `${users.length} registered users • ${countRecentUsers(users, Date.now())} joined this week` : 'No registered customers found'
			},
			{
				label: 'Support inbox',
				value: messages.length ? `${newMessages} new from ${messages.length} saved contact submissions` : 'No stored contact submissions yet'
			},
			{
				label: 'Site activity',
				value: visits.length ? `${visits.length} tracked visits • ${recentOrders} orders created today` : 'No tracked visits recorded yet'
			}
		];
	}

	function createSnapshot() {
		const products = readProducts();
		const orders = readOrders();
		const users = readUsers();
		const visits = readVisits();
		const messages = readMessages();
		const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
		const pendingOrders = orders.filter((order) => mapOrderStatus(order.status).label === 'Pending').length;
		const recentUsers = countRecentUsers(users, Date.now());
		const newMessages = messages.filter((message) => mapMessageStatus(message.status).label === 'New').length;

		return {
			stats: {
				totalSales,
				ordersCount: orders.length,
				ordersNote: orders.length ? `${pendingOrders} pending orders in checkout history` : 'No saved orders yet',
				customersCount: users.length,
				customersNote: users.length ? `${recentUsers} new customers in the last 7 days` : 'No registered customers yet',
				productsCount: products.length,
				productsNote: products.length ? 'Catalog count synced from the live product system' : 'No live products found',
				salesNote: orders.length ? `${formatCurrency(totalSales)} across ${orders.length} saved orders` : 'No recorded order totals yet',
				messagesCount: messages.length,
				messagesNote: messages.length ? `${newMessages} new support messages recorded` : 'No stored support messages yet'
			},
			activity: getRecentActivity(orders, visits, users, messages),
			summary: buildSummary(products, orders, users, visits, messages),
			raw: {
				products,
				orders,
				users,
				visits,
				messages
			}
		};
	}

	window.AdminDashboardService = {
		createSnapshot,
		formatCurrency,
		mapOrderStatus,
		mapMessageStatus
	};
})();
