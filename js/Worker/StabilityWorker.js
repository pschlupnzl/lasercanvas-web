//#region StabilityWorker class definition.
/**
 * Class to handle the stability worker load.
 */
var StabilityWorker = function () {
  /** Current variable values. */
  this._variables = { x: 0, y: 0 };
  /** Element constructors, keyed by element type. */
  this._Elements = {};
};

/**
 * Getter for current variable values.
 */
StabilityWorker.prototype.variablesGetter = function () {
  return this._variables;
};

/**
 * Handle an `init` message by reconstituting element definitions.
 */
StabilityWorker.prototype.onInit = function (elements) {
  var Elements = {},
    variablesGetter = this.variablesGetter.bind(this);
  elements.forEach(function (element) {
    var El = function () {
      this.variablesGetter = variablesGetter;
    };
    El.prototype.get = Function("return " + element.getStr)();
    El.prototype.elementAbcd = Function("return " + element.elementAbcdStr)();
    Elements[element.type] = El;
  });
  this._Elements = Elements;
};

/**
 * Handle a change in the system configuration.
 * @param {LaserCanvas.System} system New system configuration.
 */
StabilityWorker.prototype.onSystem = function (system) {
  console.log(system);
  console.log(this._Elements);

  var element = system.elements[0];
  var el = new this._Elements[element.type]();
  el.prop = element.prop;
  console.log(el.elementAbcd(1, 0));
};
//#endregion

/** Worker to calculate stability over variable ranges. */
var stabilityWorker = new StabilityWorker();

/**
 * Web worker to iterate cavity over variable ranges.
 */
onmessage = function (event) {
  switch (event.data.type) {
    case "init":
      stabilityWorker.onInit(event.data.params);
      break;
    case "system":
      stabilityWorker.onSystem(event.data.params);
      break;
  }
};
