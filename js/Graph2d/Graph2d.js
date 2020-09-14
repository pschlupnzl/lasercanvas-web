(function (LaserCanvas) {
	/**
	 * Creates a 2d graph of data.
	 */
	var Graph2d = function () {
		/** Array of lines to plot. */
		this.lines = [];
		this.axes = this.initAxes();
		/** Element where to render the component. */
		this.el = this.init();
		this.events = {
			variableChange: []
		};
	};

	Graph2d.template = [
		'<div class="plot">',
		'<canvas/>',
		'</div>'
	].join("");

	/**
	 * Initialize the plot and create additional elements.
	 */
	Graph2d.prototype.init = function () {
		var plot,
			el = document.createElement("div")
		el.className = "LaserCanvasGraph2d";
		el.innerHTML = Graph2d.template;
		plot = el.querySelector(".plot");
		this.axes.x.appendTo(plot);
		this.axes.y.appendTo(plot);
		return el;
	};

	/** Attach the graph to the parent element. */
	Graph2d.prototype.appendTo = function (container) {
		container.appendChild(this.el);
		return this;
	};

	/** Destroy myself and remove DOM element. */
	Graph2d.prototype.destroy = function () {
		this.el.parentElement && this.el.parentElement.removeChild(this.el);
		return this;
	};

	Graph2d.prototype.initAxes = function () {
		var Graph2dAxis = LaserCanvas.Graph2dAxis;
		return {
			x: new Graph2dAxis(Graph2dAxis.Direction.HORIZONTAL),
			y: new Graph2dAxis(Graph2dAxis.Direction.VERTICAL)
		};
	};

	// ---------
	//  Events.
	// ---------

	Graph2d.prototype.addEventListener = function (eventName, handler) {
		this.events[eventName].push(handler);
	};

	Graph2d.prototype.fireEvent = function (eventName) {
		this.events[eventName].forEach(function (handler) {
			handler();
		});
	};

	// -------------
	//  Data lines.
	// -------------

	/** Reset the plotting data lines. */
	Graph2d.prototype.clearDataPoints = function () {
		this.lines = [];
	};

	/**
	 * Add a data point to each of the plotting lines. The data point is
	 * formatted as an array of {x, y} objects, which are added to the
	 * corresponding plotting lines.
	 * @param {Array<object>} dataPoints Points to add to each line.
	 */
	Graph2d.prototype.addDataPoints = function (dataPoints) {
		dataPoints.forEach(function (dataPoint, index) {
			if (!this.lines[index]) {
				this.lines[index] = { x: [], y: [] };
			}
			this.lines[index].x.push(dataPoint.x);
			this.lines[index].y.push(dataPoint.y);
		}.bind(this));
	};

	/** Create a new line corresponding to a vertical marker line. */
	Graph2d.prototype.createVerticalMarker = function (x) {
		this.lines.push({
			x: [x, x],
			y: [this.axes.y.min(), this.axes.y.max()]
		});
	};

	// ----------
	//  Scaling.
	// ----------

	/**
	 * Returns the extents (ranges) of data across all plotting lines.
	 */
	Graph2d.prototype.getDataExtents = function () {
		var firstPoint = true,
			extents = {
				x: { min: 0, max: 1, firstPoint: true },
				y: { min: 0, max: 1, firstPoint: true }
			};
		this.lines.forEach(function (line) {
			var p;
			for (var ax of ["x", "y"]) {
				for (var k = 0; k < line[ax].length; k += 1) {
					p = line[ax][k];
					if (isNaN(p) || !isFinite(p)) {
						// NOP - skip NaN and Infinity.
					} else if (extents[ax].firstPoint) {
						extents[ax].min = extents[ax].max = p;
						delete extents[ax].firstPoint;
					} else {
						extents[ax].min = Math.min(extents[ax].min, p);
						extents[ax].max = Math.max(extents[ax].max, p);
					}
				}
			}
		});
		return extents;
	};

	/**
	 * Calculate the ticks and scaling.
	 */
	Graph2d.prototype.calcTicks = function () {
		var size = this.canvasSize(),
			extents = this.getDataExtents(),
			fontSize = this.getFontSize();
		this.axes.x.calcTicks(extents.x, size.width, { minTickSpacing: 2.5 * fontSize, tightLimits: true });
		this.axes.y.calcTicks(extents.y, size.height, { minTickSpacing: 1.5 * fontSize });
	};

	// ------------
	//  Rendering.
	// ------------

	/**
	 * Update the size of canvas, returning the dimensions.
	 */
	Graph2d.prototype.canvasSize = function () {
		var canvas = this.el.querySelector("canvas"),
			container = canvas.parentElement,
			width = container.offsetWidth,
			height = container.offsetHeight;
		canvas.width = parseInt(width);
		canvas.height = parseInt(height);
		return {
			width: width,
			height: height
		};
	};

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
	 * Update the graph rendering.
	 */
	Graph2d.prototype.render = function () {
		this.axes.x.render();
		this.axes.y.render();
		this.renderPlotLines();
	};

	/** Update the plotting area and lines. */
	Graph2d.prototype.renderPlotLines = function () {
		var canvas = this.el.querySelector("canvas"),
			ctx = canvas.getContext("2d"),
			axisX = this.axes.x,
			axisY = this.axes.y;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		this.lines.forEach(function (line, lineIndex) {
			var k, ptx, pty, x, y,
				moveTo = true;
			ctx.save();
			ctx.beginPath();
			for (k = 0; k < line.x.length && k < line.y.length; k += 1) {
				ptx = line.x[k];
				pty = line.y[k];
				if (isNaN(ptx) || isNaN(pty)) {
					moveTo = true;
				} else {
					x = axisX.transform(ptx);
					y = axisY.transform(pty, true);
					if (moveTo) {
						ctx.moveTo(x, y);
						moveTo = false;
					} else {
						ctx.lineTo(x, y);
					}
				}
			}
			ctx.strokeStyle = LaserCanvas.theme.current.mode[lineIndex] || "#333";
			ctx.stroke();
			ctx.restore();
		});
	};
	LaserCanvas.Graph2d = Graph2d;
}(window.LaserCanvas));
