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

		/** Map of element type names to constructor functions. */
		factoryMap = (function () {
			var map = {};
			for (var elementClass of [
				LaserCanvas.Element.Mirror,
				LaserCanvas.Element.Lens,
				LaserCanvas.Element.Screen,
				LaserCanvas.Element.Dispersion,
				LaserCanvas.Element.Dielectric,
			]) {
				map[elementClass.Type] = elementClass;
			}
			return map;
		}())

		/**
		 * Convert the system and its elements to a storable JSON structure.
		 * @param {object} mprop Reference to properties to save and load.
		 * @param {Array<object:Element>} melements Reference to elements to save and load.
		 */
		fromJson = function (json, mprop, melements) {
			LaserCanvas.Utilities.extend(mprop, json.prop);
			LaserCanvas.SystemUtil.resetElements(melements);
			for (var elementJson of json.elements) {
				var element = new factoryMap[elementJson.type]();
				element.fromJson(elementJson);
				element.init && element.init();
				melements.push(element);
			}
			LaserCanvas.Element.Dielectric.collectGroups(melements);
		};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	window.LaserCanvas.SystemUtil.toLocalStorage = toLocalStorage;
	window.LaserCanvas.SystemUtil.fromLocalStorage = fromLocalStorage;
	window.LaserCanvas.SystemUtil.toJson = toJson;
	window.LaserCanvas.SystemUtil.fromJson = fromJson;
 }(window.LaserCanvas));