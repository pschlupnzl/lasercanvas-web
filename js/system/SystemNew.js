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
		while (element = melements.pop()) {
			if (element.destroy) {
				element.destroy();
			}
		}

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
					
				case System.configuration.endcap:
					addElements([
						['Dielectric', 50, { refractiveIndex: 1.5, curvatureFace1: -200, type: Dielectric.eType.Endcap }],
						['Lens', 0, { focalLength: 200 }],
						['Dielectric', 200, {} ],
						['Mirror', 0, { endOptic: true, angleOfIncidence: 0, radiusOfCurvature:  200 } ]
					]);
					loc = { x: -125 };
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
					
				case System.configuration.linear:
				default:
					addElements([
						['Mirror', 250, { startOptic: true, angleOfIncidence: 0, radiusOfCurvature: 200 }],

						////['Prism', 100, { refractiveIndex: 1.7, prismInsertion: 5 }],
						//// ['Lens', 20, { focalLength: 200 }],
						//// ['Lens', 20, { focalLength: -200 }],

						//// ['Dielectric', 50, { refractiveIndex: 1.5 }, Dielectric.eType.Plate],
						//// ['Lens', 0, { focalLength: 200 }],
						//// ['Dielectric', 50],

						['Mirror', 0, { endOptic: true, angleOfIncidence: 0, radiusOfCurvature:  200 } ]
					]);
					loc = { x: -125 };
					break;
			}
		}

		// Initial location.
		window.LaserCanvas.Utilities.extend(melements[0].loc, loc);
	};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.createNew = createNew;
}(window.LaserCanvas));