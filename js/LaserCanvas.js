/**
* Laser Canvas - main application controller.
*/

/** When included without UI, e.g. tests. */
window.LaserCanvas = window.LaserCanvas || {
	Element: {},    // {Namespace} Elements.
};

// @param {HTMLCanvasElement} canvas Canvas element where system is drawn.
// @param {HTMLDivElement} info Panel where to write information.
window.LaserCanvas.Application = function (canvas, info) {
	"use strict";
	/*
	* TODO as of 2018-08-14
	*  - Save and load system
	*    Currently within System.js. Should / could be moved
	*    into LaserCanvas.js (here) or as separate utility.
	*    Will know more when we have the storage set up.
	*  - Graphing
	*    Element properties can now be controlled from the
	*    information panel, so a graphing layer can tap into
	*    that.
	*    One possibility is to have a "Graph" button beside
	*    each element title in the info panel.
	*    Randy suggested a stability plot.
	*  - Help / documentation
	*    Explanation and exposition of equations used.
	*/	
	var msystem, mrender, minfo, mvariables,
		mprop,                     // {PropertiesPanel} Properties panel handler.
		mlisteners = {
			interactionchange: [],           // {Array<function>} Handlers when render interaction changes.
			insertelement: []                // {Array<function>} Handlers when an element is added.
		},
		
		/**
		* Add an event listener.
		* @param {string} name Event name 'interactionChange'|'insertElement'|etc. The name is not case sensitive.
		* @param {function} fn Event listener.
		* @returns {Application} Callee for chaining.
		*/
		addEventListener = function (name, fn) {
			if (mlisteners.hasOwnProperty(name.toLowerCase())) {
				mlisteners[name.toLowerCase()].push(fn);
			}
			return this;
		},
		
		/**
		* Notify event listeners of a change.
		* @param {string} name Event name 'interactionChange'|'insertElement'|etc. The name is not case sensitive.
		* @param {...} args Additional arguments passed to listeners.
		*/
		fireEventListeners = function (name, args) {
			var k,
				listeners = mlisteners[name.toLowerCase()]; // {Array<function>} Listeners for this event.
			if (listeners && listeners.length > 0) {
				for (k = 0; k < listeners.length; k += 1) {
					listeners[k].apply(this, Array.prototype.slice.call(arguments, 1)); // Fire each listener with additional arguments.callee
				}
			}
		},
		
		/**
		* Window is resized. Update dimensions of elements.
		*/
		onResize = function () {
			var id, el, key,
				info = document.body.getAttribute("data-info-visible") === "true",
				variables = document.body.getAttribute("data-variables-visible") === "true",
				sliver = 0, // {number} (px) Slice off to prevent scroll bars.
				w = window.innerWidth - sliver,  // {number} (px) Width of window.
				h = window.innerHeight - sliver, // {number} (px) Height of window.
				ht = 80,                         // {number} (px) Height of toolbar.

				pos = {
					// '#LaserCanvasFrame': {
					// 	left: 0,
					// 	top: 0,
					// 	width: w,
					// 	height: h - ht
					// },
					// '#LaserCanvasToolbar': {
					// 	height: ht
					// },
					// '#LaserCanvasGraphsBar': {
					// 	height: ht
					// },
					'#LaserCanvas': {
						width: w,
						height: h - ht
					},
					// '#LaserCanvasInfo': {
					// 	height: h - ht - 1
					// }
				};
			
			for (id in pos) {
				if (pos.hasOwnProperty(id)
					&& (el = document.querySelector(id))) {
					for (key in pos[id]) {
						if (pos[id].hasOwnProperty(key)) {
							el.style[key] = pos[id][key] + 'px';
						}
					}
					if (el.nodeName === 'CANVAS') {
						el.width  = pos[id].width;
						el.height = pos[id].height;
					}
				}
			}

			// Trigger resize in drawing.
			mrender.onResize();
		},
		
		/**
		* Initialize the application, once all items have finished loading.
		*/
		init = function () {
			var LaserCanvas = window.LaserCanvas,
				controller = {
					highlightElement: function (element) {
						mrender.highlightElement(element);
						minfo.highligtElement(system, element);
					}
				};
			
			// Child members.
			msystem = new LaserCanvas.System();                 // {System} Optical system.
			minfo = new LaserCanvas.InfoPanel(info); // {InfoPanel} System information.
			mrender = new LaserCanvas.Render(msystem, minfo, canvas);  // {Render} Rendering engine.
			mprop = new LaserCanvas.PropertiesPanel(mrender, msystem);  // {PropertiesPanel} Properties panel.

			onResize();
			window.addEventListener('resize', onResize, false);

			var makeToggle = function (attr) {
				return function () {
					var el = document.body;
					el.setAttribute(attr, el.getAttribute(attr) === 'true' ? 'false' : 'true');
					onResize();
				};
			};

			document.querySelector('#LaserCanvasToggleInfo').onclick = makeToggle("data-info-visible");
			document.querySelector('#LaserCanvasToggleVariables').onclick = makeToggle("data-variables-visible");
			
			// Properties have updated.
			msystem.addEventListener('update', function () {
				msystem.calculateAbcd();
				mrender.update();
				minfo.update(msystem, mrender);
			});
			
			// Structure has changed.
			msystem.addEventListener('change', function () {
				msystem.calculateAbcd();
				mrender.update();
				minfo
					.change()
					.update();
			});
			
			mvariables = new LaserCanvas.Variables();
			mvariables.addEventListener("change", function () {
				msystem.update(true);
			});
			var variablesGetter = mvariables.value.bind(mvariables);
			msystem.setVariablesGetter(variablesGetter);
			mrender.setVariablesGetter(variablesGetter);
			minfo.init(msystem, mrender, variablesGetter);
			new LaserCanvas.VariablePanel(mvariables)
				.appendTo(document.querySelector("#LaserCanvasVariablesPanel .variables"));

			/*
			* Toolbar handler.
			*/
			new LaserCanvas.Toolbar(msystem, mrender, fireEventListeners)
				.init()
				.initDrag()
				.initSystemNew(launch);
		},
		
		/**
		* Launch the application with a new cavity.
		* @param {string:System.configuration} configuration Configuration of system to create.
		*/
		launch = function (configuration) {
			mrender.resetTransform();
			mrender.setInteraction(window.LaserCanvas.Render.interaction.layout);
			msystem.createNew(configuration);
		};
		
	/**
	* Public methods.
	*/
	this.addEventListener = addEventListener; // Add a listener for the given event 'interactionChange'|'insertElement'|etc.
	this.fireEventListeners = fireEventListeners; // Fire listeners for an event 'interactionChange'|'insertElement'|etc.
	this.init = init;           // Initialize the application.
};

