/**
* Laser canvas system.
*/
(function (LaserCanvas) {
"use strict";
LaserCanvas.System = function () {
	var
		melements = [],
		meventListeners = {
			update: [],              // An element has properies or position updated.
			change: []               // The structure of the system has changed.
		},
		mabcd = {},                 // {object} System solved ABCD calculation.
		mprop = {                   // {object} System properties read/write by SystemAbcd.
			name: 'System',          // {string} Name of system.
			configuration: LaserCanvas.System.configuration.linear,
			wavelength: new LaserCanvas.Equation(1000), // {number} (nm) System wavelength
			physicalLength: 0,       // {number} (mm) Physical length.
			opticalLength: 0,        // {number} (mm) Optical length.
			groupDelayDispersion: 0, // {number} (fs^2/rad) System group delay dispersion.
			modeSpacing: 0,          // {number} (MHz) Optical mode spacing.
			initialWaist: new LaserCanvas.Equation(100) // {number} (um) Initial waist size.
		},
		mvariablesGetter = null,     // {function|null} Function to retrieve current variable values.
		
		// -------------------------------------------------
		//  Accessors.
		// -------------------------------------------------
		
		/**
		* System ABCD calculation results.
		* @returns {object} Calculation results.
		*/
		abcd = function () {
			return mabcd;
		},
		
		/**
		* Return an array of properties to show.
		* @returns {Array<string>} Property names to show.
		*/
		userProperties = function () {
			var configuration = LaserCanvas.System.configuration,
				props = [{
					propertyName: 'wavelength',
					//standard: [266, 532, 632, 800, 810, 1040, 1064],
					increment: 10,
					min: 100,
					max: 5000
				}];
				
			switch (mprop.configuration) {
				case configuration.propagation:
					props.push({
						propertyName: 'initialWaist',
						increment: 10,
						min: 10,
						max: 5000
					});
					// props.push('initialDistance'); // TODO: Need to figure out calculation for initial Q in SystemAbcd.js.
					break;
			}
				
			props.push('physicalLength');
			props.push('opticalLength');

			switch (mprop.configuration) {
				case configuration.linear:
				case configuration.endcap:
					props.push('modeSpacing');
					props.push('stability');
					break;
					
				case configuration.ultrafast:
					props.push('modeSpacing');
					props.push('groupDelayDispersion');
					props.push('stability');
					break;
					
				case configuration.ring:
					props.push('stability');
					break;
			}
			return props;
		},
		
		/**
		* Determine whether a property can be set, e.g. from info panel.
		* @param {string} propertyName Name of property to check.
		* @returns {boolean} Value indicating whether the given property can be set.
		*/
		canSetProperty = function (propertyName) {
			return {
				"initialWaist": true,
				"wavelength": true
			}[propertyName];
		},
		
		/**
		 * Sets an internal property equation to a new value.
		 * @param {string} propertyName Name of property to set, "distanceToNext"|...
		 * @param {string|number} newValue New value to set. It is passed to the equation.
		 * @param {boolean} arg Additional argument, e.g. for outgoing angle whether first optic.
		 */
		set = function (propertyName, newValue) {
			switch (propertyName) {
				case "wavelength":
				case "initialWaist":
					mprop[propertyName].set(newValue);
					break;
			}
			fireEventListeners('update');
		},

		/**
		 * Returns the property evaluated using the given variable values.
		 * @param {string} propertyName Name of property to evaluate and return.
		 */
		get = function (propertyName) {
			var variables = mvariablesGetter(),
				value = mprop[propertyName]
					&& mprop[propertyName].value
					&& mprop[propertyName].value(variables);
			switch (propertyName) {
				case "wavelength":
				case "initialWaist":
					value = mprop[propertyName].value(variables);
					return Math.max(0, value);

				case "stability":
					return [
						(mabcd.sag.mx[0][0] + mabcd.sag.mx[1][1]) / 2,
						(mabcd.tan.mx[0][0] + mabcd.tan.mx[1][1]) / 2
					];
			}
			// Properties also includes non-equation, derived quantities.
			return mprop[propertyName];
		},

		/** Returns a property's source equation. */
		expression = function (propertyName) {
			switch (propertyName) {
				case "wavelength":
				case "initialWaist":
					return mprop[propertyName].expression();
				default:
					console.error(`expression should not be called with propertyName=${propertyName}`);
					return "";
			}
		},

		/**
		 * Returns a value indicating whether the given element can be removed
		 * from the system. This will normally be TRUE, but FALSE to ensure at
		 * least three mirrors remain in a ring cavity.
		 * @param {Element} element Element queried for removal.
		 */
		canDeleteElement = function (element) {
			if (element.type === LaserCanvas.Element.Mirror.Type &&
				mprop.configuration === LaserCanvas.System.configuration.ring &&
				melements.reduce(function(count, elem) {
					return count + (elem.type === LaserCanvas.Element.Mirror.Type ? 1 : 0);
				}, 0) <= 3
			) {
				return false;
			}
			return true;
		},

		/**
		* Determine whether a given element property should
		* be shown. For example, group velocity dispersion is
		* only used in ultrafast resonator types.
		* @param {string} propertyName Name of property to check.
		* @returns {boolean} Value indicating whether the property is to be shown.
		*/
		showElementProperty = function (propertyName) {
			switch (propertyName) {
				case 'groupVelocityDispersion':
				case 'groupDelayDispersion':
					return mprop.configuration === LaserCanvas.System.configuration.ultrafast;
			}
			
			return true;
		},
		
		/**
		* Gets the elements in this system.
		* @returns {Array<Element>} Elements in this system.
		*/
		elements = function () {
			return melements;
		},
		
		/**
		 * Returns the element at the given index.
		 * @param {number} index Index of element to retrieve.
		 * @returns {Element} Element at index, or undefined.
		 */
		element = function (index) {
			return melements[index];
		},

		/**
		* Iterate elements over a callback function. The function
		* can return FALSE to break out of the loop.
		* @param {function} fn Function that is iterated.
		* @param {...} args Additional arguments passed to function.
		*/
		iterateElements = function (fn, args) {
			var k, el;
			args = Array.prototype.slice.call(arguments, 1);
			for (k = 0; k < melements.length; k += 1) {
				el = melements[k];
				if (fn.apply(el, [k, el].concat(args)) === false) {
					break;
				}
			}
		},
		
		/**
		* Determine the first element at the given location.
		* @param {Point} pt Point where to examine.
		* @param {number} tol (mm) Distance tolerance.
		* @returns {Element?} Element at location, or NULL.
		*/
		elementAtLocation = function (pt, tol) {
			var k, element;
			for (k = 0; k < melements.length; k += 1) {
				element = melements[k];
				if ((element.atLocation || LaserCanvas.Element.atLocation).call(element, pt, tol)) {
					return element;
				}
			}
			return null;
		},
		
		/**
		* Determine the segment and distance along it that is
		* closest to the given point.
		* @param {Point} pt Point to examine.
		* @param {string=} filterBy Element field name to test, e.g. 'insertElement' to restrict to those segments that can accept a new element.
		* @returns {object} Closest point on a segment, plus information about element and distance.
		*/
		segmentNearLocation = function (pt, filterBy) {
			var k, loc, V, W, z, x, y, r2, zMax,
				seg = null,                       // {object?} Returned best segment.
				Vector = LaserCanvas.Math.Vector, // {function} Construction function for vector.
				kmax = mprop.configuration === LaserCanvas.System.configuration.ring
					? melements.length : melements.length - 1;   // How many segments to check.

			for (k = 0; k < kmax; k += 1) {
				if (!filterBy || melements[k].canSetProperty(filterBy)) {
					loc = melements[k].location(); // {Point} Current optic location.
					zMax = melements[k].get("distanceToNext"); // {number} (mm) Distance to next element.
					
					// Calculate dot product.
					V = new Vector([   // Normalized axis vector.
						Math.cos(loc.q),
						Math.sin(loc.q)
					]);
					W = new Vector([   // Vector from optic to mouse.
						pt.x - loc.x,
						pt.y - loc.y
					]);
					z = V.dot(W);      // {number} (mm) Distance along axis to closest point.
					
					// Distance from point on segment to mouse.
					// We could use magnitude of difference vector, but need the
					// method here for points beyond the segment anyway.
					z = z < 0 ? 0 : z > zMax ? zMax : z;   // Constrain to segment.
					x = loc.x + z * Math.cos(loc.q);         // {number} (mm) Horizontal location of point on axis.
					y = loc.y + z * Math.sin(loc.q);         // {number} (mm) Vertical location of point on axis.
					r2 = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y); // {number} (mm^2) Squared distance.
					
					if (!seg || r2 < seg.r2) {
						seg = {
							x: x,     // {number} (mm) World horizontal location of point on segment.
							y: y,     // {number} (mm) World vertical location of point on segment.
							z: z,     // {number} (mm) Distance along segment.
							q: loc.q, // {number} (rad) Rotation of axis.
							indx: k,  // {number} Element index.
							r2: r2    // {number} (mm^2) Squared distance from point to segment.
						};
					}
				} // end filterBy check.
			} // end for loop.
			return seg;
		},
		
		/**
		* Return mode information for the given point. Use
		* segmentNearLocation to calculate the appropriate
		* values for seg, from which we use properties indx
		* (preceding element index) and z (distance along
		* the segment).
		* @param {object} seg Segment and element information.
		* @param {number:modePlane} plane Plane to inspect.
		* @returns {object} Information about mode at point.
		*/
		inspectSegment = function (seg, plane) {
			var element = melements[seg.indx];
			return LaserCanvas.systemAbcd.propagateParameters(
				element.abcdQ[plane], 
				element.get("refractiveIndex") || 1,
				seg.z);
		},
		
		// -------------------------------------------------
		//  Event listeners.
		// -------------------------------------------------

		/**
		* Add an event listener.
		* @param {string} name Name of event to register for.
		* @param {function} handler Method to call. The THIS argument is set to the system.
		*/
		addEventListener = function (name, handler) {
			var k;
			if (meventListeners.hasOwnProperty(name)) {
				// Don't add duplicates of same handler.
				for (k = 0; k < meventListeners[name].length; k += 1) {
					if (meventListeners[name][k] === handler) {
						return;
					}
				}
				
				// Add new event.
				meventListeners[name].push(handler);
			}
		},
		
		/**
		* Remove an event listener.
		* @param {string} name Name of event to register for.
		* @param {function} handler Method to call. The THIS argument is set to the system.
		*/
		removeEventListener = function (name, handler) {
			var k;
			if (meventListeners.hasOwnProperty(name)) {
				for (k = meventListeners[name].length - 1; k >= 0; k -= 1) {
					if (meventListeners[name][k] === handler) {
						meventListeners[name].splice(k, 1);
					}
				}
			}
		},

		/**
		* Fire an event.
		* @param {string} name Name of event to fire.
		*/
		fireEventListeners = function (name) {
			var k;
			if (meventListeners.hasOwnProperty(name)) {
				for (k = 0; k < meventListeners[name].length; k += 1) {
					meventListeners[name][k].call(this);
				}
			}
		},
		
		// -------------------------------------------------
		//  Calculations.
		// -------------------------------------------------

		/** Sets the callback function used to retrieve variable values. */
		setVariablesGetter = function (getter) {
			mvariablesGetter = getter;
		},

		/** Retrieves current variables, or returns empty object as callback. */
		getVariables = function () {
			return mvariablesGetter ? mvariablesGetter() : {};
		},

		/**
		* Update the rotation of the cavity end elements. The
		* elements are most likely mirrors.
		* For a standing wave cavity, the mirrors are at normal
		* incidence, so incoming and outgoing vectors will be
		* anti-parallel.
		*/
		alignEndElements = function () {
			var pivotIndex = LaserCanvas.SystemUtil.alignEndElements(mprop, melements);
			if (pivotIndex) {
				calculateCartesianCoordinatesOnly(pivotIndex);
			}
		},
		
		/**
		* Calculate the Cartesian coordinates of all elements.
		* @param {number=} kstart_in Index of first element to calculate, if any. The element is included.
		* @param {number=} kend_in Index of final element to calculate, if any. The element is included.
		*/
		calculateCartesianCoordinates = function (kstart_in, kend_in) {
			calculateCartesianCoordinatesOnly(kstart_in, kend_in);
			// Align cavity end elements.
			alignEndElements();
		},

		calculateCartesianCoordinatesOnly = function (kstart_in, kend_in) {
			var variables = getVariables(),
				k, element, d,
				loc,                                 // {object} Current element location (x, y, q, ...).
				// /---TODO---------------------------------------------------------\
				// | We always have to start at the beginning of the system because |
				// | it's only the first element whose q parameter is the outgoing  |
				// | angle. (All others are deflections.) We could change that by   |
				// | storing an additional value for the outgoing angle.            |
				// '----------------------------------------------------------------'
				kstart = kstart_in !== undefined && kstart_in >= 0 ? kstart_in : 0,              // {number} Starting index.
				kend = kend_in !== undefined ? kend_in : melements.length - 1, // {number} Ending index.
				ax = melements[kstart].location();   // {object} Ongoing system axis (x, y, q).
				
			for (k = kstart; k <= kend; k += 1) {
				// Set and get location (no need to set first element).
				element = melements[k];         // {Element} Element in system.
				loc = element.location(k === kstart  // {object} Element transfer properties.
					? null                       // Don't update first element ..
					: ax);                       // ..only subsequent ones.
				d = element.get("distanceToNext", variables);
				// Traverse to next.
				ax.q = loc.q;                   // {number} (rad) Next axis direction.
				ax.x += d * Math.cos(ax.q); // {number} (mm) Advance horizontal location.
				ax.y += d * Math.sin(ax.q); // {number} (mm) Advance vertical location.
			}
			
		},
		
		/**
		* Calculate the system ABCD coordinates.
		*/
		calculateAbcd = function () {
			mabcd = LaserCanvas.systemAbcd(melements, mprop, getVariables());
		},
		
		/**
		* Prepare for an optic drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag Element being dragged.
		* @returns {object|boolean} dragData Data to be passed to dragElement() method, or FALSE if elements can't be found.
		*/
		adjust = LaserCanvas.systemAdjust(melements, calculateCartesianCoordinates, getVariables),
		
		/**
		* Start dragging an element.
		* @param {Point} pt (mm) Current mouse world coordinates.
		* @param {Element} elDrag Element being dragged.
		* @returns {boolean} Value indicating whether drag should start.
		*/
		dragElementStart = function (pt, elDrag) {
			return adjust.start.call(this, pt, elDrag);
		},
		
		/**
		* During a drag.
		* An element is being dragged. This calculates the new stretch and
		* pivot values for the relevant anchor points and updates the system
		* coordinates on any changes.
		* @param {Point} pt (mm) Current mouse world coordinates during drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag Element being dragged. The parameter is not used.
		*/
		dragElement = function (pt, ptStart, elDrag_notused) {
			var needsUpdate = adjust.drag.call(this, pt, ptStart);
			if (needsUpdate) {
				update();
			}
		},
		
		/**
		* Finish a drag.
		* @param {Point} ptEnd (mm) Final mouse world coordinates during drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag Element being dragged. The parameter is not used.
		*/
		dragElementEnd = function (ptEnd, ptStart, elDrag_notused) {
			adjust.end.call(this, ptEnd, ptStart);
			update();
		},
		
		/**
		* Update the system calculation and redraw, e.g. in
		* response to an element property change.
		* @param {boolean=} updateCoordinates Boolean value indicating whether the optic coordinates need to be updated.
		* @param {boolean=} systemchanged Value indicating whether the system has changed, e.g. changing Dielectric plate / Brewster / crystal.
		*/
		update = function (updateCoordinates, systemChanged) {
			if (updateCoordinates) {
				calculateCartesianCoordinates();
			}
			if (systemChanged) {
				fireEventListeners('change');
			}
			fireEventListeners('update');
		},
		
		/**
		 * Respond to a change in variables. This notifies internal
		 * event listeners. The caller must still call update().
		 * @param {boolean} updateCoordinates Optional value indicating
		 * whether cartesian coordinates should always be updated. By
		 * default, coordinates are only updated for ring cavities.
		 */
		onVariablesChange = function (updateCoordinates) {
			melements.forEach(function (element) {
				element.onVariablesChange && element.onVariablesChange();
			});

			// On a variable change, we'll need to update the coordinates
			// anyway, so do it now. When scanning ring cavities, we need
			// to calculate the coordinates to determine the final leg.
			if (updateCoordinates || this.get("configuration") === LaserCanvas.System.configuration.ring) {
				try {
					calculateCartesianCoordinates();
				} catch (err) {
					// TODO: Handle bad cavity (e.g. ring that didn't close)
				}
			}

			// Calculate the new ABCD, we'll need it right away.
			this.calculateAbcd();
		},

		// -------------------------------------------------
		//  Add and remove elements.
		// -------------------------------------------------
		
		/**
		* Apply labelling to each optic in the system.
		*/
		updateElementNames = function () {
			var name,
				localize = LaserCanvas.localize,  // {function} Localize for symbols.
				typeCount = {}; // {object} Count of elements of each kind.
			LaserCanvas.Utilities.foreach(melements, function (k_notused, element) {
				var type = element.type;
				typeCount[type] = (typeCount[type] || 0) + 1;
				name = localize('symbol' + type) + typeCount[type];
				if (typeof element.setName === 'function') {
					element.setName(name);
				} else {
					element.name = name;
				}
			});
		},
		
		/**
		* Insert a new element.
		* @this {System} Calling system.
		* @param {Point} pt Point where to insert.
		* @param {string} elementName Name of element to insert.
		* @returns {Element} The newly created element, or the first element of a new group.
		*/
		insertElement = function (pt, elementName) {
			var element,
				seg = segmentNearLocation(pt, 'insertElement'),    // {object} Segment where being inserted.
				prevElement = melements[seg.indx],                 // {Element} Element after which to insert.
				Element = LaserCanvas.Element[elementName]; // {function} Element constructor function.
			
			if (Element.createGroup) {
				// Element.createGroup returns {Array<object>}, so
				// we use apply to distribute the returned objects
				// into the splice command.
				Array.prototype.splice.apply(melements, [seg.indx + 1, 0].concat(Element.createGroup(prevElement, seg.z, mvariablesGetter)));
				element = melements[seg.indx + 1];
			} else {
				element = new Element(mvariablesGetter); // {Element} Newly created element.
				element.set("distanceToNext", prevElement.get("distanceToNext") - seg.z); // Remaining distance.
				prevElement.set("distanceToNext", seg.z); // Set new distance.
				if (element.init) {
					element.init(this);
				}
				melements.splice(seg.indx + 1, 0, element);
			}
			updateElementNames();
			calculateCartesianCoordinates();
			fireEventListeners('change');
			return element;
		},
		
		/**
		* Remove an element.
		* @param {Element} element Element to delete.
		*/
		removeElement = function (element) {
			var prevElement,
				variables = getVariables(),
				isRing = mprop.configuration === LaserCanvas.System.configuration.ring,
				k = isRing ? melements.length - 1 : melements.length - 2,
				n = 1; // {number} Count of items to remove.
				
			// Don't delete last or first elements.
			for (; k >= 1; k -= 1) {
				if (melements[k] === element) {
					prevElement = melements[k - 1];
					if (typeof element.removeGroup === 'function') {
						n = element.removeGroup(prevElement);
					} else {
						prevElement.set("distanceToNext",
							prevElement.get("distanceToNext", variables) + melements[k].get("distanceToNext", variables));
					}
					if (element.destroy) {
						element.destroy();
					}
					melements.splice(k, n);
					updateElementNames();
					calculateCartesianCoordinates();
					fireEventListeners('change');
					break;
				}
			}
		},
		
		// -------------------------------------------------
		//  Empty system.
		// -------------------------------------------------
		
		/**
		 * Recreate the system from the given data blob.
		 * @param {object} json Loaded JSON object.
		 */
		fromJson = function (json) {
			LaserCanvas.SystemUtil.fromJson(json, mprop, melements, this, mvariablesGetter);
			updateElementNames();
			calculateCartesianCoordinates();
			fireEventListeners("change");
			fireEventListeners("update");
		},

		/**
		 * Returns a JSON representation of the system.
		 */
		toJson = function () {
			return LaserCanvas.SystemUtil.toJson(mprop, melements);
		},

		/**
		* Create a default system.
		* @param {string:System.configuration} configuration Type of cavity to build 'linear'|'ring'|'endcap'.
		* @param {Array<object>} elementsInfo Information about each element, if explicitly creating.
		* @param {object=} loc Initial location values.
		*/
		createNew = function (configuration, elementsInfo, loc) {
			var SystemUtil = LaserCanvas.SystemUtil;         // {object} System namespace.
			SystemUtil.createNew(configuration, elementsInfo, loc, mprop, melements, mvariablesGetter);

			// Calculate Cartesian coordinates.
			updateElementNames();
			calculateCartesianCoordinates();
			fireEventListeners('change');
			fireEventListeners('update');
		},
		
		/**
		 * Load a LaserCanvas 5 text file. This is used by testSystemLoad.js.
		 * @param {string} src Source text file.
		 */
		fromTextFile = function (src, variablesSetter) {
			var json = LaserCanvas.SystemUtil.textFileToJson(src);
			variablesSetter(json.variables);
			LaserCanvas.SystemUtil.fromJson(json, mprop, melements, this, mvariablesGetter);
			variablesSetter(json.variables);

			// Calculate Cartesian coordinates.
			updateElementNames();
			calculateCartesianCoordinates();
			fireEventListeners('change');
			fireEventListeners('update');
		};
	
	/**
	* Public methods.
	*/
	return {
		abcd: abcd,                               // Retrieve system ABCD calculation results.
		addEventListener: addEventListener,       // Register a handler for an event.
		showElementProperty: showElementProperty, // Determine whether a given element property should be shown.
		calculateAbcd: calculateAbcd,             // Calculate the ABCD values for this system.
		canSetProperty: canSetProperty,           // Determine whether a property value can be set.
		canDeleteElement: canDeleteElement,       // Determine whether an element can be deleted.
		createNew: createNew,                     // Create a new system.
		dragElement: dragElement,                 // Update during drag.
		dragElementEnd: dragElementEnd,           // Finished dragging an element.
		dragElementStart: dragElementStart,       // Prepare for a drag.
		elementAtLocation: elementAtLocation,     // Find an element at the given mouse location.
		element: element,                         // Returns the element at the given index.
		elements: elements,                       // Retrieve elements for this system.
		expression: expression,                   // Retrieve the expression of a variable.
		fromJson: fromJson,                       // Create the system from a data blob.
		fromTextFile: fromTextFile,               // Create the system from a LaserCanvas5 text file.
		get: get,                                 // Retrieve a value.
		insertElement: insertElement,             // Insert a new element near the given point.
		inspectSegment: inspectSegment,           // Inspect beam on a segment (from segmentNearLocation).
		iterateElements: iterateElements,         // Iterate all elements in the system.
		onVariablesChange: onVariablesChange,     // Respond to a change in variables.
		removeElement: removeElement,             // Remove the given element.
		removeEventListener: removeEventListener, // Remove an event handler.
		segmentNearLocation: segmentNearLocation, // Segment point closest to point.
		set: set,                                 // Set a property value.
		setVariablesGetter: setVariablesGetter,   // Set the callback to retrieve variable values.
		toJson: toJson,                           // Returns a JSON representation of the system.
		type: "System",                           // For identifying data source.
		update: update,                           // Update system calculation.
		userProperties: userProperties            // Retrieve properties for read/write by user.
	};
};

// Different configurations.
LaserCanvas.System.configuration = {
	ultrafast: 'ultrafast',     // Dispersion compensated resonator.
	endcap: 'endcap',           // End coated dielectric.
	linear: 'linear',           // Simple linear resonator.
	propagation: 'propagation', // Propagation system.
	ring: 'ring'                // Simple ring resonator.
};
}(window.LaserCanvas));
