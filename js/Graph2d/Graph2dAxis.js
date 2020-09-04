(function (LaserCanvas) {
	/**
	 * Graphical element for a horizontal or vertical axis.
	 * @param {Graph2dAxis.Direction} dir Direction of axis.
	 */
	var Graph2dAxis = function (dir) {
		this.dir = dir;
		this.el = this.init();
		this._min = 0;
		this._max = 1;
		this._scale = 1;
		this._length = 1; // Length in display units (pixels).
		this.render();
	};

	/** Axis disposition, used for aligning display elements. */
	Graph2dAxis.Direction = {
		HORIZONTAL: "horizontal",
		VERTICAL: "vertical"
	};

	/** Transform a data point to a screen point. */
	Graph2dAxis.prototype.transform = function (val, flip) {
		var p = this._scale * (val - this._min);
		return flip ? this._length - p : p;
	};

	/** Initializes the component. */
	Graph2dAxis.prototype.init = function () {
		var el = document.createElement("div");
		el.className = "Graph2dAxis";
		el.setAttribute("data-direction", this.dir);
		el.innerHTML = [
			'<div class="axisLine"></div>',
			'<div class="ticks">',
			'</div>'
		].join("");
		return el;
	};

	/**
	 * Calculate limits, scale, and ticks (as appropriate) for the given metrics.
	 * @param {object} extent The { min, max } extent to include on this axis.
	 * @param {number} length Length (width or height) of axis in screen units (pixels).
	 * @param {number} minTickSpacing Minimum space, in screen units, allowed between ticks.
	 */
	Graph2dAxis.prototype.calcTicks = function (extent, length, minTickSpacing) {
		// TODO: Calculate ticks in addition to scale.
		this._length = length;
		this._min = extent.min;
		this._max = extent.max;
		this._scale = length / (extent.max - extent.min);
	};

	/** Attach myself to the DOM. */
	Graph2dAxis.prototype.appendTo = function (container) {
		container.appendChild(this.el);
		return this;
	};

	/**
	 * Update the axis ticks.
	 */
	Graph2dAxis.prototype.render = function () {
		var dir = this.dir,
			el = this.el.querySelector(".ticks"),
			min = this._min,
			max = this._max,
			tick = function (value, text) {
				var el = document.createElement("label"),
					pos = 100 * (value - min) / (max - min);
				el.innerHTML = text;
				if (dir === Graph2dAxis.Direction.HORIZONTAL) {
					el.style.left = `${pos}%`;
				} else {
					el.style.bottom = `${pos}%`;
				}
				return el;
			};
		el.innerHTML = "";
		el.appendChild(tick(min, LaserCanvas.Utilities.numberFormat(min, true)));
		el.appendChild(tick(max, LaserCanvas.Utilities.numberFormat(max, true)));
	};

	LaserCanvas.Graph2dAxis = Graph2dAxis;
}(window.LaserCanvas));