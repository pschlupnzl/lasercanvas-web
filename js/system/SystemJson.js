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
		 * @param {functino} callback Callback invoked with loaded json data.
		 */
		fromLocalStorage = function (callback) {
			callback(JSON.parse(window.localStorage.getItem(localStorageKey)));
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
		 * @param {function} variablesGetter Delegate that exposes current variable values.
		 */
		newElement = function (type, variablesGetter) {
			return type === LaserCanvas.Element.Mirror.Type ? new LaserCanvas.Element.Mirror(variablesGetter) :
				type === LaserCanvas.Element.Lens.Type ? new LaserCanvas.Element.Lens(variablesGetter) :
				type === LaserCanvas.Element.Screen.Type ? new LaserCanvas.Element.Screen(variablesGetter) :
				type === LaserCanvas.Element.Dispersion.Type ? new LaserCanvas.Element.Dispersion(variablesGetter) :
				type === LaserCanvas.Element.Dielectric.Type ? new LaserCanvas.Element.Dielectric(variablesGetter) :
				undefined;
		},

		/**
		 * Convert the system and its elements to a storable JSON structure.
		 * @param {object} mprop Reference to properties to save and load.
		 * @param {Array<object:Element>} melements Reference to elements to save and load.
		 * @param {System} system Parent system to which the elements belong, used e.g. for deleting screen.
		 * @param {function} variablesGetter Delegate that exposes current variable values.
		 */
		fromJson = function (json, mprop, melements, system, variablesGetter) {
			LaserCanvas.Utilities.extend(mprop, json.prop);
			mprop.wavelength = new LaserCanvas.Equation(mprop.wavelength);
			mprop.initialWaist = new LaserCanvas.Equation(mprop.initialWaist);
			LaserCanvas.SystemUtil.resetElements(melements);
			for (var elementJson of json.elements) {
				var element = newElement(elementJson.type, variablesGetter);
				element.fromJson(elementJson);
if (element.init && !system) {
	console.warn("SystemJson.fromJson has no reference to system for element", element);
}
				element.init && element.init(system);
				melements.push(element);
			}
			LaserCanvas.Element.collectGroups(melements);
			melements[0].set("startOptic", true);
			if (mprop.configuration !== LaserCanvas.System.configuration.ring) {
				melements[melements.length - 1].set("endOptic", true);
			}
		};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.toLocalStorage = toLocalStorage;
	LaserCanvas.SystemUtil.fromLocalStorage = fromLocalStorage;
	LaserCanvas.SystemUtil.toJson = toJson;
	LaserCanvas.SystemUtil.fromJson = fromJson;
 }(window.LaserCanvas));