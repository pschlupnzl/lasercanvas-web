(function (LaserCanvas) {
  /** Fractional width of colorbar display. */
  var COLORMAP_WIDTH = 0.04;

  /**
   * Class to display a heatmap of values.
   */
  var GraphHeatMap = function () {
    this._extents = [
      { min: 0, max: 1 },
      { min: 0, max: 1 },
    ];
    this.getValueAt = function () {};
    this.axes = this.initAxes();
    this.el = this.init();
    this.activate();
    this.events = {
      variableChange: [],
    };
  };

  GraphHeatMap.template = [
    // Template.
    '<div class="plot">',
    '<canvas style="cursor: crosshair"></canvas>',
    '<div class="tooltip" style="position: absolute; pointer-events: none; background: white; padding: 8px; border-radius: 8px; text-align: center;"></div>',
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

  /**
   * Activate listeners on the elements.
   */
  GraphHeatMap.prototype.activate = function () {
    var self = this,
      canvas = this.el.querySelector("canvas"),
      tooltip = this.el.querySelector(".tooltip");

    canvas.addEventListener("mouseleave", function () {
      tooltip.style.visibility = "hidden";
    });

    canvas.addEventListener("mousemove", function (e) {
      var Utilities = LaserCanvas.Utilities,
        extents = self._extents,
        rect = canvas.getBoundingClientRect(),
        posx = e.pageX - rect.left,
        posy = e.pageY - rect.top,
        rx = posx / ((1 - COLORMAP_WIDTH) * rect.width),
        ry = 1 - posy / rect.height,
        x = (1 - rx) * extents[0].min + rx * extents[0].max,
        y = (1 - ry) * extents[1].min + ry * extents[1].max;
      if (rx >= 0 && rx <= 1) {
        tooltip.style.left = posx + "px";
        tooltip.style.top = posy + "px";
        tooltip.style.visibility = "visible";
        tooltip.innerHTML = [
          Utilities.numberFormat(self.getValueAt(rx, ry)),
          '<br /><span style="font-size: 0.8em">',
          "x=" + Utilities.numberFormat(x),
          ", ",
          "y=" + Utilities.numberFormat(y),
        ].join("");
      }
    });
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
    this._extents = extents;
    this.axes.x
      .calcTicks(extents[0], (1 - COLORMAP_WIDTH) * size.width, {
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
      canvas.width = width;
      canvas.height = height;
      this.el.querySelector(
        '.Graph2dAxis[data-direction="horizontal"]'
      ).style.width = 100 * (1 - COLORMAP_WIDTH) + "%";
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
   * Draw the colormap into the canvas space.
   * @param {colormap} colormap Colormap whose scale to draw.
   */
  GraphHeatMap.prototype.fillColormap = function (colormap) {
    var canvas = this.el.querySelector("canvas"),
      ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height,
      dx = COLORMAP_WIDTH * canvas.width;
    for (var k = 0; k < h; k += 1) {
      ctx.fillStyle = colormap.rgb(k, [0, h - 1]);
      ctx.fillRect(w - dx, k, dx, 1);
    }
  };

  /**
   * Draw a single patch of value. The graph doesn't actually store the raw
   * data, this merely draws a patch. We may need to change this.
   * @param {string} fillStyle Color to draw.
   * @param {number} row The row number in the plane to fill.
   * @param {number} col The column number in the plane to fill.
   * @param {number} subs Subdivision count for this level of mipmap.
   */
  GraphHeatMap.prototype.fillPatch = function (fillStyle, row, col, subs) {
    var canvas = this.el.querySelector("canvas"),
      ctx = canvas.getContext("2d"),
      dx = ((1 - COLORMAP_WIDTH) * canvas.width) / subs,
      dy = canvas.height / subs;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(col * dx, (subs - row - 1) * dy, dx + 1, dy + 1);
  };

  this.LaserCanvas.GraphHeatMap = GraphHeatMap;
})(window.LaserCanvas);
