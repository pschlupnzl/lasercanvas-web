/**
 * LaserCanvas - Loader for the Web Worker to calculate cavity params.
 */
(function (LaserCanvas) {
  /**
   * Class to handle stability worker or fallback.
   */
  var StabilityWorker = function () {
    /** Value indicating that the worker has been initialized. */
    this._available = false;
    /** Web worker loaded from script. */
    this._worker = new Worker("js/Worker/StabilityWorker.js");
    this._worker.onmessage = this.onmessage.bind(this);
  };

  /**
   * Initialize the worker once all files have been loaded.
   * @returns {StabilityWorker}
   */
  StabilityWorker.prototype.init = function () {
    var variablesGetter = function () {};
    this._worker.postMessage({
      type: "init",
      params: [LaserCanvas.Element.Mirror].map(function (Element) {
        var element = new Element(variablesGetter);
        return {
          type: element.type,
          getStr: element.get.toString(),
          elementAbcdStr: element.elementAbcd.toString(),
        };
      }),
    });
    this._worker.postMessage({ type: "test" });
    return this;
  };

  /**
   * Update the system in the web worker.
   * @param {system} system Laser cavity has been changed.
   */
  StabilityWorker.prototype.setSystem = function (system) {
    this._worker.postMessage({ type: "system", params: system.toJson() });
  };

  /**
   * Handle a message received back from the worker.
   * @param {MessageEvent} event Event from worker.
   */
  StabilityWorker.prototype.onmessage = function (event) {
    console.log("«« received", event.data);
  };

  //     /**
  //      * Listen for a response from the web worker.
  //      * @this Worker The currently executing worker.
  //      * @param {Event} event Event posted by worker.
  //      */
  //     onmessage = function (event) {
  //       console.log(`»» received message event`, event);
  //     };

  //   // Fallback worker while actual worker is loading.
  //   LaserCanvas.stabilityWorker = new NopWorker();

  //   try {
  //     var stabilityWorker = new Worker("js/Worker/StabilityWorker.js", {});
  //     stabilityWorker.available = true;
  //     stabilityWorker.onmessage = onmessage;
  //     stabilityWorker.postMessage({ type: "" });
  //     LaserCanvas.stabilityWorker = stabilityWorker;
  //   } catch (err) {
  //     console.warn("Stability worker not available.");
  //   }

  LaserCanvas.StabilityWorker = StabilityWorker;
})(window.LaserCanvas);
