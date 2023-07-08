(function (LaserCanvas) {
  /**
   * Class to handle mapping of a value to a false color scale.
   */
  class Colormap {
    static COLOR_STOPS = {
      rainbow: [
        [0, 0, 128],
        [0, 0, 255],
        [0, 255, 255],
        [0, 255, 0],
        [255, 255, 0],
        [255, 0, 0],
        [128, 0, 0],
      ],
      ire: [
        [0, 0, 128], // blue
        [192, 0, 192], // purple
        [96, 96, 96], // dark grey
        [0, 255, 0], // green
        [255, 255, 255], // white // [128, 128, 128], // middle grey
        [255, 0, 255], // purple
        [192, 192, 192], // light grey
        [220, 220, 0], // mid-yellow
        [128, 0, 0], // red
      ],
    };

    /** RGB color strings. */
    _rgb = [];

    /**
     * Initialize a new instance of the {@link Colormap} class by preparing
     * an initial colormap.
     * @param {number[] | string} stops Color stops for the map, or map name.
     * @param {number=} steps Optional number of steps to generate, default 128.
     */
    constructor(stops, steps) {
      this.prepareMap(stops, steps);
    }

    /** Returns the length of the current map. */
    get length() {
      return this._rgb.length;
    }

    /**
     * Reverse the color map.
     * @returns {Colormap}
     */
    reverse() {
      this._rgb.reverse();
      return this;
    }

    /**
     * Prepare a new colormap by calculating the steps.
     * @param {number[] | string} stops Color stops for the map, or map name.
     * @param {number=} steps Optional number of steps to generate, default 128.
     * @returns {Colormap}
     */
    prepareMap(stops, steps) {
      steps = steps || 128;
      if (typeof stops === "string") {
        stops = Colormap.COLOR_STOPS[stops];
      }
      this._rgb = new Array(steps)
        .join(".")
        .split(".")
        .map(function (_, x) {
          var n = stops.length - 1, // Number of stops.
            k = Math.floor((x * n) / steps), // Start color stop index.
            k1 = Math.min(n, k + 1), // End color stop index.
            r = ((x * n) / steps) % 1, // Remainder, i.e. distance between stops.
            rgb = stops[k].map(function (_, c) {
              return (1 - r) * stops[k][c] + r * stops[k1][c];
            });

          return (
            "rgb(" +
            rgb
              .map(function (v) {
                return Math.floor(v);
              })
              .join(", ") +
            ")"
          );
        });
      return this;
    }

    /**
     * Returns the nearest color map value in the range.
     * @param {number} value Value for which to return the color.
     * @param {[number, number]} range Low and high values for the range.
     * @returns {string}
     */
    rgb(value, range) {
      var n = this._rgb.length,
        k = Math.round((n * (value - range[0])) / (range[1] - range[0]));
      return this._rgb[k < 0 ? 0 : k > n - 1 ? n - 1 : k];
    }
  }
  LaserCanvas.Colormap = Colormap;
  LaserCanvas.Colormap.MAP_NAMES = ["ire", "rainbow"];
})(window.LaserCanvas);
