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
	* @param {function} mvariablesGetter Delegate that exposes current variable values.
	*/
	var createNew = function (configuration, elementsInfo, loc, mprop, melements, mvariablesGetter) {
		var System = LaserCanvas.System;
		
		mprop.configuration = configuration;
		mprop.name = LaserCanvas.localize(
			configuration === System.configuration.linear ? "Linear resonator" :
			configuration === System.configuration.endcap ? "End coated resonator" :
			configuration === System.configuration.ring ? "Ring resonator" :
			configuration === System.configuration.propagation ? "Propagation" :
			configuration === System.configuration.ultrafast ? "Ultrafast resonator" :
			"System");

		LaserCanvas.SystemUtil.fromJson(
			systemDefaults()[configuration || System.configuration.linear],
			mprop,
			melements,
			null, // TODO: Need system here (for screen?)
			mvariablesGetter);
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
							y: 0
						},
						prop: {
							distanceToNext: 250,
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
				prop: {
					name: "End coated resonator",
					configuration: "endcap",
					wavelength: 1000,
				},
				elements: [
					{
						type: "Dielectric",
						name: "D1",
						loc: {
							x: -125,
						},
						prop: {
							type: "Endcap",
							refractiveIndex: 1.5,
							curvatureFace1: -200,
							curvatureFace2: 0,
							thermalLens: 0
						},
						priv: {
							thickness: 50
						}
					},
					{
						type: "Lens",
						name: "L1",
						prop: {
							focalLength: 0
						}
					},
					{
						type: "Dielectric",
						name: "D2",
						loc: {},
						prop: {
							distanceToNext: 200
						}
					},
					{
						type: "Mirror",
						name: "M1",
						prop: {
							radiusOfCurvature: 200,
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
						x: -125
					},
					prop: {
						distanceToNext: 250
					}
				}, {
					type: "Screen",
					name: "I2",
					prop: {}
				}]
			};

			_systemDefaults[LaserCanvas.System.configuration.ring] = {
				prop: {
					name: "Ring resonator",
					configuration: "ring",
					wavelength: 1000,
				},
				elements: [
					{
						type: "Mirror",
						name: "M1",
						loc: {
							x: -125,
							y: 80,
							q: 0
						},
						prop: {
							radiusOfCurvature: 0,
							distanceToNext: 250
						}
					},
					{
						type: "Mirror",
						name: "M2",
						loc: {},
						prop: {
							distanceToNext: 250,
							radiusOfCurvature: 0,
							angleOfIncidence: -0.5235987755982988
						}
					},
					{
						type: "Mirror",
						name: "M3",
						loc: {},
						prop: {
							radiusOfCurvature: 500,
							angleOfIncidence: -0.5235987755982989
						}
					}
				]
			};

			_systemDefaults[LaserCanvas.System.configuration.ultrafast] = {
				prop: {
					name: "Ultrafast resonator",
					configuration: "ultrafast",
					wavelength: 800,
				},
				elements: [
					{
						type: "Mirror",
						name: "M1",
						loc: {
							x: -150,
							y: 0,
							p: 3.441592653589793,
							q: 0.3
						},
						prop: {
							distanceToNext: 300,
							radiusOfCurvature: 0,
							angleOfIncidence: 0
						}
					},
					{
						type: "Mirror",
						name: "M2",
						loc: {},
						prop: {
							distanceToNext: 105,
							radiusOfCurvature: 200,
							angleOfIncidence: 0.15
						}
					},
					{
						type: "Dielectric",
						name: "D1",
						loc: {},
						prop: {
							type: "Crystal",
							refractiveIndex: 1.76,
							groupVelocityDispersion: 0.064,
							angleOfIncidence: 1.0550462304736345,
							faceAngle: 0.517,
							curvatureFace1: 0,
							curvatureFace2: 0,
							thermalLens: 0
						},
						priv: {
							thickness: 2
						}
					},
					{
						type: "Lens",
						name: "L1",
						loc: {},
						prop: {
							focalLength: 0
						}
					},
					{
						type: "Dielectric",
						name: "D2",
						loc: {},
						prop: {
							distanceToNext: 105
						},
						priv: {}
					},
					{
						type: "Mirror",
						name: "M3",
						loc: {},
						prop: {
							distanceToNext: 170,
							radiusOfCurvature: 200,
							angleOfIncidence: 0.15
						}
					},
					{
						type: "Dispersion",
						name: "DC1",
						loc: {},
						prop: {
							distanceToNext: 217,
							type: "Prism",
							prismInsertion: 0,
							refractiveIndex: 1.5,
							indexDispersion: 0,
							groupVelocityDispersion: 0
						},
						priv: {
							apexAngle: 1.176005207095135,
							deflectionAngle: -0.7895822393995233,
						}
					},
					{
						type: "Dispersion",
						name: "DC2",
						loc: {},
						prop: {
							distanceToNext: 40
						},
						priv: {}
					},
					{
						type: "Mirror",
						name: "M4",
						loc: {},
						prop: {
							radiusOfCurvature: 0,
						}
					}
				]
			};
		}
		return _systemDefaults;
	})

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.createNew = createNew;
	LaserCanvas.SystemUtil.resetElements = resetElements;
}(window.LaserCanvas));
