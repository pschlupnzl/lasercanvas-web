/**
 * System storing and loading.
 */
 (function (LaserCanvas) {
	var localStorageKey = "laserCanvasSystem",

		/**
		 * Stores the system into local storage.
		 * @param {object} json Data to write to local storage.
		 */
		toLocalStorage = function (json) {
			if (window.localStorage) {
				window.localStorage.setItem(localStorageKey, JSON.stringify(json));
			}
		},

		/**
		 * Load a system from local storage.
		 * @param {object} mprop Reference to the system's internal properties.
		 * @param {Array<object:Element>} melements Reference to elements.
		 */
		fromLocalStorage = function (mprop, melements) {
			var json;
			json = JSON.parse(window.localStorage.getItem(localStorageKey));
			fromJson(json, mprop, melements);
		},

		/**
		 * Convert the system and its elements to a storable JSON structure.
		 * @param {object} mprop Reference to properties to save and load.
		 * @param {Array<object:Element>} melements Reference to elements to save and load.
		 */
		toJson = function (mprop, melements) {
			var json = {
				prop: LaserCanvas.Utilities.extend({}, mprop),
				elements: melements.map(function (element) {
					return element.toJson();
				})
			};
			return json;
		},

		/**
		 * Returns a new element corresponding to the element type string.
		 * @param {string} type Name of element.
		 */
		newElement = function (type) {
			return type === LaserCanvas.Element.Mirror.Type ? new LaserCanvas.Element.Mirror() :
				type === LaserCanvas.Element.Lens.Type ? new LaserCanvas.Element.Lens() :
				type === LaserCanvas.Element.Screen.Type ? new LaserCanvas.Element.Screen() :
				type === LaserCanvas.Element.Dispersion.Type ? new LaserCanvas.Element.Dispersion() :
				type === LaserCanvas.Element.Dielectric.Type ? new LaserCanvas.Element.Dielectric() :
				undefined;
		},

		/**
		 * Convert the system and its elements to a storable JSON structure.
		 * @param {object} mprop Reference to properties to save and load.
		 * @param {Array<object:Element>} melements Reference to elements to save and load.
		 */
		fromJson = function (json, mprop, melements) {
			LaserCanvas.Utilities.extend(mprop, json.prop);
			LaserCanvas.SystemUtil.resetElements(melements);
			for (var elementJson of json.elements) {
				var element = newElement(elementJson.type);
				element.fromJson(elementJson);
				element.init && element.init();
				melements.push(element);
			}
			LaserCanvas.Element.Dielectric.collectGroups(melements);
		};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.toLocalStorage = toLocalStorage;
	LaserCanvas.SystemUtil.fromLocalStorage = fromLocalStorage;
	LaserCanvas.SystemUtil.toJson = toJson;
	LaserCanvas.SystemUtil.fromJson = fromJson;
 }(window.LaserCanvas));