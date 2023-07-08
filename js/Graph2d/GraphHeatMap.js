(function (LaserCanvas) {
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
    this.canvas = this.el.querySelector("canvas");
    this.activate();
    this.events = {
      variableChange: [],
      colormapChange: [],
    };
  };

  GraphHeatMap.template = [
    // Template.
    '<div class="plot plotHeatMap">',
    '<canvas style="cursor: crosshair"></canvas>',
    '<div class="marker"><div></div><div></div></div>',
    '<div class="tooltip"></div>',
    "</div>",
    '<div class="colormapContainer">',
    "<canvas></canvas>",
    '<div class="max"></div>',
    '<div class="min"></div>',
    "</div>",
  ].join("");

  /**
   * Initialize the plot and create additional elements.
   */
  GraphHeatMap.prototype.init = function () {
    var plot,
      el = document.createElement("div");
    // TODO: We may need separate css classes.
    el.className = "LaserCanvasGraph2d LaserCanvasGraphHeatMap";
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
      canvas = this.canvas,
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
        rx = posx / rect.width,
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

    this.el.querySelector(".colormapContainer").addEventListener(
      "click",
      function () {
        this.fireEvent("colormapChange");
      }.bind(this)
    );
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
      fontSize = LaserCanvas.Utilities.getFontSize(this.el);
    this._extents = extents;
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

  /**
   * Update the size of canvas, returning the dimensions.
   */
  GraphHeatMap.prototype.canvasSize = function () {
    var canvas = this.canvas,
      container = canvas.parentElement,
      width = parseInt(container.offsetWidth, 10),
      height = parseInt(container.offsetHeight, 10);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return {
      width: width,
      height: height,
    };
  };

  /**
   * Draw the colormap into the canvas space.
   * @param {colormap} colormap Colormap whose scale to draw.
   * @param {Range} range Range to mark.
   */
  GraphHeatMap.prototype.fillColormap = function (colormap, range) {
    var Utilities = LaserCanvas.Utilities,
      colormapContainer = this.el.querySelector(".colormapContainer"),
      canvas = colormapContainer.querySelector("canvas"),
      ctx = canvas.getContext("2d"),
      rect = canvas.getBoundingClientRect(),
      w = rect.width,
      h = rect.height;

    // Fill the color map.
    canvas.width = w;
    canvas.height = h;
    for (var k = 0; k < h; k += 1) {
      ctx.fillStyle = colormap.rgb(k, [0, h - 1]);
      ctx.fillRect(0, k, w, 1);
    }

    // Update the ranges.
    colormapContainer.querySelector(".min").innerText = Utilities.numberFormat(
      range[0]
    );
    colormapContainer.querySelector(".max").innerText = Utilities.numberFormat(
      range[1]
    );
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
    var canvas = this.canvas,
      ctx = canvas.getContext("2d"),
      dx = canvas.width / subs,
      dy = canvas.height / subs;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(col * dx, (subs - row - 1) * dy, dx + 1, dy + 1);
  };

  /**
   * Update the position of the markers.
   * @param {object} marker Values of the marker to show.
   */
  GraphHeatMap.prototype.updateMarker = function (marker) {
    var extents = this._extents,
      markers = this.el.querySelector(".marker").children,
      pos = function (val, ex) {
        return 100 * Math.max(0, Math.min(1,
          (val - ex.min) / (ex.max - ex.min || 1))
        ) + '%';
      };
    markers[0].style.left = pos(marker.x, extents[0]);
    markers[1].style.bottom = pos(marker.y, extents[1]);
  };

  this.LaserCanvas.GraphHeatMap = GraphHeatMap;
})(window.LaserCanvas);
