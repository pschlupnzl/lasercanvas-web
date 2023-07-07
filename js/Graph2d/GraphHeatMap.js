(function (LaserCanvas) {
  /**
   * Class to display a heatmap of values.
   */
  var GraphHeatMap = function () {
    this.axes = this.initAxes();
    this.el = this.init();
    this.events = {
      variableChange: [],
    };
  };

  GraphHeatMap.template = [
    // Template.
    '<div class="plot">',
    "<canvas />",
    "</div>",
  ].join("");

  /**
   * Initialize the plot and create additional elements.
   */
  GraphHeatMap.prototype.init = function () {
    var plot,
      el = document.createElement("div");
    // TODO: We may need separate css classes.
    el.className = "LaserCanvasGraph2d";
    el.innerHTML = GraphHeatMap.template;
    plot = el.querySelector(".plot");
    this.axes.x.appendTo(plot);
    this.axes.y.appendTo(plot);
    return el;
  };

  /** Attach the graph to the parent element. */
  GraphHeatMap.prototype.appendTo = function (container) {
    container.appendChild(this.el);
    return this;
  };

  /** Destroy myself and remove DOM element. */
  GraphHeatMap.prototype.destroy = function () {
    this.el.parentElement && this.el.parentElement.removeChild(this.el);
    return this;
  };

  GraphHeatMap.prototype.initAxes = function () {
    var Graph2dAxis = LaserCanvas.Graph2dAxis;
    return {
      x: new Graph2dAxis(Graph2dAxis.Direction.HORIZONTAL),
      y: new Graph2dAxis(Graph2dAxis.Direction.VERTICAL),
    };
  };

  // ---------
  //  Events.
  // ---------

  GraphHeatMap.prototype.addEventListener = function (eventName, handler) {
    this.events[eventName].push(handler);
  };

  GraphHeatMap.prototype.fireEvent = function (eventName) {
    this.events[eventName].forEach(function (handler) {
      handler();
    });
  };

  // ----------
  //  Scaling.
  // ----------

  /**
   * Calculate the ticks and scaling.
   * @param {Range[]} extents Extents to map for the axes.
   */
  GraphHeatMap.prototype.calcTicks = function (extents) {
    var size = this.canvasSize(),
      fontSize = this.getFontSize();
    this.axes.x
      .calcTicks(extents[0], size.width, {
        minTickSpacing: 2.5 * fontSize,
        tightLimits: true,
      })
      .render();
    this.axes.y
      .calcTicks(extents[1], size.height, {
        minTickSpacing: 1.5 * fontSize,
        tightLimits: true,
      })
      .render();
  };

  // ------------
  //  Rendering.
  // ------------

  /**
   * Update the size of canvas, returning the dimensions.
   */
  GraphHeatMap.prototype.canvasSize = function () {
    var canvas = this.el.querySelector("canvas"),
      container = canvas.parentElement,
      width = parseInt(container.offsetWidth, 10),
      height = parseInt(container.offsetHeight, 10);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = parseInt(width);
      canvas.height = parseInt(height);
    }
    return {
      width: width,
      height: height,
    };
  };

  /** Returns the current font size, in px, or a default value. */
  GraphHeatMap.prototype.getFontSize = function () {
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
   * Draw a single patch of value. The graph doesn't actually store the raw
   * data, this merely draws a patch. We may need to change this.
   * @param {string} fillStyle Color to draw.
   * @param {[number, number]} coords Coordinates in plane.
   * @param {number} subs Subdivision count for this level of mipmap.
   */
  GraphHeatMap.prototype.fillPatch = function (fillStyle, coords, subs) {
    var canvas = this.el.querySelector("canvas"),
      ctx = canvas.getContext("2d"),
      x = coords[0],
      y = coords[1],
      dx = (0.95 * canvas.width) / subs,
      dy = canvas.height / subs;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x * dx, (subs - y - 1) * dy, dx, dy);
  };

  this.LaserCanvas.GraphHeatMap = GraphHeatMap;
})(window.LaserCanvas);
