/**
* Information panel about whole system.
* @param {HTMLDivElement} info Where to write information.
*/
window.LaserCanvas.InfoPanel = function (info) {
	"use strict";
	this.system = null; // {System} Reference to system, set in init().
	this.render = null; // {Render} Reference to renderer, set in init().
	this.variablesGetter = null; // {function|null} Method to retrieve variable values.
	this.info = info; // {HTMLDivElement} Information panel.
};

// Element read-only properties to be added if supported by the system.
window.LaserCanvas.InfoPanel.systemElementProperties = ['groupDelayDispersion'];

/**
* Create a new information block for the given system.
* @param {object:System} system Optical system to build for.
* @param {HTMLDivElement} info Container for panel entries.
*/
window.LaserCanvas.InfoPanel.createPanel = function (system, info) {
	"use strict";
	var k, 
		LaserCanvas = window.LaserCanvas,           // {object} LaserCanvas namespace.
		Utilities = LaserCanvas.Utilities,          // {object} Utility methods.
		prettify = LaserCanvas.Utilities.prettify,  // {function} Pretty print name.
		localize = LaserCanvas.localize,            // {function} Localize text.
		systems = info.querySelector('.systems'),   // {HTMLDivElement} Container for system elements.
		elements = info.querySelector('.elements'), // {HTMLDivElement} Container for element properties.
		tmpl = elements.querySelector('.template'), // {HTMLElement} Template
		
		// Remove all existing items.
		clearItems = function () {
			LaserCanvas.Utilities.foreach(info.querySelectorAll('.element,.system,.render'), function (k, pnl) {
				pnl.parentNode.removeChild(pnl);
			});
		},
		
		/**
		 * Add a new row with the given data.
		 * @param {HTMLDivElement} pnl Panel where to add.
		 * @param {string} propertyName Name of property to set.
		 * @param {string=} label Label to use, or pretty name.
		 * @param {string=} dataType Data type set into row attribute for styling, default 'sag-tan'.
		 * @param {string=} className CSS class to assign, if any.
		 * @returns {HTMLTRElement} Newly created row.
		 */
		addRow = function (pnl, propertyName, label, dataType, className) {
			var dataType = dataType || "sag-tan",             // Default data view.
				tbl = pnl.querySelector('table'),             // {HTMLTableElement} Table to fill.
				tbody = tbl.querySelector('tbody'),           // {HTMLTBodyElement} Table body where to append rows.
				trt = tbl.querySelector('tr.template[data-type="' + dataType + '"]'), // {HTMLTRElement} Template row.
				tr = trt.cloneNode(true),                     // {HTMLTRElement} Cloned row ready for panel.
				unit = window.LaserCanvas.unit[propertyName], // {string=} Unit associated with property if any.
				label = localize(label || prettify(propertyName)); // {string} Text to write (without units).
				
			// Prepare clone.
			tr.className = className || '';
			tr.setAttribute('data-property-name', propertyName);

			// Content.
			tr.querySelector('[data-cell="label"]').innerHTML = label;
			tr.querySelector('[data-cell="unit"]').innerHTML = unit || '';
			tbody.appendChild(tr);
			return tr;
		},
		
		/**
		 * Add an action (edit field, toggle etc.) row.
		 * @param {HTMLDivElement} pnl Panel where to add.
		 * @param {object} prop Property attributes to set.
		 * @param {object} currentValue Current value, which determines type of input to build.
		 * @param {string=} className CSS class to assign, if any.
		 */
		addActionRow = function (pnl, prop, currentValue, className) {
			var propertyName = prop.propertyName,
				input = document.createElement('input'),
				tr = addRow(pnl, propertyName, prettify(propertyName), 'action'),
				action = tr.querySelector('[data-cell="action"]'), // {HTMLTDElement} Cell to be filled with action buttons.
				
				// Add an attribute, if used.
				// @param {string} attributeName Name of attribute to add.
				addAttribute = function (attributeName) {
					if (prop.hasOwnProperty(attributeName)) {
						tr.setAttribute('data-' + attributeName, prop[attributeName]);
					}
				};
			
			// Prepare the table row.
			tr.className = className || '';
			tr.setAttribute('data-input', 'true'); // This row has user input fields.
			
			// Input field.
			switch (typeof currentValue) {
				case 'boolean':
					input.type = 'checkbox';
					break;
					
				case 'number':
				case 'string':
				default:
					input.type = 'text';
					break;
			}

			input.className = 'laserCanvasInput';
			input.setAttribute('data-property-name', propertyName);
			action.appendChild(input);
		},
		
		// Create the panel for the system.
		systemPanel = function () {
			var pnl = info.querySelector('.system'),
				derivedProperties = { // {object} Keys for properties that are derived quantities (rather than driven or general).
					physicalLength: true,
					opticalLength: true,
					modeSpacing: true,
					groupDelayDispersion: true
				};
			if (!pnl) {
				pnl = tmpl.cloneNode(true); // {HTMLDivElement} System block.
				pnl.className = 'system';       // Class name - used to clear items later.
				Utilities.foreach(system.userProperties(), function (k, prop) {
					var propertyName = typeof prop === 'string' ? prop : prop.propertyName;
					if (system.canSetProperty(propertyName)) {
						addActionRow(pnl, prop, system.property(propertyName));
					} else {
						addRow(pnl, propertyName, prettify(propertyName), 
							propertyName === 'stability' ? null : 'unary',
							derivedProperties[propertyName] ? 'propertyDerived advanced' : null);
					}
				});
				addRow(pnl, 'abcdSag', 'ABCD Sagittal', 'mx', 'propertyDerived advanced');
				addRow(pnl, 'abcdTan', 'ABCD Tangential', 'mx', 'propertyDerived advanced');
				systems.appendChild(pnl);
			}
			pnl.querySelector('h1').innerHTML = system.property('name');
			LaserCanvas.Element.inputProperties(pnl, system, system);
		},
		
		/**
		 * Create panel for a single element.
		 * @param {Element} element Optical element to create for.
		 */
		elementPanel = function (element) {
			var pnl = tmpl.cloneNode(true);      // {HTMLDivElement} Element block.
				
			// Prepare block.
			pnl.className = 'element';
			pnl.querySelector('h1').innerHTML = element.name;
			
			// Other properties.
			Utilities.foreach(element.userProperties(), function (k, prop) {
				var propertyName = prop.propertyName;
				if (prop.infoPanel !== false
					&& element.property(propertyName) !== undefined
					&& system.showElementProperty(propertyName)) {
					if (element.canSetProperty(propertyName)) {
						addActionRow(pnl, prop, element.property(propertyName), 'propertyElement advanced');
					} else {
						addRow(pnl, propertyName, prettify(propertyName), 'unary', 'propertyElement advanced');
					}
				}
			});
			LaserCanvas.Element.inputProperties(pnl, element, system);
			
			// Beam properties.
			addRow(pnl, 'modeSize');
			addRow(pnl, 'wavefrontROC', null, null, 'propertyElement advanced');
			addRow(pnl, 'distanceToWaist');
			addRow(pnl, 'waistSize', null, null, 'propertyElement advanced');

			// Add the element ABCD matrix readouts.
			addRow(pnl, 'abcdSag', 'ABCD Sagittal', 'mx', 'propertyDerived advanced');
			addRow(pnl, 'abcdTan', 'ABCD Tangential', 'mx', 'propertyDerived advanced');
			Utilities.foreach(LaserCanvas.InfoPanel.systemElementProperties, function (k, propertyName) {
				if (system.showElementProperty(propertyName)
					&& typeof element[propertyName] === 'function'
					&& element[propertyName]() !== false) {
					addRow(pnl, propertyName, prettify(propertyName), 'unary', null, 'propertyDerived advanced');
				}
			});
			
			// Return new element.
			return pnl;
		},
		
		// Create panels for system elements.
		elementPanels = function () {
			system.iterateElements(function (k, el) {
				var pnl = elementPanel(el, tmpl);
				pnl.setAttribute('data-element-index', k);
				elements.appendChild(pnl);
			});
		};
		
	clearItems();    // Clear existing items.
	systemPanel();   // Create system entries.
	elementPanels(); // Create entries for each element.
};

