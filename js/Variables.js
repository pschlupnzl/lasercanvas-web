/**
 * Controller for variables and evaluating expressions.
 */
(function (LaserCanvas) {
	var Variables = function () {
		this.names = ["x"];
		this.byName = {
			x: 0.5
		};
	};
	
	LaserCanvas.Variables = Variables;
}(window.LaserCanvas));
