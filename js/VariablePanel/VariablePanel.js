(function (LaserCanvas) {
	var VariablePanel = function (mvariables) {
		this.mvariables = mvariables;
		this.numberSliders = {};
		this.scan2dId = 0;
		this.el = this.init();
	};

	/** Number of scanning steps (not including starting point). */
	VariablePanel.scanSteps = 32;

	/** First density of mimap for 2d scans. */
	VariablePanel.scan2dMin = 16;

	/** Maximum density of mimap for 2d scans. */
	VariablePanel.scan2dMax = 64;

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
			this.numberSliders[name].setProp("value", json[name].value, false);

			// Update variable silently (don't fire change event).
			this.mvariables.set(name, json[name].value, true);
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

	/**
	 * Iterate over two variable names. We fill the plane with a mipmap-style
	 * algorithm, starting coarse and finishing fine, unless the scan is called
	 * again before the layering is finished.
	 * @param {[string, string]} variableNames The two variables to scan.
	 * @param {function} iterator Delegate to call on every variable step.
	 */
	VariablePanel.prototype.scan2 = function (variableNames, iterator) {
		var self = this,
			vx, vy,
			scan2dId = ++this.scan2dId,
			n = 16, // Starting mipmap resolution.
			ranges = variableNames.map(function (variableName) {
				return self.numberSliders[variableName].getRange();
			}),
			steps = ranges.map(function (range) {
				return range.max - range.min;
			}),
			current = self.mvariables.value(),

			/** Iterate the next level. */
			iterate = function () {
				// Abort if re-triggered since scan started.
				if (scan2dId !== self.scan2dId) {
					return;
				}

				// Scan one resolution.
				for (var x = 0; x < n; x += 1) {
					vx = ranges[0].min + x * steps[0] / n;
					self.mvariables.set(variableNames[0], vx, true);
					for (var y = 0; y < n; y += 1) {
						if (n > VariablePanel.scan2dMin && x % 2 === 0 && y % 2 === 0) {
							// Skip previously set.
							continue;
						}
						vy = ranges[1].min + y * steps[1] / n;
						self.mvariables.set(variableNames[1], vy, true);
						iterator([x, y], n);
					}
				}

				// Restore all variables.
				variableNames.forEach(function (variableName) {
					self.mvariables.set(variableName, current[variableName], true);
				});		

				// Prepare for next iteration.
				n *= 2;
				if (n <= VariablePanel.scan2dMax) {
					setTimeout(iterate, 0);
				}
			};

		setTimeout(iterate, 0);
	};

	LaserCanvas.VariablePanel = VariablePanel;
}(window.LaserCanvas));