/**
* Update an information block for the given system.
* @param {object:System} system Optical system to update.
* @param {HTMLDivElement} info Container for panel entries.
*/
window.LaserCanvas.InfoPanel.updatePanel = function (system, info) {
	"use strict";
	var
		LaserCanvas = window.LaserCanvas,
		Utilities = LaserCanvas.Utilities,          // {object} Utility methods.
		modePlane = LaserCanvas.Enum.modePlane,            // {number:modePlane} Plane sagittal|tangential.
		numberFormat = LaserCanvas.Utilities.numberFormat, // {function} Formatted number.
		systems = info.querySelector('.systems'),          // {HTMLDivElement} Container for system properties.
		elements = info.querySelector('.elements'),        // {HTMLDivElement} Container for element properties.
		dir = +1, // {number} Propagation direction on elements, +1=forward.
		
		/**
		 * Retrieve the row for the given property.
		 * @param {HTMLDivElement} pnl Panel where to update.
		 * @param {string} propertyName Name of property row to retrieve.
		 * @param {number} sag Sagittal value to fill, or array of sagittal and tangential.
		 * @param {number} tan Tangential value to fill.
		 * @param {number} mx12 Matrix element (1, 2), if used.
		 * @param {number} mx22 Matrix element (2, 2), if used.
		 * @returns {HTMLTRElement} Table row for property.
		 */
		fillRow = function (pnl, propertyName, sag, tan, mx12, mx22) {
			var tr = pnl.querySelector('[data-property-name="' + propertyName + '"]');
			if (tr) {
				if (tr.hasAttribute('data-input')) {
					tr.querySelector('input').value = numberFormat(sag);
					
				} else if (tr.getAttribute('data-type') === 'unary') {
					tr.querySelector('[data-cell="value"]').innerHTML = numberFormat(sag, true);

				} else if (tr.getAttribute('data-type') === 'mx') {
					tr.querySelector('[data-cell="mx-1-1"]').innerHTML = numberFormat(sag, true);
					tr.querySelector('[data-cell="mx-2-1"]').innerHTML = numberFormat(tan, true);
					tr.querySelector('[data-cell="mx-1-2"]').innerHTML = numberFormat(mx12, true);
					tr.querySelector('[data-cell="mx-2-2"]').innerHTML = numberFormat(mx22, true);

				} else {
					// Expand two-element array, e.g. system property Stability.
					if (Array.isArray(sag)) {
						tan = sag[1];
						sag = sag[0];
					}
					// Used to have check e.g. cell.innerHTML = typeof sag === 'number' ? numberFormat(sag, true) : sag;
					tr.querySelector('[data-cell="sag"]').innerHTML = numberFormat(sag, true);
					tr.querySelector('[data-cell="tan"]').innerHTML = numberFormat(tan, true);
				}
			}
			return tr;
		},
		
		// Fill in properties from the beam parameters.
		// @param {Element} element Optical element whose properties to update.
		// @param {HTMLDivElement} pnl Panel where to update.
		// @param {string} propertyName Name of beam property to set.
		// @param {string=} property Name of property in internal ABCD object, if different from propertyName.
		updateBeam = function (pnl, element, propertyName, property) {
			var sag, tan;
			// The properties may not be set before first re-calculation.
			if (element.abcdQ) {
				property = property || propertyName;
				sag = element.abcdQ[modePlane.sagittal];
				tan = element.abcdQ[modePlane.tangential];
				fillRow(pnl, propertyName, 
					sag ? sag[property] : '-', 
					tan ? tan[property] : '-');
			}
		},
		
		// Update a property for the given element.
		// @param {HTMLDivElement} pnl Panel where to update.
		// @param {Element} element Optical element whose properties to update.
		// @param {string} propertyName Name of beam property to set.
		updateProperty = function (pnl, element, propertyName) {
			var val = element.property(propertyName);
			fillRow(pnl, propertyName, val === undefined ? '-' : val, '');
		},
		
		// Fill in the ABCD matrix in the given plane.
		// We use the "sagittal" and "tangential" columns to show the
		// two columns of the ABCD matrix.
		// @param {HTMLDivElement} pnl Panel where to update.
		// @param {string} propertyName Name of property to set.
		// @param {Matrix2x2} abcd ABCD matrix to show.
		updateAbcd = function (pnl, propertyName, abcd) {
			fillRow(pnl, propertyName, abcd[0][0], abcd[1][0], abcd[0][1], abcd[1][1]);
		},
		
		// Update the system values.
		updateSystem = function () {
			var pnl = systems.querySelector('.system'),
				systemAbcd = system.abcd(),
				mxSag = systemAbcd.sag.mx,
				mxTan = systemAbcd.tan.mx;
			Utilities.foreach(system.userProperties(), function (k, propertyName) {
				fillRow(pnl, propertyName, system.property(propertyName));
			});
			updateAbcd(pnl, 'abcdSag', mxSag);
			updateAbcd(pnl, 'abcdTan', mxTan);
		},

		// Update panel for a single element.
		// @param {HTMLDivElement} pnl Panel where to update.
		// @param {Element} el Optical element to update.
		updateElement = function (pnl, element) {
			if (element.property('unused') === true) {
				// Element is not currently in use, e.g. a null
				// thermal lens within a dielectric block.
				pnl.setAttribute('data-unused', 'true');
			} else {
				// Element is in use.
				pnl.removeAttribute('data-unused');
				
				// Update beam properties.
				updateBeam(pnl, element, 'modeSize', 'w');
				updateBeam(pnl, element, 'wavefrontROC', 'r');
				updateBeam(pnl, element, 'distanceToWaist', 'z0');
				updateBeam(pnl, element, 'waistSize', 'w0');
				
				// Other properties.
				LaserCanvas.Utilities.foreach(element.userProperties(), function (k, prop) {
					if (prop.infoPanel !== false) {
						updateProperty(pnl, element, prop.propertyName);
					}
				});
				
				// Update the element ABCD matrix readout.
				updateAbcd(pnl, 'abcdSag', element.elementAbcd(dir, modePlane.sagittal  ));
				updateAbcd(pnl, 'abcdTan', element.elementAbcd(dir, modePlane.tangential));
				Utilities.foreach(window.LaserCanvas.InfoPanel.systemElementProperties, function (k, propertyName) {
					if (system.showElementProperty(propertyName)
						&& pnl.querySelector('[data-property-name="' + propertyName + '"]')
						&& typeof element[propertyName] === 'function') {
						fillRow(pnl, propertyName, element[propertyName](system.property('wavelength')));
					}
				});
			}
		},
		
		// Update optical system elements.
		updateElements = function () {
			system.iterateElements(function (k, element) {
				var pnl = elements.querySelector('[data-element-index="' + k + '"]');
				updateElement(pnl, element);
			});
		};
		
	updateSystem();   // Update the system values.
	updateElements(); // Update entries for each element.

};

