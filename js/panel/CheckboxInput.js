/**
 * Control row for an element property using a checkbox element.
 */
(function (LaserCanvas) {
	/**
	 * Initialize a new CheckboxInput, which uses a SELECT element.
	 * @param {object} prop Information about the property to modify.
	 * @param {System|Element} source Data source.
	 * @param {function=} onChange Change event handler callback.
	 */
	var CheckboxInput = function (prop, source, onChange) {
		this.prop = prop;
		this.source = source;
		this.onChange = onChange;
		this.el = this.init(prop);
		this.input = this.el.querySelector("input");
	};

	/** Table row template HTML. */
	CheckboxInput.template = [
		'<input type="checkbox" />'
	].join("");

	/**
	 * Initialize a new control and return the container DOM element.
	 */
	CheckboxInput.prototype.init = function () {
		var el = document.createElement("div");
		el.className = "checkboxInput";
		el.innerHTML = CheckboxInput.template;
		el.querySelector("input").onchange = this.onCheckboxChange.bind(this);
		return el;
	};

	/**
	 * Attach the control to the given parent.
	 */
	CheckboxInput.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	// ---------------
	//  Update value.
	// ---------------

	/**
	 * Returns the current value of the data source.
	 */
	CheckboxInput.prototype.get = function () {
		return this.source.get(this.prop.propertyName);
	};

	/** Update the displayed value of the select menu. */
	CheckboxInput.prototype.update = function () {
		this.input.value = this.get();
	};

	// ---------
	//  Events.
	// ---------

	/** Handle a change in the checkbox. */
	CheckboxInput.prototype.onCheckboxChange = function () {
		this.fireChangeEvent(this.input.checked);
	};

	/** Notify parent controller that the value has changed. */
	CheckboxInput.prototype.fireChangeEvent = function (value) {
		this.onChange(value);
	};
	
	LaserCanvas.CheckboxInput = CheckboxInput;
}(window.LaserCanvas));
