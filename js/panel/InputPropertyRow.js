/**
 * Control to manipulate a single element or system property.
 */
(function (LaserCanvas) {
	/**
	 * Initialize a new InputPropertyRow object, which is based on a TR element.
	 * @param {string|object} prop Property name (for read-only) or object of property to manipulate.
	 * @param {System|Element} source Data source.
	 * @param {function} variablesGetter Callback to retrieve current variable values.
	 * @param {function=} onChange Change event handler callback.
	 */
	var InputPropertyRow = function (prop, source, variablesGetter, onChange) {
		this.prop = prop;
		this.source = source;
		this.variablesGetter = variablesGetter;
		this.onChange = onChange;
		this.propertyName = typeof prop === "string" ? prop : prop.propertyName;
		this.type = this.getType();
		this.el = this.init();
		this.control = this.initControl(); // {PropertyInput|null} Editable control.
	};

	/** Different types of input rows. */
	InputPropertyRow.eType = {
		unary: "unary",
		sagTan: "sagTan",
		action: "action",
		mx: "mx"
	};

	/** Table row template HTML. */
	InputPropertyRow.template = {
		/** Template HTML for an ABCD matrix value row. */
		mx: [
			'<td data-cell="label"></td>',
			'<td data-cell="mx-col-1">',
				'<span data-cell="mx-1-1"></span><br><span data-cell="mx-2-1"></span>',
			'</td>',
			'<td data-cell="mx-col-2">',
				'<span data-cell="mx-1-2"></span><br><span data-cell="mx-2-2"></span>',
			'</td>',
			'<td data-cell="unit"></td>',
		].join(""),

		/** Template HTML for a unary value row. */
		unary: [
			'<tr class="template" data-type="unary">',
				'<td data-cell="label"></td>',
				'<td data-cell="value" colspan="2"></td>',
				'<td data-cell="unit"></td>',
			'</tr>',
		].join(""),

		/** Template HTML for a sagittal / tangential value row. */
		sagTan: [
			'<td data-cell="label"></td>',
			'<td data-cell="sag" color-theme-plane="sag"></td>',
			'<td data-cell="tan" color-theme-plane="tan"></td>',
			'<td data-cell="unit"></td>'
		].join(""),

		/** Template HTML for an input data row. */
		action: [
			'<td data-cell="label"></td>',
			'<td data-cell="action" colspan="2" class="nowrap"></td>',
			'<td data-cell="unit"></td>'
		].join("")
	};

	/**
	 * Determine the type of this type of input.
	 */
	InputPropertyRow.prototype.getType = function () {
		var value;
		if (typeof this.prop === "object") {
			return InputPropertyRow.eType.action;
		}
		value = this.get();
		if (typeof value === "number") {
			return InputPropertyRow.eType.unary;
		} else if (Array.isArray(value) && value.length === 2) {
			return InputPropertyRow.eType.sagTan;
		}
		return InputPropertyRow.eType.mx;
	};

	/**
	 * Returns the current value of the data source.
	 */
	InputPropertyRow.prototype.get = function () {
		// TODO: Remove this once all properties support `get`.
		if (typeof this.source.get === "function") {
			return this.source.get(this.propertyName);
		}
		return this.source.property(this.propertyName);
	};

	/**
	 * Initialize the DOM element, returning the container element.
	 */
	InputPropertyRow.prototype.init = function () {
		var tr = document.createElement("tr");
		tr.innerHTML = InputPropertyRow.template[this.type];
		tr.querySelector('[data-cell="label"]').innerText = LaserCanvas.Utilities.prettify(this.propertyName);
		tr.querySelector('[data-cell="unit"]').innerText = window.LaserCanvas.unit[this.propertyName] || "";
		return tr;
	};

	/**
	 * Create an input control for action type rows.
	 */
	InputPropertyRow.prototype.initControl = function () {
		if (this.type === InputPropertyRow.eType.action) {
			return new LaserCanvas.PropertyInput(
					this.prop,
					this.source,
					this.variablesGetter,
					this.onInputChange.bind(this)
				).appendTo(this.el.querySelector('[data-cell="action"]'));
		} else {
			this.update();
			return null;
		}
	};

	/**
	 * Attaches this component's DOM element to the given parent.
	 * @param {HTMLTBodyElement} parent Parent element where to attach this component.
	 */
	InputPropertyRow.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	/**
	 * Update the control or current value.
	 */
	InputPropertyRow.prototype.update = function () {
		var value = this.get(),
			Utilities = LaserCanvas.Utilities;
		switch (this.type) {
			case InputPropertyRow.eType.action:
				this.control.update();
				break;
			case InputPropertyRow.eType.unary:
				this.el.querySelector('[data-cell="value"]').innerText = Utilities.numberFormat(value);
				break;
			case InputPropertyRow.eType.sagTan:
				this.el.querySelector('[data-cell="sag"]').innerText = Utilities.numberFormat(value[0]);
				this.el.querySelector('[data-cell="tan"]').innerText = Utilities.numberFormat(value[1]);
				break;
		}
	};

	/** Respond to a change in the input's value. */
	InputPropertyRow.prototype.onInputChange = function (value) {
		this.onChange && this.onChange(this.prop.propertyName, value);
	};

	LaserCanvas.InputPropertyRow = InputPropertyRow;
}(window.LaserCanvas));
