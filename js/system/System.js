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
			wavelength: 1000,        // {number} (nm) System wavelength
			physicalLength: 0,       // {number} (mm) Physical length.
			opticalLength: 0,        // {number} (mm) Optical length.
			groupDelayDispersion: 0, // {number} (fs^2/rad) System group delay dispersion.
			modeSpacing: 0,          // {number} (MHz) Optical mode spacing.
			initialWaist: 100        // {number} (um) Initial waist size.
		},
		
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
		* Retrieve one of the system property values.
		* @param {string} propertyName Name of property to retrieve.
		* @param {number|...=} newValue New value to set to, if changing.
		* @returns {number} Property value.
		*/
		property = function (propertyName, newValue) {
			if (newValue !== undefined) {
				switch (propertyName) {
					case 'initialWaist':
					case 'wavelength':
						if (!isNaN(+newValue)) {
							mprop[propertyName] = +newValue;
							fireEventListeners('update');
						}
						break;
				}
			} else {
				switch (propertyName) {
					case 'wavelength':
						return mprop[propertyName];
						
					case 'stability':
						return [
							(mabcd.sag.mx[0][0] + mabcd.sag.mx[1][1]) / 2,
							(mabcd.tan.mx[0][0] + mabcd.tan.mx[1][1]) / 2
						];
				}
				return mprop[propertyName];
			}
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
					zMax = melements[k].property("distanceToNext"); // {number} (mm) Distance to next element.
					
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
				element.property('refractiveIndex') || 1,
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

		/**
		* Update the rotation of the cavity end elements. The
		* elements are most likely mirrors.
		* For a standing wave cavity, the mirrors are at normal
		* incidence, so incoming and outgoing vectors will be
		* anti-parallel.
		*/
		alignEndElements = function () {
			var Vector = LaserCanvas.Math.Vector, // {function} Vector construction function.
				U, V, Z, l,         // Vectors for ring cavity.
				el = melements[0],  // {Element} Starting element.
				le = melements[melements.length - 1]; // {Element} Final element.
			
			if (mprop.configuration === LaserCanvas.System.configuration.ring) { 
				// Ring cavity construction vectors.
				// TODO: This simple ring doesn't allow optics between
				// the last and first mirror. A complete ring layout
				// would need changes:
				//  - The last pivot mirror (and any subsequent inline
				//    elements) would need proper angleOfIncidence,
				//    distanceToNext etc. calculated.
				//  - These values would need to accurately meet up
				//    with the first pivot mirror location.
				//  - Dragging the last pivot mirror (and any subsequent
				//    elements) might be achieved by temporarily adding
				//    a clone of the first mirror at the end of the
				//    cavity while doing the adjustment calculations.
				//  - Dragging the first pivot mirror would be a bit
				//    more complex.
				// For now - let's just make a simple ring.
				Z = new Vector(el.loc.x - le.loc.x, el.loc.y - le.loc.y);
				l = Z.norm();                           // Vector length.
				Z = Z.normalize();                      // Vector from last to first element.
				U = new Vector(1, 0).rotate(-el.loc.q); // Bisected outgoing vector from first element.
				V = new Vector(1, 0).rotate(-le.loc.p); // Bisected incoming vector to last element.

				// Alignments.
				el.loc.p = Z.atan2();
				el.property('deflectionAngle', Math.atan2(Z.cross(U), Z.dot(U))); // Updates angleOfIncidence.
				le.property('deflectionAngle', Math.atan2(V.cross(Z), V.dot(Z))); // Updates angleOfIncidence.
				le.loc.q = Z.atan2();
				le.property("distanceToNext", l);
			} else {
				// Linear cavity: Normal incidence.
				el.loc.p = el.loc.q + Math.PI;
				le.property("distanceToNext", 0);
				le.property('deflectionAngle', Math.PI);
			}
		},
		
		/**
		* Calculate the Cartesian coordinates of all elements.
		* @param {number=} kstart_in Index of first element to calculate, if any. The element is included.
		* @param {number=} kend_in Index of final element to calculate, if any. The element is included.
		*/
		calculateCartesianCoordinates = function (kstart_in, kend_in) {
			var k, element, d,
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
				d = element.property("distanceToNext");

				// Traverse to next.
				ax.q = loc.q;                   // {number} (rad) Next axis direction.
				ax.x += d * Math.cos(ax.q); // {number} (mm) Advance horizontal location.
				ax.y += d * Math.sin(ax.q); // {number} (mm) Advance vertical location.
			}
			
			// Align cavity end elements.
			alignEndElements();
		},
		
		/**
		* Calculate the system ABCD coordinates.
		*/
		calculateAbcd = function () {
			mabcd = LaserCanvas.systemAbcd(melements, mprop);
		},
		
		/**
		* Prepare for an optic drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag Element being dragged.
		* @returns {object|boolean} dragData Data to be passed to dragElement() method, or FALSE if elements can't be found.
		*/
		adjust = LaserCanvas.systemAdjust(melements, calculateCartesianCoordinates),
		
		/**
		* Start dragging an element.
		* @param {Point} pt (mm) Current mouse world coordinates.
		* @param {Element} elDrag Element being dragged.
		* @returns {boolean} Value indicating whether drag should start.
		*/
		dragElementStart = function (pt, elDrag) {
			return adjust.start(pt, elDrag);
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
			var needsUpdate = adjust.drag(pt, ptStart);
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
			adjust.end(ptEnd, ptStart);
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
				Array.prototype.splice.apply(melements, [seg.indx + 1, 0].concat(Element.createGroup(prevElement, seg.z)));
				element = melements[seg.indx + 1];
			} else {
				element = new Element(); // {Element} Newly created element.
				element.property('distanceToNext', prevElement.property('distanceToNext') - seg.z); // Remaining distance.
				prevElement.property('distanceToNext', seg.z); // Set new distance.
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
			var k, prevElement,
				n = 1; // {number} Count of items to remove.
				
			// Don't delete last or first elements.
			for (k = melements.length - 2; k >= 1; k -= 1) {
				if (melements[k] === element) {
					prevElement = melements[k - 1];
					if (typeof element.removeGroup === 'function') {
						n = element.removeGroup(prevElement);
					} else {
						prevElement.property('distanceToNext',
							prevElement.property('distanceToNext') + melements[k].property('distanceToNext'));
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
		 * Reset the system to the given JSON state.
		 * @param {function} jsonSource Function to invoke to retrieve the JSON data.
		 */
		fromJsonSource = function (jsonSource) {
			try {
				jsonSource(mprop, melements, this);
			} catch (e) {
				createNew(LaserCanvas.System.configuration.linear);
			}
			calculateCartesianCoordinates();
			fireEventListeners("change");
			fireEventListeners("update");
		},

		/**
		 * Write the current system JSON to the given destination.
		 * @param {function} jsonDestination Function invoked to create the JSON data.
		 */
		toJsonDestination = function (jsonDestination) {
			var json = LaserCanvas.SystemUtil.toJson(mprop, melements);
			jsonDestination(json);
		},

		/**
		* Create a default system.
		* @param {string:System.configuration} configuration Type of cavity to build 'linear'|'ring'|'endcap'.
		* @param {Array<object>} elementsInfo Information about each element, if explicitly creating.
		* @param {object=} loc Initial location values.
		*/
		createNew = function (configuration, elementsInfo, loc) {
			var SystemUtil = LaserCanvas.SystemUtil;         // {object} System namespace.
			SystemUtil.createNew(configuration, elementsInfo, loc, mprop, melements);

			// Calculate Cartesian coordinates.
			updateElementNames();
			calculateCartesianCoordinates();
			fireEventListeners('change');
			fireEventListeners('update');
		},

		/**
		 * Load a LaserCanvas 5 text file.
		 * @param {string} src Source text file.
		 */
		fromTextFile = function (src) {
			var json = LaserCanvas.SystemUtil.textFileToJson(src);
			LaserCanvas.SystemUtil.fromJson(json, mprop, melements);

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
		createNew: createNew,                     // Create a new system.
		dragElement: dragElement,                 // Update during drag.
		dragElementEnd: dragElementEnd,           // Finished dragging an element.
		dragElementStart: dragElementStart,       // Prepare for a drag.
		elementAtLocation: elementAtLocation,     // Find an element at the given mouse location.
		element: element,                         // Returns the element at the given index.
		elements: elements,                       // Retrieve elements for this system.
		fromJsonSource: fromJsonSource,           // Reset the system to the given JSON state.
		fromTextFile: fromTextFile,               // Load a LaserCanvas 5 text file.
		insertElement: insertElement,             // Insert a new element near the given point.
		inspectSegment: inspectSegment,           // Inspect beam on a segment (from segmentNearLocation).
		iterateElements: iterateElements,         // Iterate all elements in the system.
		property: property,                       // Retrieve a property value.
		removeElement: removeElement,             // Remove the given element.
		removeEventListener: removeEventListener, // Remove an event handler.
		segmentNearLocation: segmentNearLocation, // Segment point closest to point.
		toJsonDestination: toJsonDestination,     // Write JSON to a destination.
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
