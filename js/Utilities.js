/**
* LaserCanvas - Utility methods.
*/
window.LaserCanvas.Utilities = {
	
	// ----------------------------------------------------
	//  Array.
	// ----------------------------------------------------
	
	/**
	* Iterate a function over a collection of objects. The iterator
	* function is called with index and element, and can optionally
	* return FALSE to break out of the iteration loop.
	* @param {Array<object>} objs Array or collection of objects.
	* @param {function} fn Iterated function, called with index and element.
	* @param {object=} extraArg Additional argument passed to iterated function.
	* @returns {Array<object>} The original array or collection of objects.
	*/
	foreach: function (objs, fn, extraArg) {
		"use strict";
		var k, n = objs.length;
		if (objs.hasOwnProperty('length')) {
			for (k = 0; k < n; k += 1) {
				if (fn.call(objs[k], k, objs[k], extraArg) === false) {
					break;
				}
			}
		} else {
			for (k in objs) {
				if (objs.hasOwnProperty(k)) {
					if (fn.call(objs[k], k, objs[k], extraArg) === false) {
						break;
					}
				}
			}
		}
		return objs;
	},

	/**
	 * Returns the first element of the collection for
	 * which the predicate evaluates to true. If no element
	 * is matched, returns NULL.
	 * @param {Array} obs Objects to iterate.
	 * @param {function} predicate Function called to determine whether the object should be selected.
	 */
	first: function (objs, predicate) {
		var index = LaserCanvas.Utilities.firstIndex(objs, predicate);
		if (index >= 0) {
			return objs[index];
		} else {
			return null;
		}
	},

	/**
	 * Returns the index of the first element of the collection
	 * for which the predicate evaluates to true. If no element
	 * is matched, returns -1.
	 * @param {Array} obs Objects to iterate.
	 * @param {function} predicate Function called to determine whether the object should be selected.
	 */
	firstIndex: function (objs, predicate) {
		var index, obj,
			n = objs.length;
		for (index = 0; index < n; index += 1) {
			obj = objs[index];
			if (predicate.call(obj, index, obj, objs)) {
				return index;
			}
		}
		return -1;
	},
	
	// ----------------------------------------------------
	//  DOM.
	// ----------------------------------------------------
	
	/**
	* Get the offset of the given element.
	* @param {HTMLElement} el Element whose offset to find.
	* @returns {object} Left and top offset.
	*/
	elementOffset: function (el) {
		"use strict";
		var offset = {
			left: 0,
			top: 0
		};
		do {
			offset.left += el.offsetLeft;
			offset.top += el.offsetTop;
			el = el.offsetParent;
		} while (el);
		return offset;
	},
	
	/**
	* Get the closest ancestor node that matches the given
	* selector. The supplied node will NOT be matched.
	* @param {HTMLElement} node Starting node.
	* @param {string} selectorString Selector to search for.
	* @returns {HTMLElement?} The ancestor node that matches the selector, or NULL if not found.
	*/
	closest: function (node, selectorString) {
		"use strict";
		if (node) {
			do {
				node = node.parentNode;
			} while (node && !node.matches(selectorString));
		}
		return node;
	},
	
	/**
	* Deep extend an object with new properties.
	* @param {object} obj Object to be extended.
	* @param {object} src Source object whose properties to copy.
	* @return {object} The extended original object.
	*/
	extend: function (obj, src) {
		"use strict";
		var
			// Recursively copy properties.
			// @param {object} o Object or property to be extended.
			// @param {object} s Source object or property whose properties to copy.
			// @return {object} The extended original object or property.
			recursive = function (o, s) {
				var k;
				for (k in s) {
					if (s.hasOwnProperty(k)) {
						if (Array.isArray(s)) {
							o[k] = [];
							recursive(o[k], s[k]);
						} else if (s[k] !== null
							&& s[k] !== undefined
							&& typeof s[k] !== 'string'
							&& typeof s[k] !== 'number' // Includes NaN and Infinity
							&& typeof s[k] !== 'boolean'
							&& !(s[k] instanceof Element)
							&& !(s[k].prototype)) {
								o[k] = {};
								recursive(o[k], s[k]);
						} else {
							o[k] = s[k];
						}
					}
				}
				return o;
			};
		window.LaserCanvas.Utilities.foreach(Array.prototype.slice.call(arguments, 1), function (index, s) {
			recursive(obj, s);
		});
		return obj;
	},	
	
	// ----------------------------------------------------
	//  Formatting.
	// ----------------------------------------------------
	
	/**
	* Replace string components similar to C# string.Format.
	* @param {string} fmt Format containing placeholders {0}, ....
	* @param {...} args Arguments to replace with.
	* @returns {string} String with replaced values.
	*/
	stringFormat: function (fmt, args) {
		"use strict";
		args = Array.prototype.slice.call(arguments, 1); // {Array<object>} Remaining arguments.
		return fmt.replace(/\{(\d+)\}/g, function (m, d) {
			return +d < args.length ? args[+d] : m;
		});
	},
	
	/**
	* Replace string components similar to C# string.Format,
	* retaining only fixed precision for numerical values.
	* @param {number} precision Precision (negative) or fixed (non-negative) places to keep.
	* @param {string} fmt Format containing placeholders {0}, ....
	* @param {...} args Arguments to replace with.
	* @returns {string} String with replaced values.
	*/
	stringFormatPrecision: function (precision, fmt, args) {
		"use strict";
		var k;
		args = Array.prototype.slice.call(arguments, 2); // {Array<object>} Remaining arguments.
		for (k = 0; k < args.length; k += 1) {
			if (typeof args[k] === 'number') {
				args[k] = precision >= 0 ? args[k].toFixed(precision)
					: args[k].toPrecision(-precision);
			}
		}
		return this.stringFormat.apply(this, [fmt].concat(args));
	},
	
	/**
	* Change the property name to a nice format, for example
	* radiusOfCurvature to Radius Of Curvature.
	* @param {string} propertyName Name of property to clean up.
	* @returns {string} Formatted name.
	*/
	prettify: function (propertyName) {
		"use strict";
		var localized = window.LaserCanvas.localize(propertyName);
		if (localized !== propertyName) {
			return localized;
		}
		return propertyName[0].toUpperCase() + propertyName.slice(1).replace(/([a-z])([A-Z0-9])/g, '$1 $2');
	},
	
	/**
	* Format a number to three significant figures or places, e.g. 1.123 or 0.0123, or 123
	* @param {number} val Value to format.
	* @param {boolean=} useFixed Value indicating whether to use method toFixed, rather than toPrecision.
	* @returns {string} Formatted number.
	*/
	numberFormat: function (val, useFixed) {
		"use strict";
		var str, sign, c, pt;
		
		if (isNaN(val)) {
			return '-';
		} else if (typeof val !== 'number') {
			return val;
		}
		sign = val < 0 ? '–' : '';
		val = Math.abs(val);
		
		if (val === Infinity) {
			str = '∞';
		} else if (val > 1e4) {
			str = val.toPrecision(2);
		} else if (val >= 100) {
			str = Math.round(val).toString();
		} else {
			str = useFixed  // First pass at string.
				? val.toFixed(3)       // Fixed decimal point (123.123).
				: val.toPrecision(3);  // Fixed precision (1.23).
			pt = str.indexOf('.');    // Location of decimal point in string.
			if (pt > -1) {
				while (str.length > pt
					&& ((c = str[str.length - 1]) === '0'
						|| c === '.')) {
					str = str.slice(0, str.length - 1);
				}
			}
		}
		return sign + str;
	},
	

	// ----------------------------------------------------
	//  Draggable.
	// ----------------------------------------------------
	
	/**
	* Make an object draggable. This assumes that its
	* left and top style attributes have already been set.
	* Options:
	*    handle {HTMLElement} Element to act as handle for move. Default: Original element.
	* @param {HTMLElement} el Element to make draggable.
	* @param {object=} optionsIn Additional options for draggable.
	* @param {object=} thisArg Optional argument passed as `this` to callback functions.
	*/
	draggable: function (el, optionsIn, thisArg) {
		"use strict";
		var ptDown = null,
			options = LaserCanvas.Utilities.extend({
				axis: undefined, // "x" | "y"
				handle: el, // {HTMLElement} Drag handle.
				onDrag: undefined, // {function(e, pt)} Can modify the pt.x and pt.y values.
				onEnd: undefined // {function} Called when the drag ends.
			}, optionsIn),
		
			// The mouse is released.
			up = function () {
				document.removeEventListener('mousemove', move, false);
				document.removeEventListener('mouseup', up, false);
				if (options.onEnd) {
					options.onEnd.call(thisArg);
				}
			},
			
			// The mouse moves.
			// @param {MouseEvent} e Triggering event.
			move = function (e) {
				var pt = {
					x: options.axis === "y" ? ptDown.x : e.clientX - ptDown.dx + ptDown.x,
					y: options.axis === "x" ? ptDown.y : e.clientY - ptDown.dy + ptDown.y
				};
				if (options.onDrag) {
					options.onDrag.call(thisArg, e, pt);
				}
				el.style.left = pt.x + 'px';
				el.style.top = pt.y + 'px';
				e.preventDefault && e.preventDefault();
			},
			
			// The mouse goes down.
			// @param {MouseEvent} e Triggering event.
			down = function (e) {
				var style, left, top;
				if (e.target === options.handle) {
					style = window.getComputedStyle(el);
					left = parseFloat(style.getPropertyValue('left'));
					top = parseFloat(style.getPropertyValue('top'));
					if (isNaN(left)) {
						left = 0;
					}
					if (isNaN(top)) {
						top = 0;
					}
					ptDown = {
						x: left,
						y: top,
						dx: e.clientX,
						dy: e.clientY
					};
					document.addEventListener('mousemove', move, false);
					document.addEventListener('mouseup', up, false);
					e.preventDefault && e.preventDefault();
				}
			},
			
			// A touch event ends.
			// @param {TouchesEvent} ev Triggering event.
			tend = function (ev) {
				if (ev.touches.length === 0) {
					up();
					document.removeEventListener('touchmove', tmove, false);
					document.removeEventListener('touchend', tend, false);
				}
			},
			
			// A touch event moves.
			// @param {TouchesEvent} ev Triggering event.
			tmove = function (ev) {
				move(ev.touches.item(0));
			},
			
			// A touch event starts.
			// @param {TouchesEvent} ev Triggering event.
			tstart = function (ev) {
				if (ev.touches.length === 1) {
					down(ev.touches.item(0));
					document.addEventListener('touchmove', tmove, false);
					document.addEventListener('touchend', tend, false);
					ev.preventDefault();
				}
			};

		if (!options.handle.hasAttribute('data-draggable')) {
			options.handle.addEventListener('mousedown', down, false);
			options.handle.addEventListener('touchstart', tstart, false);
			options.handle.setAttribute('data-draggable', options.axis || 'true');
		}
	},

	// ------------
	//  Utilities.
	// ------------

	/**
	 * Handler to invoke delayed tasks.
	 */
	Debounce: (function () {
		/**
		 * Initialize a new instance of the Debounce class.
		 * @param {number} defaultDelay Default delay, in ms. Defaults to 0.
		 */
		var Debounce = function (defaultDelay) {
			this.timeout = null;
			this.defaultDelay = defaultDelay || 0;
		};
		/**
		 * Prepares an action to be executed after a delay.
		 * @param {function} action Method to invoke when the delay elapses.
		 * @param {object=} thisArg Opttional argument passed as `this` to the action.
		 * @param {arguments=} args Additional arguments passed to the action.
		 */
		Debounce.prototype.delay = function (action, thisArg, args) {
			var extraArgs = Array.prototype.slice.call(arguments, 2);
			this.cancel();
			this.timeout = setTimeout((function (self) {
				return function () {
					action.apply(thisArg, extraArgs);
				};
			}(this)), this.defaultDelay);
		};
		/**
		 * Executes a synchronous action immediately, canceling any queued action.
		 * @param {function} action Method to invoke when the delay elapses.
		 * @param {object=} thisArg Opttional argument passed as `this` to the action.
		 * @param {arguments=} args Additional arguments passed to the action.
		 */
		Debounce.prototype.execute = function (action, thisArg, args) {
			var extraArgs = Array.prototype.slice.call(arguments, 2);
			this.cancel();
			action.apply(thisArg, extraArgs);
		};
		/**
		 * Cancels a delayed action.
		 */
		Debounce.prototype.cancel = function () {
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = null;
		};
		return Debounce;
	}())
};

/**
* Polyfills and other startup items.
*/
(function () {
	// Element matches selector, used with closest.
	// Polyfill, see https://developer.mozilla.org/en/docs/Web/API/Element/matches.
	// @this {HTMLElement} Element to test.
	// @param {string} selectorString String representing the selector to test.
	// @returns {boolean} Value indicating whether the element matches the selector.
	if (!Element.prototype.matches) {
		// Only runs once.
		Element.prototype.matches =
			Element.prototype.msMatchesSelector ||
			Element.prototype.webkitMatchesSelector;
	}
}());