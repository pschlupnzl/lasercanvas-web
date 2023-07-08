(function (LaserCanvas) {
	/**
	 * Creates a 2d graph of data.
	 */
	var Graph2d = function () {
		this.axes = this.initAxes();
		/** Element where to render the component. */
		this.el = this.init();
	};

	Graph2d.template = [
		'<div class="plot">',
		'<canvas></canvas>',
		'<div class="marker"></div>',
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

	// ----------
	//  Scaling.
	// ----------

	/**
	 * Calculate the ticks and scaling.
	 * @param {Range} extents Extents of data to fit.
	 */
	Graph2d.prototype.calcTicks = function (extents) {
		var size = this.canvasSize(),
			fontSize = LaserCanvas.Utilities.getFontSize(this.el);
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

	/**
	 * Update the graph rendering.
	 * @param {Lines[]} lines Lines to plot.
	 */
	Graph2d.prototype.renderLines = function (lines) {
		this.axes.x.render();
		this.axes.y.render();
		this.clearPlot();
		this.renderPlotLines(lines);
	};

	/**
	 * Clear the plot area.
	 */
	Graph2d.prototype.clearPlot = function () {
		var canvas = this.el.querySelector("canvas");
		canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
	};

	/**
	 * Update the plotting area and lines.
	 * @param {Lines[]} lines Lines to plot.
	 */
	Graph2d.prototype.renderPlotLines = function (lines) {
		var canvas = this.el.querySelector("canvas"),
			ctx = canvas.getContext("2d"),
			axisX = this.axes.x,
			axisY = this.axes.y;

		lines.forEach(function (line, lineIndex) {
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

	/**
	 * Update the position of the markers.
	 * @param {number} value Value to set the marker to.
	 */
	Graph2d.prototype.updateMarker = function (value) {
		var ax = this.axes.x;
		this.el.querySelector(".marker").style.left =
			ax.transform(Math.max(ax.min(), Math.min(ax.max(), value))) + "px";
	};

	LaserCanvas.Graph2d = Graph2d;
}(window.LaserCanvas));