/**
* Enums.
*/
window.LaserCanvas.Enum = {
	// Rendering layers to build each scene.
	renderLayer: {
		axis: 'axis',             // Render the main axis and construction elements.
		sagittal: 'sagittal',     // Render sagittal mode (if astigmatic).
		tangential: 'tangential', // Render tangential mode (if astigmatic).
		optics: 'optics',         // Render optical elements.
		distance: 'distance',     // Render separation distances.
		annotation: 'annotation'  // Render optic annotations.
	},

	// Beam planes.
	modePlane: {
		sagittal: 0,
		tangential: 1
	}
};

/**
* Clone an object.
* @param {object} obj Object to clone.
* @returns {object} Cloned object.
*/
window.LaserCanvas.clone = function (obj) {
	var
		// Recursively clone an object.
		// @param {object|...} o Object to clone.
		cloneRecursive = function (o) {
			var k, ret;
			if (typeof o === 'string'
				|| typeof o === 'number'
				|| o === null) {
				// Primitive types are direct copies.
				return o;
			} else if (o.constructor === Array.prototype.constructor) {
				// Copy array elementwise.
				ret = [];
				for (k = 0; k < o.length; k += 1) {
					ret[k] = cloneRecursive(o[k]);
				}
			} else {
				// Copy object by keys.
				ret = {};
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						ret[k] = cloneRecursive(o[k]);
					}
				}
			}
			return ret;
		};
	return cloneRecursive(obj);
};

/**
* Scientific constants.
*/
window.LaserCanvas.constant = {
	c: 0.299792458 // (um/fs) Speed of light.
};

/**
* Standard units.
*/
window.LaserCanvas.unit = {
	angleOfIncidence: '°',
	curvatureFace1: 'mm',
	curvatureFace2: 'mm',
	distanceToNext: 'mm',
	distanceToWaist: 'mm',
	faceAngle: '°',
	focalLength: 'mm',
	groupDelayDispersion: 'fs²', // Actually fs^2/rad.
	groupVelocityDispersion: 'µm⁻²',
	indexDispersion: 'µm⁻¹',
	indexSecondDerivative: 'µm⁻²',
	initialWaist: 'µm',
	modeSize: 'µm',
	modeSpacing: 'MHz',
	opticalLength: 'mm',
	physicalLength: 'mm',
	prismInsertion: 'mm',
	radiusOfCurvature: 'mm',
	raleighLength: 'mm',
	thermalLens: 'mm',
	thickness: 'mm',
	waistSize: 'µm',
	wavefrontROC: 'mm',
	wavelength: 'nm'
};
