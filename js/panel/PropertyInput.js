/**
 * Input control for manipulating properties in popups and info panel.
 */
(function (LaserCanvas) {
	/**
	 * Create a new input control.
	 * @param {string} prop Name and configuration of property to manipulate.
	 * @param {Element|System} source Data source, element or system, with property.
	 * @param {function} onChange Change event handler callback.
	 */
	var PropertyInput = function (prop, source, onChange) {
		this.prop = prop;
		this.source = source;
		this.onChange = onChange;
		this.isFocused = false;
		this.lastValue = "";
		this.el = this.init();
		this.input = this.el.querySelector("input");
		this.select = this.el.querySelector("select");
		this.update();
	};
	
	/** Template for control. */
	PropertyInput.template = [
		'<button data-step="-1">&minus;</button>',
		'<span class="input">',
		'<input type="text" />',
		'</span>',
		'<button data-step="+1">+</button>',
		'<span class="selector">',
		'<select></select>',
		'</span>'
	].join("");

	/**
	 * Initialize a new control and return the container DOM element.
	 */
	PropertyInput.prototype.init = function () {
		var self = this,
			el = document.createElement("div"),

			/** Attach listeners to the input field. */
			attachInputHandlers = function (input) {
				input.onkeydown = self.onInputKeydown.bind(self);
				input.onkeyup = self.onInputKeyup.bind(self);
				input.onchange = self.onInputChange.bind(self);
				input.onfocus = self.onInputFocus.bind(self);
				input.onblur = self.onInputBlur.bind(self);
			},

			/** Attach handlers to the step buttons. */
			attachButtonHandlers = function (buttons) {
				var onClick = function () {
					var step = +this.getAttribute("data-step");
					self.increment(step * self.prop.increment);
				}
				LaserCanvas.Utilities.foreach(buttons, function () {
					this.onclick = onClick;
				});
			},

			/** Attach handlers to Select menu. */
			attachSelectHandlers = function (select) {
				el.setAttribute("data-has-standard", "true");
				self.prop.standard.forEach(function (value) {
					var option = document.createElement("option");
					option.value = value;
					option.innerText = value;
					select.insertBefore(option, select.firstChild);
				});
				select.onchange = self.onSelectChange.bind(self);
				setTimeout(function () { select.value = self.get(); }, 0);
			};

		el.className = "propertyInput";
		el.innerHTML = PropertyInput.template;

		attachInputHandlers(el.querySelector("input"));
		if (this.prop.hasOwnProperty("standard")) {
			attachSelectHandlers(el.querySelector("select"));
		} else if (this.prop.hasOwnProperty("increment")) {
			attachButtonHandlers(el.querySelectorAll("button"));
		} else {
			LaserCanvas.Utilities.foreach(el.querySelectorAll("button"), function () {
				this.disabled = true;
			});
		}

		return el;
	};

	/**
	 * Attach the input element to the given parent.
	 * @param {HTMLElement} parent Parent container where to attach.
	 */
	PropertyInput.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	// ----------------
	//  Update values.
	// ----------------

	/**
	 * Returns the current value of the data source.
	 */
	PropertyInput.prototype.get = function () {
		if (this.isFocused) {
			return this.source.expression(this.prop.propertyName);
		} else {
			return LaserCanvas.Utilities.numberFormat(
				this.source.get(this.prop.propertyName)
			);
		}
	};

	/** Return the *numeric* value. */
	PropertyInput.prototype.getValue = function () {
		return this.source.get(this.prop.propertyName);
	};

	/**
	 * Update the displayed value of the input field.
	 */
	PropertyInput.prototype.update = function () {
		var value = this.get(),
			displayValue = typeof value === "number" ? LaserCanvas.Utilities.numberFormat(value) : value;
		if (this.input.value !== displayValue) {
			this.input.value = displayValue;
		}
		this.select.value = value;
	};
	
	// ---------
	//  Events.
	// ---------

	/** A focused input field shows the expression. */
	PropertyInput.prototype.onInputFocus = function () {
		this.isFocused = true;
		this.update(); // Update now with expression.
		this.lastValue = this.input.value;
	};

	/** A blurred input field shows the expression. */
	PropertyInput.prototype.onInputBlur = function () {
		this.isFocused = false;
		this.update(); // Update now with value.
	};

	var ENTER = 13,
		NEWLINE = 10,
		ESCAPE = 27
		UP_ARROW = 38,
		DOWN_ARROW = 40;

	/** Blur the field on enter or escape. */
	PropertyInput.prototype.onInputKeydown = function (keyboardEvent) {
		switch (keyboardEvent.which || keyboardEvent.keyCode) {
			case ENTER:
			case NEWLINE:
				this.input.blur();
				break;
			case ESCAPE:
				this.input.value = this.lastValue;
				this.input.blur();
				break;
			case UP_ARROW: // Up arrow
				this.increment(+1 * this.prop.increment);
				return false;
			case DOWN_ARROW:
				this.increment(-1 * this.prop.increment);
				return false;
		}
	};

	/** Handle a keyup event. */
	PropertyInput.prototype.onInputKeyup = function () {
		var value = this.input.value;
		if (value !== "") {
			this.fireChangeEvent(this.input.value);
		}
	};

	/** Handle a change event. */
	PropertyInput.prototype.onInputChange = function () {
		this.fireChangeEvent(this.input.value);
	};

	/** Increment or decrement the value by the given step. */
	PropertyInput.prototype.increment = function (step) {
		var newValue = this.getValue() + step;
		if (!step) {
			return;
		}
		if ((this.prop.hasOwnProperty("min") && newValue < this.prop.min)
			|| (this.prop.hasOwnProperty("max") && newValue > this.prop.max)) {
			return;
		}
		if (this.prop.hasOwnProperty("wrap") && newValue > this.prop.wrap) {
			newValue -= 2 * this.prop.wrap;
		}
		if (this.prop.hasOwnProperty("wrap") && newValue < -this.prop.wrap) {
			newValue += 2 * this.prop.wrap;
		}
		this.fireChangeEvent(newValue);
	};

	/** The value in the select chooser is changed. */
	PropertyInput.prototype.onSelectChange = function () {
		this.fireChangeEvent(+this.select.value);
		this.select.value = "";
	};

	/** Notify the parent controller that the value has changed. */
	PropertyInput.prototype.fireChangeEvent = function (value) {
		this.onChange(value);
	};

	LaserCanvas.PropertyInput = PropertyInput;
}(window.LaserCanvas));
