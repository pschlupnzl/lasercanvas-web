/**
* LaserCanvas - Element utility functions.
*/
// window.LaserCanvas.Element.inputProperties = (function () {
// 	"use strict";
// 	var
// 		LaserCanvas = window.LaserCanvas,  // {object} Namespace.
// 		kpropertyNames = ['propertyName', 'increment', 'max', 'min', 'standard', 'wrap'], // {Array<string>} Properties to set.
		
// 		handlers = {
// 			// Attach an event handler that blurs the input
// 			// field when the enter key is pressed.
// 			// @this {HTMLInputElement} Triggering input field.
// 			// @param {KeyboardEvent} e Triggering event.
// 			// @param {object:Element} element Element to update.
// 			// @param {object:System} system Optical system containing element.
// 			keydown: function (e, element, system) {
// 				var tr, step,
// 					propertyStep = window.LaserCanvas.Element.propertyStep,
// 					input = this;
					
				
// 				switch (e.keyCode) {
// 					case 10: // Enter.
// 					case 13: // Return.
// 						this.blur();
// 						break;
						
// 					case 38: // Up.
// 					case 40: // Down.
// 						step = e.keyCode === 38 ? +1 : -1;
// 						if ((e.ctrlKey || e.metaKey)
// 							&& input.hasAttribute('data-standard')) {
// 							propertyStep(input, 'standard', step, element, system);
// 						} else if (input.hasAttribute('data-increment')) {
// 							if (e.ctrlKey || e.metaKey || e.shiftKey) {
// 								propertyStep(input, 'increment', 10 * step, element, system);
// 							} else {
// 								propertyStep(input, 'increment', step, element, system);
// 							}
// 						}
// 						e.preventDefault();
// 						break;
// 				}
// 			},
			
// 			// Attach an event handler that updates the property
// 			// value when a key is released.
// 			// @this {HTMLInputElement} Triggering input field.
// 			// @param {KeyboardEvent} e Triggering event. The parameter is not used.
// 			// @param {object:Element} element Optical element to update.
// 			// @param {object:System} system Optical system containing element.
// 			keyup: function (e, element, system) {
// 				var value = this.value, // {string} Current element value.
// 					val = +value; // {number} New numeric value.
// 				if (value.length > 0 && !isNaN(val)) {
// 					window.LaserCanvas.Element.propertyStep(this, 'set', val, element, system);
// 				}
// 			}
// 		},
		
// 		// Create stepping buttons before and after the input control.
// 		// @param {HTMLInputElement} input Input element to step.
// 		// @param {string} action Type of buttons to create 'standard'|'increment'.
// 		createStepButton = function (input, action, step) {
// 			var but = document.createElement('button');
// 			but.className = 'lcbutton';
// 			but.setAttribute('data-action', action);
// 			but.setAttribute('data-step', step);
// 			but.innerHTML = action === 'standard' 
// 				? (step < 0 ? '&lt;' : '&gt;')
// 				: (step < 0 ? '&minus;' : '+');
// 			input.parentNode.insertBefore(but, step < 0 
// 				? input
// 				: input.nextSiblingElement);
// 		},
		
// 		// Prepare a single input.
// 		// @param {HTMLInputElement} input Input to configure.
// 		// @param {object} prop Property to configure.
// 		// @param {object:Element} element Optical element to control.
// 		// @param {object:System} system System containing element.
// 		// @returns {HTMLInputElement} Original element.
// 		prepareInput = function (input, prop, element, system) {
// 			var nowrap = true; // {boolean} Value indicating whether to assign nowrap to parent.
// 			window.LaserCanvas.Utilities.foreach(kpropertyNames, function (k, key) {
// 				if (prop.hasOwnProperty(key)) {
// 					input.setAttribute('data-' + key.replace(/([A-Z])/g, '-$1').toLowerCase(), 
// 						Array.isArray(prop[key]) 
// 						? prop[key].join(',') 
// 						: prop[key]);
// 				}
// 			});
			
// 			if (prop.hasOwnProperty('standard')) {
// 				createStepButton(input, 'standard', -1);
// 				createStepButton(input, 'standard', +1);
// 			} else if (prop.hasOwnProperty('increment')) {
// 				createStepButton(input, 'increment', -1);
// 				createStepButton(input, 'increment', +1);
// 			} else {
// 				nowrap = false;
// 			}
			
// 			if (nowrap) {
// 				input.parentNode.className += ' nowrap';
// 			}
			
// 			LaserCanvas.Element.activateInputProperty(input, handlers, element, system);
// 		};
	
// 	/**
// 	* Assumes that the input element is within a TR that contains
// 	* the attributes.
// 	* @param {HTMLInputElement} parent Parent of input elements to configure.
// 	* @param {object:Element} element Optical element to control.
// 	* @param {object:System} system System containing element.
// 	*/
// 	return function inputProperties(parent, element, system) {
// 		var Utilities = LaserCanvas.Utilities;
// 		Utilities.foreach(element.userProperties(), function (k, prop) {
// 			var input;
// 			if (element.canSetProperty(prop.propertyName)
// 				&& (input = parent.querySelector(Utilities.stringFormat('input[type="text"][data-property-name="{0}"]', prop.propertyName)))) {
// 				prepareInput(input, prop, element, system);
// 			}
// 		});
// 		return parent;
// 	}
// }());

// /**
// * Attach handlers to the given input element.
// * @param {HTMLInputElement} input Input control to activate.
// * @param {object<function>} handlers Event handlers, keyed by event name, to attach to element.
// * @param {object:Element} element Optical element to control.
// * @param {object:System} system System containing element.
// */
// window.LaserCanvas.Element.activateInputProperty = function (input, handlers, element, system) {
// 	"use strict";
// 	var but,
// 		// An increment or decrement button is clicked.
// 		// @this {HTMLButtonElement} Clicked button.
// 		incrementClick = function () {
// 			window.LaserCanvas.Element.propertyStep(input,
// 				this.getAttribute('data-action'),
// 				+this.getAttribute('data-step'),
// 				element, system);
// 		},
		
