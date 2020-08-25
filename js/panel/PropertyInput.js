/**
 * Input control for manipulating properties in popups and info panel.
 */
(function (LaserCanvas) {
/*
	var
		kpropertyNames = ['propertyName', 'increment', 'max', 'min', 'standard', 'wrap'], // {Array<string>} Properties to set.
		
		handlers = {
			// Attach an event handler that blurs the input
			// field when the enter key is pressed.
			// @this {HTMLInputElement} Triggering input field.
			// @param {KeyboardEvent} e Triggering event.
			// @param {object:Element} element Element to update.
			// @param {object:System} system Optical system containing element.
			keydown: function (e, element, system) {
				var tr, step,
					propertyStep = window.LaserCanvas.Element.propertyStep,
					input = this;
					
				
				switch (e.keyCode) {
					case 10: // Enter.
					case 13: // Return.
						this.blur();
						break;
						
					case 38: // Up.
					case 40: // Down.
						step = e.keyCode === 38 ? +1 : -1;
						if ((e.ctrlKey || e.metaKey)
							&& input.hasAttribute('data-standard')) {
							propertyStep(input, 'standard', step, element, system);
						} else if (input.hasAttribute('data-increment')) {
							if (e.ctrlKey || e.metaKey || e.shiftKey) {
								propertyStep(input, 'increment', 10 * step, element, system);
							} else {
								propertyStep(input, 'increment', step, element, system);
							}
						}
						e.preventDefault();
						break;
				}
			},
			
			// Attach an event handler that updates the property
			// value when a key is released.
			// @this {HTMLInputElement} Triggering input field.
			// @param {KeyboardEvent} e Triggering event. The parameter is not used.
			// @param {object:Element} element Optical element to update.
			// @param {object:System} system Optical system containing element.
			keyup: function (e, element, system) {
				var value = this.value, // {string} Current element value.
					val = +value; // {number} New numeric value.
				if (value.length > 0 && !isNaN(val)) {
					window.LaserCanvas.Element.propertyStep(this, 'set', val, element, system);
				}
			}
		},
		
		// Create stepping buttons before and after the input control.
		// @param {HTMLInputElement} input Input element to step.
		// @param {string} action Type of buttons to create 'standard'|'increment'.
		createStepButton = function (input, action, step) {
			var but = document.createElement('button');
			but.className = 'lcbutton';
			but.setAttribute('data-action', action);
			but.setAttribute('data-step', step);
			but.innerHTML = action === 'standard' 
				? (step < 0 ? '&lt;' : '&gt;')
				: (step < 0 ? '&minus;' : '+');
			input.parentNode.insertBefore(but, step < 0 
				? input
				: input.nextSiblingElement);
		},
		
		// Prepare a single input.
		// @param {HTMLInputElement} input Input to configure.
		// @param {object} prop Property to configure.
		// @param {object:Element} element Optical element to control.
		// @param {object:System} system System containing element.
		// @returns {HTMLInputElement} Original element.
		prepareInput = function (input, prop, element, system) {
			var nowrap = true; // {boolean} Value indicating whether to assign nowrap to parent.
			window.LaserCanvas.Utilities.foreach(kpropertyNames, function (k, key) {
				if (prop.hasOwnProperty(key)) {
					input.setAttribute('data-' + key.replace(/([A-Z])/g, '-$1').toLowerCase(), 
						Array.isArray(prop[key]) 
						? prop[key].join(',') 
						: prop[key]);
				}
			});
			
			if (prop.hasOwnProperty('standard')) {
				createStepButton(input, 'standard', -1);
				createStepButton(input, 'standard', +1);
			} else if (prop.hasOwnProperty('increment')) {
				createStepButton(input, 'increment', -1);
				createStepButton(input, 'increment', +1);
			} else {
				nowrap = false;
			}
			
			if (nowrap) {
				input.parentNode.className += ' nowrap';
			}
			
			LaserCanvas.Element.activateInputProperty(input, handlers, element, system);
		};
*/






	/**
	 * Create a new input control.
	 * @param {string} prop Name and configuration of property to manipulate.
	 * @param {Element|System} source Data source, element or system, with property.
	 * @param {function} variablesGetter Callback to retrieve current variable values.
	 * @param {function} onChange Change event handler callback.
	 */
	var PropertyInput = function (prop, source, variablesGetter, onChange) {
		this.prop = prop;
		this.source = source;
		this.variablesGetter = variablesGetter;
		this.onChange = onChange;
		this.isFocused = false;
		this.lastValue = "";
		this.el = this.init(prop);
		this.input = this.el.querySelector("input");
		this.update();
	};
	
	/**
	 * Initialize a new control and return the container DOM element.
	 * @param {string} prop Name and configuration of property to manipulate.
	 */
	PropertyInput.prototype.init = function (prop) {
		var self = this,
			el = document.createElement("div"),
			/** Attach listeners to the input field. */
			attachInputHandlers = function (input) {
				input.onkeydown = self.onInputKeydown.bind(self);
				input.onkeyup = self.onInputKeyup.bind(self);
				input.onchange = self.onInputChange.bind(self);
				input.onfocus = self.onInputFocus.bind(self);
				input.onblur = self.onInputBlur.bind(self);
			};

		el.className = "propertyInput";
		el.innerHTML = [
			'<button data-step="-1" disabled>&minus;</button>',
			'<span>',
			'<input type="text" />',
			'</span>',
			'<button data-step="+1" disabled>+</button>'
		].join("");
		LaserCanvas.Utilities.foreach(el.querySelectorAll("button"), function () {
			this.onclick = self.onButtonClick.bind(self);
		});
		attachInputHandlers(el.querySelector("input"));
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
		// TODO: Remove this once all properties support `get`.
		if (typeof this.source.get !== "function") {
			return this.source.property(this.prop.propertyName);
		}

		if (this.isFocused) {
			return this.source.expression(this.prop.propertyName);
		} else {
			return LaserCanvas.Utilities.numberFormat(
				this.source.get(this.prop.propertyName, this.variablesGetter())
			);
		}
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

	/** Blur the field on enter or escape. */
	PropertyInput.prototype.onInputKeydown = function (keyboardEvent) {
		switch (keyboardEvent.which || keyboardEvent.keyCode) {
			case 10:
			case 13:
				this.input.blur();
				break;
			case 27:
				this.input.value = this.lastValue;
				this.input.blur();
				break;
		}
	};

	/** Handle a keyup event. */
	PropertyInput.prototype.onInputKeyup = function () {
		this.fireChangeEvent(this.input.value);
	};

	/** Handle a change event. */
	PropertyInput.prototype.onInputChange = function () {
		this.fireChangeEvent(this.input.value);
	};

	/** The decrement button is clicked. */
	PropertyInput.prototype.onButtonClick = function () {
console.log(`onButtonClick ${this.prop.propertyName}`);
	};

	/** Increment or decrement the value by the given step. */
	PropertyInput.prototype.increment = function (step) {
console.log(`Increment by ${step}`);
	};

	/** Notify the parent controller that the value has changed. */
	PropertyInput.prototype.fireChangeEvent = function (value) {
		this.onChange(value);
	};

	// /**
	// * Assumes that the input element is within a TR that contains
	// * the attributes.
	// * @param {HTMLInputElement} parent Parent of input elements to configure.
	// * @param {object:Element} element Optical element to control.
	// * @param {object:System} system System containing element.
	// */
	// return function inputProperties(parent, element, system) {
	// 	var Utilities = LaserCanvas.Utilities;
	// 	Utilities.foreach(element.userProperties(), function (k, prop) {
	// 		var input;
	// 		if (element.canSetProperty(prop.propertyName)
	// 			&& (input = parent.querySelector(Utilities.stringFormat('input[type="text"][data-property-name="{0}"]', prop.propertyName)))) {
	// 			prepareInput(input, prop, element, system);
	// 		}
	// 	});
	// 	return parent;
	// };

	LaserCanvas.PropertyInput = PropertyInput;
}(window.LaserCanvas));
