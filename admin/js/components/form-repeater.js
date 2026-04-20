(function (global) {
	"use strict";

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function createTextRepeater(config) {
		const container = config.container;
		const addButton = config.addButton;
		const placeholder = config.placeholder || "Value";
		const emptyText = config.emptyText || "No items yet.";
		let values = Array.isArray(config.values) ? config.values.slice() : [];

		function render() {
			if (!container) {
				return;
			}

			if (!values.length) {
				container.innerHTML = `<div class="editor-repeater-empty">${escapeHtml(emptyText)}</div>`;
				return;
			}

			container.innerHTML = values.map((value, index) => `
				<div class="editor-repeater-row">
					<input type="text" value="${escapeHtml(value)}" data-index="${index}" class="editor-repeater-input" placeholder="${escapeHtml(placeholder)}">
					<button type="button" class="editor-repeater-remove" data-remove-index="${index}" aria-label="Remove item">
						<i class="fa-solid fa-xmark" aria-hidden="true"></i>
					</button>
				</div>
			`).join("");
		}

		container?.addEventListener("input", (event) => {
			const input = event.target.closest("[data-index]");
			if (!input) {
				return;
			}

			const index = Number(input.dataset.index || 0);
			values[index] = String(input.value || "").trim();
		});

		container?.addEventListener("click", (event) => {
			const button = event.target.closest("[data-remove-index]");
			if (!button) {
				return;
			}

			const index = Number(button.dataset.removeIndex || 0);
			values.splice(index, 1);
			render();
		});

		addButton?.addEventListener("click", () => {
			values.push("");
			render();
		});

		render();

		return {
			getValues() {
				return values.map((value) => String(value || "").trim()).filter(Boolean);
			},
			setValues(nextValues) {
				values = Array.isArray(nextValues) ? nextValues.slice() : [];
				render();
			},
			render
		};
	}

	function createKeyValueRepeater(config) {
		const container = config.container;
		const addButton = config.addButton;
		const keyPlaceholder = config.keyPlaceholder || "Label";
		const valuePlaceholder = config.valuePlaceholder || "Value";
		const emptyText = config.emptyText || "No items yet.";
		let values = Array.isArray(config.values) ? config.values.map((entry) => Array.isArray(entry) ? [entry[0], entry[1]] : ["", ""]) : [];

		function render() {
			if (!container) {
				return;
			}

			if (!values.length) {
				container.innerHTML = `<div class="editor-repeater-empty">${escapeHtml(emptyText)}</div>`;
				return;
			}

			container.innerHTML = values.map((entry, index) => `
				<div class="editor-repeater-row editor-repeater-row--pair">
					<input type="text" value="${escapeHtml(entry[0])}" data-key-index="${index}" class="editor-repeater-input" placeholder="${escapeHtml(keyPlaceholder)}">
					<input type="text" value="${escapeHtml(entry[1])}" data-value-index="${index}" class="editor-repeater-input" placeholder="${escapeHtml(valuePlaceholder)}">
					<button type="button" class="editor-repeater-remove" data-remove-index="${index}" aria-label="Remove specification">
						<i class="fa-solid fa-xmark" aria-hidden="true"></i>
					</button>
				</div>
			`).join("");
		}

		container?.addEventListener("input", (event) => {
			const keyInput = event.target.closest("[data-key-index]");
			if (keyInput) {
				const index = Number(keyInput.dataset.keyIndex || 0);
				values[index][0] = String(keyInput.value || "").trim();
				return;
			}

			const valueInput = event.target.closest("[data-value-index]");
			if (valueInput) {
				const index = Number(valueInput.dataset.valueIndex || 0);
				values[index][1] = String(valueInput.value || "").trim();
			}
		});

		container?.addEventListener("click", (event) => {
			const button = event.target.closest("[data-remove-index]");
			if (!button) {
				return;
			}

			const index = Number(button.dataset.removeIndex || 0);
			values.splice(index, 1);
			render();
		});

		addButton?.addEventListener("click", () => {
			values.push(["", ""]);
			render();
		});

		render();

		return {
			getValues() {
				return values
					.map((entry) => [String(entry[0] || "").trim(), String(entry[1] || "").trim()])
					.filter((entry) => entry[0] && entry[1]);
			},
			setValues(nextValues) {
				values = Array.isArray(nextValues)
					? nextValues.map((entry) => Array.isArray(entry) ? [entry[0], entry[1]] : ["", ""])
					: [];
				render();
			},
			render
		};
	}

	global.AdminFormRepeater = {
		createKeyValueRepeater,
		createTextRepeater
	};
})(window);