// 		// Attach a click handler to a button, if exists.
// 		// @param {HTMLElement} but Button where to attach event.
// 		attachIncrementClick = function (but) {
// 			if (but && but.tagName === 'BUTTON') {
// 				but.onclick = incrementClick;
// 			}
// 		};
		
// 	window.LaserCanvas.Utilities.foreach(handlers, function (eventName, handler) {
// 		input.addEventListener(eventName, function (e) {
// 			handler.call(this, e, element, system);
// 		}, false);
// 	});
// 	attachIncrementClick(input.previousElementSibling);
// 	attachIncrementClick(input.nextElementSibling);
// };

// /**
// * Increment a value or standard value.
// * @param {HTMLInputElement} input Element containing information about the adjustment.
// * @param {string} propertyName Name of property to change.
// * @param {string} action Action 'set'|'standard'|'increment'.
// * @param {number} step Step size to take.
// * @param {object:Element} element Optical element being adjusted.
// * @param {object:System} system System containing element.
// */
// window.LaserCanvas.Element.propertyStep = function (input, action, step, element, system) {
// 	"use strict";
// 	var k, 
// 		numberFormat = window.LaserCanvas.Utilities.numberFormat, // {function} Formatting a number.
// 		propertyName = input.getAttribute('data-property-name'),
// 		std = input.getAttribute('data-' + action), // {string} Standard values.
// 		wrap = +input.getAttribute('data-wrap'),    // {number=} Wrapping.
// 		min = input.hasAttribute('data-min') ? +input.getAttribute('data-min') : null, // {number?} Minimum value.
// 		max = input.hasAttribute('data-max') ? +input.getAttribute('data-max') : null, // {number?} Maximum value.
// 		value = +input.value; // {number} Current value.
		
// 	if (!isNaN(value) || action === 'set') {
// 		if (action === 'set') {
// 			value = step;
// 		} else if (action === 'increment') {
// 			value += +std * step;
// 		} else if (action === 'standard') {
// 			std = std.split(',');
// 			if (step > 0) {
// 				for (k = 0; k < std.length - step - 1; k += 1) {
// 					if (+std[k + 1] > value) {
// 						break;
// 					}
// 				}
// 			} else {
// 				for (k = std.length - 1; k > -step; k -= 1) {
// 					if (+std[k - 1] < value) {
// 						break;
// 					}
// 				}
// 			}
// 			value = +std[k + step];
// 		}
		
// 		// Wrap around (e.g. angles).
// 		if (wrap) {
// 			while (value > wrap) {
// 				value += -2 * wrap;
// 			}
// 			while (value < -wrap) {
// 				value += 2 * wrap;
// 			}
// 		}
		
// 		// Constrain to limits (except explicit setting).
// 		if (action !== 'set') {
// 			if (min !== null) {
// 				value = Math.max(value, min);
// 			}
// 			if (max !== null) {
// 				value = Math.min(value, max);
// 			}
// 		}
		
// 		input.value = numberFormat(value);
		
// 		element.set(propertyName, value);
// 		system.update(true);
// 	}
// };

/**
* Standard algorithm for checking whether element is at the location.
* This gets overloaded e.g. by block element for more sophisticated
* overlap calculations.
* @this {Element} Element being checked.
* @param {Point} pt Point to look at.
* @param {number} tol Tolerance (from renderer; depends on zoom, maybe).
* @returns {boolean} Value indicating whether this element is at the queried location.
*/
window.LaserCanvas.Element.atLocation = function (pt, tol) {
	"use strict";
	return Math.abs(this.loc.x - pt.x) < tol && Math.abs(this.loc.y - pt.y) < tol;
};

/**
* Standard calculation of group delay dispersion given a group
* velocity dispersion and a length. The method is expected to
* be called for e.g. Dielectric or Dispersion, where there is
* a groupVelocityDispersion property, as well as an element 
* group. The GDD is only returned for the first element in the
* group. If the parameter L is not supplied, the element's
* distanceToNext property is used as the propagation length.
* @this {Element} Grouped element, e.g. Dispersion or Dielectric.
* @param {number} lam (nm) Wavelength (note units nm!).
* @param {number} L (mm) Physical length of propagation through material.
* @returns {number} (fs^2/rad) Group delay dispersion for first element in group, otherwise 0.
*/
window.LaserCanvas.Element.groupDelayDispersion = function (lam, L) {
	"use strict";
	// TODO: Remove this check: We've made L compulsory argument now.
	if (L === undefined) console.error(`groupDelayDispersion called without distance`);
	// Group delay dispersion (see e.g. https://www.newport.com/n/the-effect-of-dispersion-on-ultrashort-pulses)
	// 
	//         lam^3      d^2 n
	// GDD = ---------- --------- L.
	//        2 pi c^2   d lam^2
	//
	// Units:
	//           [nm^3]       1
	//     = ------------- -------- [mm]
	//        [um^2/fs^2]   [um^2]
	//
	//     = [nm^3 mm /um^4] [fs^2].
	//
	//     = -9 * 3 - 3 / -6 * 4
	//     = -30 / -24
	//     = -6.
	var c = window.LaserCanvas.constant.c; // {number} (um/fs) Speed of light.
	return this === this.group[0]
		? 1e-6 * lam * lam * lam / (2 * Math.PI * c * c) 
			* this.prop.groupVelocityDispersion 
			* (L !== undefined ? L : this.get("distanceToNext", variables))
		: false;
};
