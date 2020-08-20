(function (LaserCanvas) {
	var VariablePanel = function (mvariables) {
		this.mvariables = mvariables;
		this.numberSliders = {};
		this.el = this.init();
	};

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
console.log(`${name} --> ${value}`);
	};

	/** Update the slider and values. */
	VariablePanel.prototype.update = function () {
		var el = this.el,
			thumbLabel = el.querySelector(".thumb label"),
			thumbInput = el.querySelector(".thumb input"),
			str = LaserCanvas.Utilities.numberFormat(this.value);
		thumbLabel.innerText = thumbInput.value = str;
	};

	LaserCanvas.VariablePanel = VariablePanel;
}(window.LaserCanvas));
