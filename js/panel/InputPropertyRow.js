/**
 * Control to manipulate a single element or system property.
 * The property elements can have these properties:
 *    propertyName {string}        Property name as used by element.
 *    label        {string=}       Optional label to use in place of pretty print propertyName.
 *    unit         {string=}       Optional unit to display.
 *    options      {Array<string>} For drop-down menu, array of option strings.
 *    dataType     {string}        Set to 'boolean' to create a checkbox.
 *    increment    {number}        Step size with buttons or arrow keys (x10 for Shift+arrow).
 *    wrap         {number}        Number at which to wrap (to negative of wrap)
 *    min          {number}        Minimum permitted value.
 *    max          {number}        Maximum permitted value.
 *    standard     {Array<number>} Values to step through with prev/next buttons or Ctrl+arrow keys.
 */
(function (LaserCanvas) {
	/**
	 * Initialize a new InputPropertyRow object, which is based on a TR element.
	 * @param {string|object} prop Property name (for read-only) or object of property to manipulate.
	 * @param {System|Element} source Data source.
	 * @param {function=} onChange Change event handler callback.
	 * @param {function} toggleGraph Callback to show or hide a property graph for this row.
	 */
	var InputPropertyRow = function (prop, source, onChange, toggleGraph) {
		this.prop = prop;
		this.source = source;
		this.onChange = onChange;
		this.toggleGraph = toggleGraph;
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
		mx: "mx",
		select: "select",
		boolean: "boolean"
	};

	/** Table row template HTML. */
	InputPropertyRow.template = {
		/** Template HTML for an ABCD matrix value row. */
		mx: [
			'<td data-cell="graph-placeholder"></td>',
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
			'<td data-cell="graph"><span><input type="checkbox" /></span></td>',
			'<td data-cell="label"></td>',
			'<td data-cell="value" colspan="2"></td>',
			'<td data-cell="unit"></td>',
		].join(""),

		/** Template HTML for a sagittal / tangential value row. */
		sagTan: [
			'<td data-cell="graph"><span><input type="checkbox" /></span></td>',
			'<td data-cell="label"></td>',
			'<td data-cell="sag" color-theme-plane="sag"></td>',
			'<td data-cell="tan" color-theme-plane="tan"></td>',
			'<td data-cell="unit"></td>'
		].join(""),

		/** Template HTML for an input data row. */
		action: [
			'<td data-cell="graph-placeholder"></td>',
			'<td data-cell="label"></td>',
			'<td data-cell="action" colspan="2" class="nowrap"></td>',
			'<td data-cell="unit"></td>'
		].join(""),

		/** Template HTML for a select action data row. */
		select: [
			'<td data-cell="graph-placeholder"></td>',
			'<td data-cell="label"></td>',
			'<td data-cell="select" colspan="2"></td>',
			'<td data-cell="unit"></td>'
		].join(""),

		/** Template HTML for checkbox. */
		boolean: [
			'<td data-cell="graph-placeholder"></td>',
			'<td data-cell="label"></td>',
			'<td data-cell="checkbox" colspan="2"></td>',
			'<td data-cell="unit"></td>'
		].join("")
	};

	/**
	 * Determine the type of this type of input.
	 */
	InputPropertyRow.prototype.getType = function () {
		var value;
		if (typeof this.prop === "object") {
			if (this.prop.hasOwnProperty("options")) {
				return InputPropertyRow.eType.select;
			} else if (this.prop.dataType === "boolean") {
				return InputPropertyRow.eType.boolean;
			}
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
		return this.source.get(this.propertyName);
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
		var onInputChange = this.onInputChange.bind(this);
		if (this.type === InputPropertyRow.eType.action) {
			return new LaserCanvas.PropertyInput(this.prop, this.source, onInputChange)
				.appendTo(this.el.querySelector('[data-cell="action"]'));

		} else if (this.type === InputPropertyRow.eType.select) {
			return new LaserCanvas.SelectInput(this.prop, this.source, onInputChange)
				.appendTo(this.el.querySelector('[data-cell="select"]'));

		} else if (this.type === InputPropertyRow.eType.boolean) {
			return new LaserCanvas.CheckboxInput(this.prop, this.source, onInputChange)
				.appendTo(this.el.querySelector('[data-cell="checkbox"]'));

		} else {
			this.el.querySelector('[data-cell="graph"] input').onchange = this.onGraphChange.bind(this);
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
			case InputPropertyRow.eType.select:
			case InputPropertyRow.eType.boolean:
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

	/**
	 * Update the graph icons (and perhaps other detailed information.)
	 * @param {GraphCollection} graphCollection Collection whose graph status to match to.
	 */
	InputPropertyRow.prototype.updateGraphs = function (graphCollection) {
		var hasGraph;
		switch (this.type) {
			case InputPropertyRow.eType.unary:
			case InputPropertyRow.eType.sagTan:
				hasGraph = graphCollection.hasGraph(this.source, this.propertyName);
				this.el.querySelector('[data-cell="graph"] input[type="checkbox"]').checked = hasGraph;
				break;
		}
	},

	/** Respond to a change in the input's value. */
	InputPropertyRow.prototype.onInputChange = function (value) {
		this.onChange && this.onChange(this.prop.propertyName, value);
	};

	/** Respond to a click on the graph click. */
	InputPropertyRow.prototype.onGraphChange = function () {
		this.toggleGraph(this.source, this.propertyName, null);
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
	 * @param {function} toggleGraph Callback to create or remove property graphs.
	 */
	var AbcdPropertyRow = function (propertyName, plane, source, toggleGraph) {
		this.propertyName = propertyName;
		this.plane = plane;
		this.source = source;
		this.toggleGraph = toggleGraph;
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
	 * @param {function} toggleGraph Callback to create or remove property graphs.
	 */
	var AbcdQPropertyRow = function (propertyName, fieldName, source, toggleGraph) {
		this.propertyName = propertyName;
		this.fieldName = fieldName;
		this.source = source;
		this.toggleGraph = toggleGraph;
		this.el = this.init();
	};

	/** Initialize the DOM, returning the container. */
	AbcdQPropertyRow.prototype.init = function () {
		var tr = document.createElement("tr");
		tr.innerHTML = InputPropertyRow.template.sagTan;
		tr.setAttribute("data-property-name", this.propertyName);
		tr.querySelector('[data-cell="label"]').innerText = LaserCanvas.Utilities.prettify(this.propertyName);
		tr.querySelector('[data-cell="unit"]').innerText = window.LaserCanvas.unit[this.propertyName] || "";
		tr.querySelector('[data-cell="graph"] input[type="checkbox"]').onchange = this.onGraphChange.bind(this);
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

	/**
	 * Update the graph icons (and perhaps other detailed information.)
	 * @param {GraphCollection} graphCollection Collection whose graph status to match to.
	 */
	AbcdQPropertyRow.prototype.updateGraphs = function (graphCollection) {
		var hasGraph = graphCollection.hasGraph(this.source, this.propertyName, this.fieldName);
		this.el.querySelector('[data-cell="graph"] input[type="checkbox"]').checked = hasGraph;
	};
	
	/** Hnadle a change on the graph panel button. */
	AbcdQPropertyRow.prototype.onGraphChange = function () {
		this.toggleGraph(this.source, this.propertyName, this.fieldName);
	};

	LaserCanvas.AbcdPropertyRow = AbcdPropertyRow;
	LaserCanvas.InputPropertyRow = InputPropertyRow;
	LaserCanvas.AbcdQPropertyRow = AbcdQPropertyRow;
}(window.LaserCanvas));
