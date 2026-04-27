(function () {
	const auth = window.AdminAuthService;
	const form = document.getElementById("adminLoginForm");
	const feedback = document.getElementById("adminSessionStatus");
	const logoutButton = document.getElementById("adminLogoutButton");
	const sessionName = document.getElementById("adminSessionName");
	const sessionEmail = document.getElementById("adminSessionEmail");

	if (!auth || !form) {
		return;
	}

	function renderSession() {
		const session = auth.getSession();
		if (!session) {
			sessionName.textContent = "No admin session";
			sessionEmail.textContent = "Use this local admin access form to open the dashboard workspace session.";
			logoutButton.hidden = true;
			return;
		}

		sessionName.textContent = session.name || "Admin";
		sessionEmail.textContent = session.email || "No email";
		logoutButton.hidden = false;
	}

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const data = new FormData(form);
		const email = String(data.get("email") || "").trim();
		const name = String(data.get("name") || "").trim();
		if (!email) {
			feedback.textContent = "Enter an email to create the local admin session.";
			feedback.className = "module-feedback is-error";
			return;
		}
		auth.login({ email, name });
		feedback.textContent = "Admin session started. Redirecting to the dashboard...";
		feedback.className = "module-feedback is-success";
		renderSession();
		window.setTimeout(() => {
			window.location.href = "dashboard.html";
		}, 250);
	});

	logoutButton?.addEventListener("click", () => {
		auth.logout();
		feedback.textContent = "Admin session cleared.";
		feedback.className = "module-feedback";
		renderSession();
	});

	renderSession();
})();
