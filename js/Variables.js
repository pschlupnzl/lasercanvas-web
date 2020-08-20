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
		for (var name of this.names) {
			fn.call(thisArg, name, this.byName[name]);
		}
	};

	/** Set a variable value and fire the change event. */
	Variables.prototype.set = function (name, value) {
		this.byName[name] = value;
		this.fireEvent("change");
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
