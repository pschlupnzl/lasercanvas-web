(function (LaserCanvas) {
	var VariablePanel = function (mvariables) {
		this.mvariables = mvariables;
		this.numberSliders = {};
		this.el = this.init();
	};

	/** Number of scanning steps (not including starting point). */
	VariablePanel.scanSteps = 32;

	/** Initializes the component, filling its DOM element. */
	VariablePanel.prototype.init = function () {
		var el = document.createElement("div");
		el.className = "laserCanvasVariables";
		this.mvariables.forEach(function (name, value) {
			var slider = new LaserCanvas.NumberSlider(name);
			slider.setChangeEventListener(this.onSliderChange, this);
			slider.appendTo(el);
			this.numberSliders[name] = slider;
		}, this);
		return el;
	};

	/** Append the panel to the given element. */
	VariablePanel.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
	};

	/** Callback from slider. */
	VariablePanel.prototype.onSliderChange = function (name, value) {
		this.mvariables.set(name, value);
	};

	/** Update the slider and values. */
	VariablePanel.prototype.update = function () {
		var el = this.el,
			thumbLabel = el.querySelector(".thumb label"),
			thumbInput = el.querySelector(".thumb input"),
			str = LaserCanvas.Utilities.numberFormat(this.value);
		thumbLabel.innerText = thumbInput.value = str;
	};

	/** Set the number slider values, e.g. when a system is loaded. */
	VariablePanel.prototype.setVariables = function (json) {
		this.mvariables.forEach(function (name) {
			if (!json[name]) {
				return;
			}
			// Set properties, suppress firing of change event.
			this.numberSliders[name].setProp("min", json[name].min, false);
			this.numberSliders[name].setProp("max", json[name].max, false);
			this.numberSliders[name].setProp("value", json[name].value);
		}, this);
	};

	/** Returns a JSON representation of the variable states. */
	VariablePanel.prototype.toJson = function () {
		var json = {}
		this.mvariables.forEach(function (name, value) {
			var range = this.numberSliders[name].getRange();
			json[name] = {
				min: range.min,
				max: range.max,
				value: value
			};
		}, this);
		return json;
	};

	/** Trigger a variable to be scanned over its range. */
	VariablePanel.prototype.scan = function (variableName, iterator) {
		var range = this.numberSliders[variableName].getRange();
		this.mvariables.scan(variableName, range, VariablePanel.scanSteps, iterator);
	};

	LaserCanvas.VariablePanel = VariablePanel;
}(window.LaserCanvas));
