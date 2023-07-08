/**
 * Controller for variables and evaluating expressions.
 */
(function (LaserCanvas) {
	var Variables = function () {
		this.names = ["x", "y"];
		this.byName = {
			x: 0.5,
			y: 0.5
		};
		this.eventListeners = {
			change: []
		};
	};
	
	/** Iterate the callback over all variables in the collection. */
	Variables.prototype.forEach = function (fn, thisArg) {
		for (var variableName of this.names) {
			fn.call(thisArg, variableName, this.byName[variableName]);
		}
	};

	/** Set a variable value and fire the change event. */
	Variables.prototype.set = function (variableName, value, silent) {
		this.byName[variableName] = value;
		if (!silent) {
			this.fireEvent("change", [variableName]);
		}
	};

	/** Returns a new object containing the current variable values. */
	Variables.prototype.value = function () {
		return LaserCanvas.Utilities.extend({}, this.byName);
	},

	/**
	 * Trigger a variable to be scanned over its range. The variable is
	 * updated in a loop *without* firing the change event; instead, the
	 * iterator callback is invoked.
	 * @param {string} variableName Name of variable to iterate.
	 * @param {object} range Specifying { min, max } of range to iterate.
	 * @param {number} steps Number of steps to scan throughout the range.
	 * @param {function} iterator Callback function invoked with each iteration step.
	 */
	Variables.prototype.scan = function (variableName, range, steps, iterator) {
		var step = (range.max - range.min) / steps || 1,
			current = this.byName[variableName];
		for (var val = range.min; val <= range.max; val += step) {
			this.byName[variableName] = val;
			iterator(val);
		}
		this.byName[variableName] = current;
	};

	/** Add an event listener. */
	Variables.prototype.addEventListener = function (eventName, handler) {
		this.eventListeners[eventName].push(handler);
	};

	/** Fire all attached event listeners. */
	Variables.prototype.fireEvent = function (eventName, args) {
		for (handler of this.eventListeners[eventName]) {
			handler.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};
	
	LaserCanvas.Variables = Variables;
}(window.LaserCanvas));
