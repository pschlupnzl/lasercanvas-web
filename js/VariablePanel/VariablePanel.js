(function (LaserCanvas) {
	/** Time, in ms, that counts as "fast" and can boost the minimum scan grid. */
	var FAST_SUBS_TIME = 15;
	/** Time, in ms, that counts as "slow" and should slash the minimum scan grid. */
	var SLOW_SUBS_TIME = 70;
	
	var VariablePanel = function (mvariables) {
		this.mvariables = mvariables;
		this.numberSliders = {};
		this.scan2dId = 0;
		this.el = this.init();
	};

	/** Number of scanning steps (not including starting point). */
	VariablePanel.scanSteps = 64;

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
	 * @param {function} init Delegate called when a scan starts.
	 * @param {function} iterator Delegate to call on every variable step.
	 * @param {function} end Delegate to call when each scan set ends.
	 */
	VariablePanel.prototype.scan2d = function (variableNames, init, iterator, end) {
		var self = this,
			vx, vy, toc,
			x = 0,
			y = 0,
			scan2dId = ++this.scan2dId,
			subs = VariablePanel.scan2dMin, // Starting mipmap resolution.
			blockSize = Math.max(200, subs * subs), // Ensure one full scan.
			extents = variableNames.map(function (variableName) {
				return self.numberSliders[variableName].getRange();
			}),
			ranges = extents.map(function (extent) {
				return extent.max - extent.min;
			}),
			current = self.mvariables.value(),
			/** Restore all variables to previous state. */
			restore = function () {
				variableNames.forEach(function (variableName) {
					self.mvariables.set(variableName, current[variableName], true);
				});
			};

			/**
			 * Iterate the next level. The iterator is implemented as a fixed
			 * block of iterations to preserve render speed across resolution
			 * levels. A subsequent block is triggered on a timeout, with an
			 * identifier used as an abort signaler.
			 */
			iterate = function () {
				// Abort if re-triggered since scan started.
				if (scan2dId !== self.scan2dId) {
					return;
				}

				kk = blockSize;
				for (; subs <= VariablePanel.scan2dMax; x = 0, y = 0, subs *= 2) {
					for (; x < subs; y = 0, x += 1) {
						vx = extents[0].min + x * ranges[0] / subs;
						self.mvariables.set(variableNames[0], vx, true);
						for (; y < subs; y += 1) {
							vy = extents[1].min + y * ranges[1] / subs;
							self.mvariables.set(variableNames[1], vy, true);
							
							iterator([x, y], subs, extents);

							if (--kk <= 0) {
								restore();
								setTimeout(iterate, 0);
								return;
							}
						}
					}
				}

				restore();
				end();
			};

		// Start a new scan.
		init(extents);
		setTimeout(iterate, 0);
	};

	LaserCanvas.VariablePanel = VariablePanel;
}(window.LaserCanvas));
