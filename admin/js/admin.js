(function (global) {
	"use strict";

	function init() {
		global.dispatchEvent(new CustomEvent("byose:admin-ready", {
			detail: {
				path: global.location?.pathname || ""
			}
		}));
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init, { once: true });
	} else {
		init();
	}

	global.AdminApp = { init };
})(window);
