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
		 * @param {System} system Optical system to which the elements belong.
		 */
		fromLocalStorage = function (mprop, melements, system) {
			var json;
			json = JSON.parse(window.localStorage.getItem(localStorageKey));
			fromJson(json, mprop, melements, system);
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
		 * @param {System} system Parent system to which the elements belong, used e.g. for deleting screen.
		 */
		fromJson = function (json, mprop, melements, system) {
			LaserCanvas.Utilities.extend(mprop, json.prop);
			mprop.wavelength = new LaserCanvas.Equation(mprop.wavelength);
			mprop.initialWaist = new LaserCanvas.Equation(mprop.initialWaist);
			LaserCanvas.SystemUtil.resetElements(melements);
			for (var elementJson of json.elements) {
				var element = newElement(elementJson.type);
				element.fromJson(elementJson);
				element.init && element.init(system);
				melements.push(element);
			}
			LaserCanvas.Element.Dielectric.collectGroups(melements);
			melements[0].prop.startOptic = true;
			melements[melements.length - 1].prop.endOptic = true;
		};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.toLocalStorage = toLocalStorage;
	LaserCanvas.SystemUtil.fromLocalStorage = fromLocalStorage;
	LaserCanvas.SystemUtil.toJson = toJson;
	LaserCanvas.SystemUtil.fromJson = fromJson;
 }(window.LaserCanvas));