window.LaserCanvas.InfoPanel.prototype = {
	/**
	 * Initialize references to system and render.
	 * @param {System} system Reference to system.
	 * @param {Render} render Reference to renderer.
	 */
	init: function (system, render, variablesGetter) {
		this.system = system;
		this.render = render;
		this.variablesGetter = variablesGetter;
		this.systemPropertiesPanel = null;
		return this;
	},

	/**
	* Activate the panel for changes to system and renderer properties.
	* @param {object:System} system Optical system whose properties to manipulate.
	* @param {object:Render} render Renderer whose properties to manipulate.
	*/
	activatePanel: function () {
		"use strict";
		var Utilities = window.LaserCanvas.Utilities,
			foreach = Utilities.foreach, // {function} Iterator function.
			system = this.system,
			render = this.render,
			info = this.info,

			// A system property is changed.
			// @this {HTMLInputElement} Changed input element.
			systemKeyup = function () {
				var propertyName = this.getAttribute('data-property-name');
				system.property(propertyName, this.value);
			},
			
			// A renderer checkbox is changed.
			// @this {HTMLInputElement} Changed check box input element.
			renderCheckboxClick = function () {
				var propertyName = this.getAttribute('data-property-name');
				render.property(propertyName, this.checked);
			},

			// The mouse enters a region related to an element.
			// @this {MouseEvent} Triggering mouse event.
			mouseEnter = function (e) {
				var parent = Utilities.closest(e.target, '[data-element-index]'),
					elementIndex = +parent.getAttribute('data-element-index');
				render.highlightElement(system.element(elementIndex));
			},
	
			// The mouse leaves a region related to an element.
			mouseLeave = function () {
				render.highlightElement(null);
			};
			
		// System properties.
		foreach(info.querySelectorAll('.system input[type="text"]'), function () {
			this.value = system.property(this.getAttribute('data-property-name'));
			this.onkeyup = systemKeyup;
		});

		// Render properties.
		foreach(info.querySelectorAll('.render input[type="checkbox"]'), function () {
			this.checked = render.property(this.getAttribute('data-property-name'));
			this.onclick = renderCheckboxClick;
		});

		// Element relationships
		foreach(info.querySelectorAll('[data-element-index] h1'), function () {
			this.addEventListener('mouseenter', mouseEnter);
			this.addEventListener('mouseleave', mouseLeave);
		});
	},
	
	/**
	* The components of the system have changed.
	* @return {object:InfoPanel} This object for chaining.
	*/
	change: function () {
		"use strict";
		window.LaserCanvas.InfoPanel.createPanel.call(this, this.system, this.info);
		this.activatePanel();

		if (!this.systemPropertiesPanel) {
			// TODO: Check that the system panel can stay on system change.
			this.systemPropertiesPanel = new LaserCanvas.InfoPropertiesPanel(this.system.get("name"), this.system, this.variablesGetter)
				.appendTo(this.info.querySelector(".systems"));
			this.systemPropertiesPanel.addAbcdRow("abcdSag");
			this.systemPropertiesPanel.addAbcdRow("abcdTan");
		}

		return this;
	},
	
	/**
	* An element within the system has had a property
	* updated, or an element has moved.
	* @return {object:InfoPanel} This object for chaining.
	*/
	update: function () {
		"use strict";
		window.LaserCanvas.InfoPanel.updatePanel(this.system, this.info);
		this.systemPropertiesPanel.update();
		return this;
	},

	/**
	 * Highlights the given element.
	 * @param {Element} element Element to highlight.
	 */
	highlightElement: function (element) {
		var elem, // {HTMLElement} Element gaining or losing highlight.
			elements = this.system.elements(),
			elementIndex = window.LaserCanvas.Utilities.firstIndex(
				elements,
				function () {
					return this === element;
				});
		if (elementIndex >= 0) {
			elem = this.info.querySelector('[data-element-index="' + elementIndex + '"] h1');
			if (elem) {
				elem.setAttribute('data-highlight-element', 'true');
			}
		} else {
			elem = this.info.querySelector('[data-highlight-element]');
			if (elem) {
				elem.removeAttribute('data-highlight-element');
			}
		}
	}
};




