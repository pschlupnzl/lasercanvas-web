(function (LaserCanvas) {
	/**
	 * Graphical element for a horizontal or vertical axis.
	 * @param {Graph2dAxis.Direction} dir Direction of axis.
	 */
	var Graph2dAxis = function (dir) {
		this.dir = dir;
		this.el = this.init();

		// Data limits.
		this._min = 0;
		this._max = 1;

		// Ticks.
		this._tickMin = 0;
		this._tickSpacing = 1;

		// Scaling.
		this._scale = 1;
		this._length = 1; // Length in display units (pixels).
		this.render();
	};

	/** Axis disposition, used for aligning display elements. */
	Graph2dAxis.Direction = {
		HORIZONTAL: "horizontal",
		VERTICAL: "vertical"
	};

	Graph2dAxis.prototype.min = function () {
		return this._min;
	};
	
	Graph2dAxis.prototype.max = function () {
		return this._max;
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

	/** Standard tick spacings. */
	Graph2dAxis.standardTicks = [0.1, 0.2, 0.5, 1, 5, 10];
	/** Default maximum number of ticks, if not using metrics. */
	Graph2dAxis.defaultMaxTicks = 5;

	/**
	 * Calculate limits, scale, and ticks (as appropriate) for the given metrics.
	 * @param {object} extent The { min, max } extent to include on this axis.
	 * @param {number} length Length (width or height) of axis in screen units (pixels).
	 * @param {object} options Optional parameters:
	 *     minTickSpacing {number}  Minimum space, in screen units, allowed between ticks.
	 *     tightLimits    {boolean} Value indicating that axes limits should not be extended.
	 */
	Graph2dAxis.prototype.calcTicks = function (extent, length, options) {
		var pow, scl, mn, mx,
			maxTicks = Math.max(3, options.minTickSpacing
				? Math.floor(length / options.minTickSpacing)
				: Graph2dAxis.defaultMaxTicks),
			min = extent.min,
			max = extent.max;

		// Roundoff error backstop.
		if (max - min < 1e-7) {
			max = min + 1;
		}

		// Power-of-ten scale factor.
		pow = Math.pow(10, Math.floor(Math.log10(max - min)));

		// Find the largest spacing to limit the number of ticks.
		max /= pow;
		min /= pow;
		for (scl of Graph2dAxis.standardTicks) {
			mx = Math.ceil(max / scl);
			mn = Math.floor(min / scl);
			if ((mx - mn) / scl < maxTicks) {
				break;
			}
		}

		// Expand limits to nice values.
		if (!options.tightLimits) {
			this._max = mx * scl * pow;
			this._min = mn * scl * pow;
		} else {
			this._max = extent.max;
			this._min = extent.min;
		}
		this._tickMin = mn * scl * pow;
		this._tickSpacing = scl * pow;

		// Metrics and scale.
		this._length = length;
		this._scale = length / (this._max - this._min);
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
		var el = this.el.querySelector(".ticks"),
			styleRule = this.dir === Graph2dAxis.Direction.HORIZONTAL ? "left" : "bottom",
			min = this._min,
			max = this._max,
			createTick = function (value, text) {
				var label = document.createElement("label");
				label.innerHTML = text || LaserCanvas.Utilities.numberFormat(value, true);
				label.style[styleRule] = `${100 * (value - min) / (max - min)}%`;
				el.appendChild(label);
				return el;
			};
		el.innerHTML = "";
		for (var tickValue = this._tickMin; tickValue <= this._max; tickValue += this._tickSpacing) {
			if (tickValue >= this._min) {
				createTick(tickValue);
			}
		}
	};

	LaserCanvas.Graph2dAxis = Graph2dAxis;
}(window.LaserCanvas));