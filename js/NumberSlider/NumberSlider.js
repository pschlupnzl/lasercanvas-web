/**
 * Number range slider.
 */
(function (LaserCanvas) {
	/** Returns the value limited by the min and max values. */
	var limit = function (min, max, val) {
		return val < min ? min : val > max ? max : val;
	};

	/** Regular expression matching a number such as -.3e-7. */
	var reNumber = /^(\+|-)?[0-9]*(?:\.[0-9]*)?(?:e(\+|-)?[0-9]+)?$/i;

	var NumberSlider = function (name) {
		this.name = name;
		this.changeEventListener = null;
		this.min = 0;
		this.max = 1;
		this.value = 0.5;
		this.el = this.init();
		this.update();
	};

	/**
	 * Initialize and create the component DOM element.
	 */
	NumberSlider.prototype.init = function () {
		var self = this,
			el = document.createElement("div"),
			inputChange = function () {
				self.inputChange(this.getAttribute("data-prop"), this.value);
			},
			inputBlur = function () {
				self.inputBlur(this.getAttribute("data-prop"));
			};

		el.className = "LaserCanvasNumberSlider";
		el.innerHTML = [
			'<div class="range">',
				'<div class="trough">',
					'<div class="thumb">',
						'<div class="handle"></div>',
						'<div class="callout">',
							'<input type="text" data-prop="value" value="val" />',
						'</div>', // callout
					'</div>', // thumb
				'</div>', // trough
			'</div>', // range
			'<div class="limits">',
				'<input type="text" value="min" data-prop="min" />',
				'<label class="variableName"></label>',
				'<input type="text" value="max" data-prop="max" />',
			'</div>'
		].join("");
		el.querySelector(".variableName").innerText = this.name;
		LaserCanvas.Utilities.draggable(el.querySelector(".thumb"), {
			handle: el.querySelector(".handle"),
			axis: "x",
			onDrag: function (e, pt) {
				var v, w = el.querySelector(".trough").offsetWidth;
				pt.x = limit(0, w, pt.x);
				v = pt.x / w;
				this.setProp("value", this.min + (this.max - this.min) * v);
				this.updateValue();
			},
			onEnd: function () {
				this.update();
			}
		}, this);
		Array.prototype.forEach.call(el.querySelectorAll("input[data-prop]"), function (input) {
			input.onchange = input.onkeyup = inputChange;
			input.onblur = inputBlur;
		});
		return el;
	};

	/**
	 * Attach myself to the given DOM element.
	 * @param {Element} element DOM element where to append.
	 */
	NumberSlider.prototype.appendTo = function (element) {
		element.appendChild(this.el);
	};

	/** Sets the callback function on change. */
	NumberSlider.prototype.setChangeEventListener = function (callback, thisArg) {
		this.changeEventListener = callback ? callback.bind(thisArg) : null;
	};

	/** Fire the change event, if it is registered. */
	NumberSlider.prototype.fireChangeEvent = function () {
		if (this.changeEventListener) {
			this.changeEventListener(this.name, this.value);
		}
	};

	/** Update a property, firing the change event as needed. */
	NumberSlider.prototype.setProp = function (prop, value) {
		if (reNumber.test(value)) {
			value = +value;
			if (!isNaN(value)) {
				this[prop] = +value;
				if (prop === "value") {
					this.fireChangeEvent();
				}
				this.updateThumb();
			}
		}
	};

	/**
	 * A value in one of the input fields has changed.
	 * @param {string} value The string value in the input field.
	 * @param {string} prop Property being changed "min"|"max"|"value".
	 */
	NumberSlider.prototype.inputChange = function (prop, value) {
		this.setProp(prop, value);
	};

	/**
	 * Finish editing when the field is blurred.
	 * @param {string} prop Property that was changed "min"|"max"|"value".
	 */
	NumberSlider.prototype.inputBlur = function (prop) {
		if (this.max <= this.min) {
			this.setProp("max", this.min + 1);
		}
		if (prop === "value" && this.value > this.max) {
			this.setProp("max", this.value);
		} else if (prop === "value" && this.value < this.min) {
			this.setProp("min", this.value);
		} else if (prop === "min" && this.value < this.min) {
			this.setProp("value", this.min);
		} else if (prop === "max" && this.value > this.max) {
			this.setProp("value", this.max);
		}
		this.update();
	};

	/**
	 * Render or update the slider.
	 */
	NumberSlider.prototype.update = function () {
		this.updateThumb();
		this.updateValue();
		this.updateLimits();
	};

	/** Update the thumb position. */
	NumberSlider.prototype.updateThumb = function () {
		var left = 100 * limit(0, 1, (this.value - this.min) / (this.max - this.min));
		this.el.querySelector(".thumb").style.left = `${left}%`;
	};

	/**
	 * Set the value and update the label (but not the thumb position),
	 * for example during a slider drag.
	 */
	NumberSlider.prototype.updateValue = function () {
		this.el.querySelector('[data-prop="value"]').value = LaserCanvas.Utilities.numberFormat(this.value);
	};

	/** Update the min/max limit values. */
	NumberSlider.prototype.updateLimits = function () {
		var Utilities = LaserCanvas.Utilities;
		this.el.querySelector('[data-prop="min"]').value = Utilities.numberFormat(this.min);
		this.el.querySelector('[data-prop="max"]').value = Utilities.numberFormat(this.max);
	};

	LaserCanvas.NumberSlider = NumberSlider;
}(window.LaserCanvas));
