(function (LaserCanvas) {
	/**
	 * Creates a 2d graph of data.
	 * @param {HTMLElement} el Element where to render the graph.
	 */
	var Graph2d = function (el) {
		/** Array of lines to plot. */
		this.lines = [];
		this.axes = this.initAxes();
		/** Element where to render the component. */
		this.el = this.init(el);

		// /** Axes limits and tick spacings. */
		// this.axisParams = {
		// 	x: { min: 0, max: 1, major: 0.5, scale: 1 },
		// 	y: { min: 0, max: 1, major: 0.5, scale: 1 }
		// };
	};

	/**
	 * Initialize the plot and create additional elements.
	 */
	Graph2d.prototype.init = function (el) {
		var plot;
		el.className = "LaserCanvasGraph2d";
		el.innerHTML = [
			'<div class="plot">',
			'<canvas/>',
			'</div>'
		].join("");
		plot = el.querySelector(".plot");
		plot.appendChild(this.axes.x.element());
		plot.appendChild(this.axes.y.element());
		return el;
	};

	Graph2d.prototype.initAxes = function () {
		var Graph2dAxis = LaserCanvas.Graph2dAxis;
		return {
			x: new Graph2dAxis(Graph2dAxis.Direction.HORIZONTAL),
			y: new Graph2dAxis(Graph2dAxis.Direction.VERTICAL)
		};
	};

	/**
	 * Plot the given data and update the rendering.
	 */
	Graph2d.prototype.plot = function (x, y) {
		this.lines = [{
			x: x,
			y: y,
		}];
		this.render();
	};

	// ----------
	//  Scaling.
	// ----------

	/**
	 * Returns the extent of the data.
	 */
	Graph2d.prototype.getRange = function () {
		var line,
			range = {
				x: { min: 0, max: 1 },
				y: { min: 0, max: 1 },
			},
			/** Get single range over coordinates. */
			getRange = function (coords, prev) {
				var r = {
					min: Math.min.apply(Math, coords),
					max: Math.max.apply(Math, coords)
				};
				if (prev) {
					r.min = Math.min(r.min, prev.min);
					r.max = Math.max(r.max, prev.max);
				}
				return r;
			}

		for (var k = 0; k < this.lines.length; k += 1) {
			line = this.lines[k];
			range.x = getRange(line.x, k === 0 ? null : range.x);
			range.y = getRange(line.y, k === 0 ? null : range.y);
		}

		return range;
	};

	/**
	 * Update the axis plotting parameters.
	 */
	Graph2d.prototype.updateAxisParams = function (width, height) {
		var range = this.getRange();
		this.axisParams = {
			x: this.calcAxisTicks(range.x, width),
			y: this.calcAxisTicks(range.y, height)
		};
	};

	/**
	 * Calculate tick spacings for a single axis to optimally satisfy the given dimensions.
	 * @param {object<number>} range Minimum and maximum values of data to fit.
	 * @param {number} extent Width or height in pixels to calculate scale factor.
	 */
	Graph2d.prototype.calcAxisTicks = function (range, extent) {
		var min = range.min,
			max = range.max,
			scale;

		if (min === max) {
			max = min + 1;
		}
		scale = extent / (max - min);
		return {
			min: min,
			max: max,
			scale: scale
		};
	};

	// ------------
	//  Rendering.
	// ------------

	/** Returns the current font size, in px, or a default value. */
	Graph2d.prototype.getFontSize = function () {
		var el = this.el,
			style = window.getComputedStyle(el),
			match = style.fontSize.match(/^(\d+)px$/);
		if (match) {
			return +match[1];
		}
		// Default.
		return 16;
	};

	/**
	 * Resize the component.
	 */
	Graph2d.prototype.resize = function () {
		var el = this.el,
			plot = el.querySelector(".plot"),
			canvas = plot.querySelector("canvas"),
			fontSize = this.getFontSize(),
			left = 5 * fontSize,
			right = 2 * fontSize,
			bottom = 3 * fontSize,
			top = 1 * fontSize,
			width = el.offsetWidth - left - right,
			height = el.offsetHeight - top - bottom,
			styles = {
				left: `${left}px`,
				bottom: `${bottom}px`,
				width: `${width}px`,
				height: `${height}px`,
			};
		for (var key in styles) {
			if (styles.hasOwnProperty(key)) {
				plot.style[key] = styles[key];
			}
		}
		canvas.width = width;
		canvas.height = height;
	};

	/**
	 * Update the graph rendering.
	 */
	Graph2d.prototype.render = function () {
		this.resize();
		this.axes.x.render();
		this.axes.y.render();
// 		var el = this.el,
// 			fontSize = this.getFontSize(),
// 			left = 5 * fontSize,
// 			right = 2 * fontSize,
// 			bottom = 3 * fontSize,
// 			top = 1 * fontSize,
// 			width = el.offsetWidth - left - right,
// 			height = el.offsetHeight - top - bottom

// 		this.updateAxisParams(width, height);
// console.log(this.axisParams)

// 		// Clear the element.
// 		el.innerHTML = "";
// 		this.el.innerText = JSON.stringify({x: this.x, y: this.y, w: width, h: height});
// 		// Add the main canvas.
// 		this.renderAxes();
// 		this.renderPlotArea(left, bottom, width, height);
// 		// Plot the lines.
// 		this.renderPlotLines();
	};

	/**
	 * Render the main graph canvas plotting area.
	 * The dimensions are in px.
	 */
	Graph2d.prototype.renderPlotArea = function (left, bottom, width, height) {
		var el = this.el,
			canvas = document.createElement("canvas"),
			styles = {
				position: `absolute`,
				left: `${left}px`,
				bottom: `${bottom}px`,
				width: `${width}px`,
				height: `${height}px`,
				border: `1px solid`
			};
		for (var key in styles) {
			if (styles.hasOwnProperty(key)) {
				canvas.style[key] = styles[key];
			}
		}
		canvas.width = width;
		canvas.height = height;
		el.appendChild(canvas);
	};

	/** Create the elements for the axes. */
	Graph2d.prototype.renderAxes = function () {
		var
			/** Create single text label. */
			createLabel = function (text, value, axisParams, direction) {

			},

			/** Render elements for one axis. */
			renderAxis = function (axisParams, direction) {
				createLabel(axisParams.min, axisParams.min, axisParams, direction);
				createLabel(axisParams.max, axisParams.max, axisParams, direction);
console.log(axisParams);

			};
		renderAxis(this.axisParams.x, "horizontal");
		renderAxis(this.axisParams.y, "vertical");
	};

	/**
	 * Plot the lines on the prepared canvas.
	 */
	Graph2d.prototype.renderPlotLines = function () {
		var vx, vy,
			el = this.el,
			params = this.axisParams,
			px = params.x,
			py = params.y,
			ctx = el.querySelector("canvas").getContext("2d"),
			width = ctx.canvas.width,
			height = ctx.canvas.height;
		ctx.clearRect(0, 0, width, height);
		for (var line of this.lines) {
			for (var k = 0; k < line.x.length; k += 1) {
				vx = (line.x[k] - px.min) * px.scale;
				vy = (line.y[k] - py.min) * py.scale;
				vy = height - vy;
				if (k === 0) {
					ctx.moveTo(vx, vy);
				} else {
					ctx.lineTo(vx, vy);
				}
			}
			ctx.stroke();
		}
	};

	LaserCanvas.Graph2d = Graph2d;
}(window.LaserCanvas));

// setTimeout(function () {
// 	var el = document.createElement("div");
// 	document.body.appendChild(el);
// 	el.style.position = "absolute";
// 	el.style.top = "0";
// 	el.style.left = "0";
// 	el.style.width = "300px";
// 	el.style.height = "200px";
// 	// el.style.background = "white";
// 	// el.style.border = "1px solid";
// 	var g = new window.LaserCanvas.Graph2d(el);
// 	g.plot([0, 0.5, 2], [-1, 1, 0]);
// }, 100);
