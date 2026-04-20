(function (global) {
	"use strict";

	function readFileAsDataUrl(file) {
		return new Promise((resolve, reject) => {
			if (!(file instanceof File)) {
				reject(new Error("A valid file is required."));
				return;
			}

			const reader = new FileReader();
			reader.onload = () => resolve({
				name: file.name,
				type: file.type,
				size: file.size,
				dataUrl: String(reader.result || "")
			});
			reader.onerror = () => reject(reader.error || new Error("Could not read file."));
			reader.readAsDataURL(file);
		});
	}

	function readFilesAsDataUrls(fileList) {
		return Promise.all(Array.from(fileList || []).map(readFileAsDataUrl));
	}

	global.AdminImagePicker = {
		readFileAsDataUrl,
		readFilesAsDataUrls
	};
})(window);
