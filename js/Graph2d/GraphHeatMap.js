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
   * @param {object} extents Extents to map for the axes.
   */
  GraphHeatMap.prototype.calcTicks = function (extents) {
    var size = this.canvasSize(),
      fontSize = this.getFontSize();
    console.log(`»» calcTicks size=${JSON.stringify(size)} fontSize=${fontSize} extents=${JSON.stringify(extents)}`)
    this.axes.x.calcTicks(extents.x, size.width, {
      minTickSpacing: 2.5 * fontSize,
      tightLimits: true,
    }).render();
    this.axes.y.calcTicks(extents.y, size.height, {
      minTickSpacing: 1.5 * fontSize,
      tightLimits: true
    }).render();
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
      width = container.offsetWidth,
      height = container.offsetHeight;
    canvas.width = parseInt(width);
    canvas.height = parseInt(height);
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
   * Update the graph rendering.
   */
  GraphHeatMap.prototype.render = function () {
    var canvas = this.el.querySelector("canvas"),
      ctx = canvas.getContext("2d");
    this.axes.x.render();
    this.axes.y.render();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(100, 100);
    ctx.stroke();
  };

  this.LaserCanvas.GraphHeatMap = GraphHeatMap;
})(window.LaserCanvas);
