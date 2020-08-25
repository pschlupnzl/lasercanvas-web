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
		tr.setAttribute("data-property-name", this.propertyName);
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
				this.el.querySelector('[data-cell="value"]').innerText = Utilities.numberFormat(value, true);
				break;
			case InputPropertyRow.eType.sagTan:
				this.el.querySelector('[data-cell="sag"]').innerText = Utilities.numberFormat(value[0], true);
				this.el.querySelector('[data-cell="tan"]').innerText = Utilities.numberFormat(value[1], true);
				break;
		}
	};

	/** Respond to a change in the input's value. */
	InputPropertyRow.prototype.onInputChange = function (value) {
		this.onChange && this.onChange(this.prop.propertyName, value);
	};


	// -----------
	//  Abcd row.
	// -----------

	/**
	 * Initialize a new ABCD matrix row. The data is updated manually by
	 * the caller as it has no data source at initialization.
	 * @param {string} propertyName Name or key of property displayed by this control.
	 * @param {modePlane|string} plane Optional plane for auto-setting rows.
	 * @param {Element} source Optional data source for auto-setting rows. 
	 */
	var AbcdPropertyRow = function (propertyName, plane, source) {
		this.propertyName = propertyName;
		this.plane = plane;
		this.source = source;
		this.el = this.init();
	};

	/**
	 * Initialize the DOM element, returning the container.
	 */
	AbcdPropertyRow.prototype.init = function () {
		var tr = document.createElement("tr");
		tr.innerHTML = InputPropertyRow.template.mx;
		tr.setAttribute("data-property-name", this.propertyName);
		tr.querySelector('[data-cell="label"]').innerText = LaserCanvas.Utilities.prettify(this.propertyName);
		return tr;
	};

	/** Attaches tihs component's DOM element to the given parent. */
	AbcdPropertyRow.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	/** Return the desired matrix. */
	AbcdPropertyRow.prototype.get = function () {
		// Element ABCD, e.g. Mirror.
		if (typeof this.source.elementAbcd === "function") {
			return this.source.elementAbcd(1, this.plane);
		}

		// Roundtrip ABCD, e.g. System.
		if (typeof this.source.abcd === "function") {
			return this.source.abcd()[this.plane].mx;
		}
	};

	/** Update the readout based on a configured data source abcd() method. */
	AbcdPropertyRow.prototype.update = function () {
		var mx = this.get();
		for (var r = 0; r < 2; r += 1) {
			for (var c = 0; c < 2; c += 1) {
				this.el.querySelector(`[data-cell="mx-${r + 1}-${c + 1}"]`).innerText
					= LaserCanvas.Utilities.numberFormat(mx[r][c], true);
			}
		}
	};

	// ------------------------------------------
	//  Sagittal / tangential value readout row.
	// ------------------------------------------

	/**
	 * Initialize a new sag/tan property readout.
	 * @param {string} propertyName Name of property.
	 * @param {string} fieldName Name of field within abcdQ property.
	 * @param {Element} source Data source, used to retrieve current values in update().
	 */
	var AbcdQPropertyRow = function (propertyName, fieldName, source) {
		this.propertyName = propertyName;
		this.fieldName = fieldName;
		this.source = source;
		this.el = this.init();
	};

	/** Initialize the DOM, returning the container. */
	AbcdQPropertyRow.prototype.init = function () {
		var tr = document.createElement("tr");
		tr.innerHTML = InputPropertyRow.template.sagTan;
		tr.setAttribute("data-property-name", this.propertyName);
		tr.querySelector('[data-cell="label"]').innerText = LaserCanvas.Utilities.prettify(this.propertyName);
		tr.querySelector('[data-cell="unit"]').innerText = window.LaserCanvas.unit[this.propertyName] || "";
		return tr;
	};

	/** Attaches tihs component's DOM element to the given parent. */
	AbcdQPropertyRow.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	/** Return the current value. */
	AbcdQPropertyRow.prototype.get = function () {
		var abcdQ = this.source.abcdQ;
		return [abcdQ[0][this.fieldName], abcdQ[1][this.fieldName]];
	};

	/** Update the value. */
	AbcdQPropertyRow.prototype.update = function () {
		var value = this.get();
		this.el.querySelector('[data-cell="sag"]').innerText = LaserCanvas.Utilities.numberFormat(value[0], true);
		this.el.querySelector('[data-cell="tan"]').innerText = LaserCanvas.Utilities.numberFormat(value[1], true);
	};

	LaserCanvas.AbcdPropertyRow = AbcdPropertyRow;
	LaserCanvas.InputPropertyRow = InputPropertyRow;
	LaserCanvas.AbcdQPropertyRow = AbcdQPropertyRow;
}(window.LaserCanvas));
