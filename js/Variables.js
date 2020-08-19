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
	};
	
	/** Iterate the callback over all variables in the collection. */
	Variables.prototype.forEach = function (fn, thisArg) {
		for (var name of this.names) {
			fn.call(thisArg, name, this.byName[name]);
		}
	};

	LaserCanvas.Variables = Variables;
}(window.LaserCanvas));
