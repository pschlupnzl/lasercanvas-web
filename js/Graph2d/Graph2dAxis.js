(function (LaserCanvas) {
	var Graph2dAxis = function (dir) {
		this.dir = dir;
		this.el = this.init();
	};

	Graph2dAxis.Direction = {
		HORIZONTAL: "horizontal",
		VERTICAL: "vertical"
	};

	/** Initializes the component. */
	Graph2dAxis.prototype.init = function () {
		var el = document.createElement("div");
		el.className = "Graph2dAxis";
		el.setAttribute("data-direction", this.dir);

		el.innerHTML = this.dir;
		return el;
	};

	/** Gets the component's DOM element. */
	Graph2dAxis.prototype.element = function () {
		return this.el;
	};

	/**
	 * Update the axis ticks.
	 */
	Graph2dAxis.prototype.render = function () {
		var dir = this.dir,
			tick = function (text, pos) {
				var el = document.createElement("div");
				el.className = "tick";
				el.innerHTML = [
					`<label>${text}</label>`
				].join("");
				if (dir === Graph2dAxis.Direction.HORIZONTAL) {
					el.style.left = `${100 * pos}%`;
				} else {
					el.style.bottom = `${100 * pos}%`;
				}
				return el;
			};
		this.el.innerHTML = "";
		this.el.appendChild(tick("min", 0));
		this.el.appendChild(tick("max", 1));
	};

	LaserCanvas.Graph2dAxis = Graph2dAxis;
}(window.LaserCanvas));