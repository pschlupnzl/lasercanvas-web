/**
 * Create new standard systems.
 */

(function (LaserCanvas) {
	/**
	* Create a default system.
	* @param {string:System.configuration} configuration Type of cavity to build 'linear'|'ring'|'endcap'.
	* @param {Array<object>} elementsInfo Information about each element, if explicitly creating.
	* @param {object=} loc Initial location values.
	* @param {object} mprop Reference to properties to update.
	* @param {Array<Element>} melements Reference to array of elements to update.
	*/
	var createNew = function (configuration, elementsInfo, loc, mprop, melements) {
		var element,
			LaserCanvas = window.LaserCanvas,            // {object} Namespace.
			System = LaserCanvas.System,                 // {object} System namespace.
			Dielectric = LaserCanvas.Element.Dielectric, // {object} Dielectric element namespace.
			Dispersion = LaserCanvas.Element.Dispersion, // {object} Dispersion element namespace.

			// Create elements from an array.
			// @param {Array<object>} items Items to create.
			addElements = function (items) {
				var k, key, item, element,
					type, distanceToNext, props, arg;
				
				// Add new elements.
				for (k = 0; k < items.length; k += 1) {
					item = items[k];
					type = item[0];              // {string} Type of element to create.
					distanceToNext = item[1];    // {number} (mm) Distance to next element (element.loc.l).
					props = item[2];             // {object=} Properties to set.
					arg = props.type;            // {object=} Additional argument to constructor function.
					element = new LaserCanvas.Element[type](arg);
					element.loc.l = distanceToNext;
					if (props) {
						for (key in props) {
							if (props.hasOwnProperty(key)) {
								element.prop[key] = props[key];
							}
						}
					}
					if (element.init) {
						element.init(this);
					}
					melements.push(element);
				}
				
				// Collect into groups.
				window.LaserCanvas.Element.Dielectric.collectGroups(melements);
			};

		// Properties.
		mprop.configuration = configuration;
		mprop.name = LaserCanvas.localize(
			configuration === System.configuration.linear ? 'Linear resonator' :
			configuration === System.configuration.endcap ? 'End coated resonator' :
			configuration === System.configuration.ring ? 'Ring resonator' :
			configuration === System.configuration.propagation ? 'Propagation' :
			configuration === System.configuration.ultrafast ? 'Ultrafast resonator' :
			'System');

		// Prepare system.
		resetElements(melements);

		if (elementsInfo) {
			addElements(elementsInfo);
		} else {
			switch (configuration) {
				case System.configuration.ultrafast:
					addElements([
						['Mirror', 300, { startOptic: true, angleOfIncidence: 0, radiusOfCurvature: 0 }],
						['Mirror', 105, { angleOfIncidence: 0.15, radiusOfCurvature: 200 }],
						// Brewster crystal.
						['Dielectric', 2, { refractiveIndex: 1.76, groupVelocityDispersion: 0.064, faceAngle: 0.517, type: Dielectric.eType.Crystal }],
						['Lens', 0, { focalLength: 500 }],
						['Dielectric', 105, {}],
						['Mirror', 170, { angleOfIncidence: 0.15, radiusOfCurvature: 200 }],
						// Prism compressor.
						['Dispersion', 217, { type: Dispersion.eType.Prism }],
						['Dispersion', 40, {}],
						['Mirror', 0, { endOptic: true, angleOfIncidence: 0, radiusOfCurvature:  0 } ]
					]);
					loc = { q: 0.3, x: -150, y: 0 };
					break;
					
				case System.configuration.ring:
					addElements([
						['Mirror', 250, { startOptic: true }],
						['Mirror', 250, { angleOfIncidence: -30 * Math.PI / 180 }],
						['Mirror', 250, { endOptic: true, angleOfIncidence: -30 * Math.PI / 180, radiusOfCurvature: 500 }]
					]);
					loc = { x: -125, y: 80 };
					break;
					
				case System.configuration.propagation:
					addElements([
						['Screen', 250, { startOptic: true }],
						['Screen', 0, { endOptic: true }]
					]);
					loc = { x: -125 };
					break;
					
				case System.configuration.endcap:
				case System.configuration.linear:
				default:
					LaserCanvas.SystemUtil.fromJson(
						systemDefaults()[configuration || System.configuration.linear],
						mprop,
						melements);
					break;
			}
		}

		// Initial location.
		LaserCanvas.Utilities.extend(melements[0].loc, loc);
	};

	/**
	 * Clears existing elements, destroying them as needed.
	 * @param {Array<object:Element} melements Elements array to clear.
	 */
	var resetElements = function (melements) {
		var element;
		while (element = melements.pop()) {
			if (element.destroy) {
				element.destroy();
			}
		}
	};

	/**
	 * Returns a dictionary of default systems.
	 */
	var systemDefaults = (function () {
		var _systemDefaults = null;
		if (!_systemDefaults) {
			// This can't be executed immediately on load because the
			// `System.configuration` keys may not yet be defined.
			_systemDefaults = {};
			_systemDefaults[LaserCanvas.System.configuration.linear] = {
				prop: {
				   name: "Linear resonator",
				   configuration: "linear",
				   wavelength: 1000,
				},
				elements: [
					{
						type: "Mirror",
						name: "M1",
						loc: {
							x: -125,
							y: 0,
							l: 250
						},
						prop: {
							radiusOfCurvature: 200,
							angleOfIncidence: 0
						}
					},
					{
						type: "Mirror",
						name: "M2",
						prop: {
							radiusOfCurvature: 200,
							angleOfIncidence: 0
						}
					}
				]
			};

			_systemDefaults[LaserCanvas.System.configuration.endcap] = {
				"prop": {
					"name": "End coated resonator",
					"configuration": "endcap",
					"wavelength": 1000,
				},
				"elements": [
					{
						"type": "Dielectric",
						"name": "D1",
						"loc": {
							"x": -125,
							"l": 50
						},
						"prop": {
							"type": "Endcap",
							"refractiveIndex": 1.5,
							"curvatureFace1": -200,
							"curvatureFace2": 0,
							"thermalLens": 0
						},
						"priv": {
							"thickness": 50,
						}
					},
					{
						"type": "Lens",
						"name": "L1",
						"prop": {
							"focalLength": 0
						}
					},
					{
						"type": "Dielectric",
						"name": "D2",
						"loc": {
							"l": 200
						},
						"prop": {},
						"priv": {}
					},
					{
						"type": "Mirror",
						"name": "M1",
						"prop": {
							"radiusOfCurvature": 200,
						}
					}
				]
			};

			_systemDefaults[LaserCanvas.System.configuration.propagation] = {
				prop: {
					name: "Propagation",
					configuration: "propagation",
					wavelength: 1000,
					initialWaist: 100
				},
				elements: [{
					type: "Screen",
					name: "I1",
					loc: {
						x: -125,
						l: 250
					}
				}, {
					type: "Screen",
					name: "I2",
				}]
			};
		}
		return _systemDefaults;
	})

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.createNew = createNew;
	LaserCanvas.SystemUtil.resetElements = resetElements;
}(window.LaserCanvas));