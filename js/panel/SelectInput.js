/**
 * Control row for an element property using a select element.
 */
(function (LaserCanvas) {
	/**
	 * Initialize a new SelectInput, which uses a SELECT element.
	 * @param {object} prop Information about the property to modify.
	 * @param {System|Element} source Data source.
	 * @param {function=} onChange Change event handler callback.
	 */
	var SelectInput = function (prop, source, onChange) {
		this.prop = prop;
		this.source = source;
		this.onChange = onChange;
		this.el = this.init(prop);
		this.select = this.el.querySelector("select");
		this.update();
	};

	/** Table row template HTML. */
	SelectInput.template = [
		'<select />'
	].join("");

	/**
	 * Initialize a new control and return the container DOM element.
	 */
	SelectInput.prototype.init = function () {
		var select, option, opt,
			el = document.createElement("div");
		el.className = "selectInput";
		el.innerHTML = SelectInput.template;
		select = el.querySelector("select");
		for (var option of this.prop.options) {
			opt = document.createElement("option");
			opt.value = option;
			opt.innerText = option;
			select.appendChild(opt);
		}
		select.onchange = this.onSelectChange.bind(this);
		return el;
	};

	/**
	 * Attach the control to the given parent.
	 */
	SelectInput.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	// ---------------
	//  Update value.
	// ---------------

	/**
	 * Returns the current value of the data source.
	 */
	SelectInput.prototype.get = function () {
		return this.source.get(this.prop.propertyName);
	};

	/** Update the displayed value of the select menu. */
	SelectInput.prototype.update = function () {
		this.select.value = this.get();
	};

	// ---------
	//  Events.
	// ---------

	/** Handle a change in the select menu. */
	SelectInput.prototype.onSelectChange = function () {
console.log(`SelectInput change ${this.prop.propertyName} => ${this.select.value}`)
		this.fireChangeEvent(this.select.value);
	};

	/** Notify parent controller that the value has changed. */
	SelectInput.prototype.fireChangeEvent = function (value) {
		this.onChange(value);
	};
	
	LaserCanvas.SelectInput = SelectInput;
}(window.LaserCanvas));
