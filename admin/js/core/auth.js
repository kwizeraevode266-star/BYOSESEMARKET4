(function (global) {
	"use strict";

	const STORAGE_KEY = "byose_admin_session_v1";

	function safeParse(value) {
		try {
			return JSON.parse(value);
		} catch (error) {
			return null;
		}
	}

	function getSession() {
		return safeParse(global.localStorage.getItem(STORAGE_KEY));
	}

	function login(payload) {
		const session = {
			email: String(payload?.email || "").trim().toLowerCase(),
			name: String(payload?.name || payload?.email || "Admin").trim() || "Admin",
			loggedInAt: new Date().toISOString()
		};
		global.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
		return session;
	}

	function logout() {
		global.localStorage.removeItem(STORAGE_KEY);
	}

	function isLoggedIn() {
		return Boolean(getSession()?.email);
	}

	global.AdminAuthService = {
		getSession,
		login,
		logout,
		isLoggedIn
	};
})(window);
