/**
 * Controls to manipulate system properties.
 */
(function (LaserCanvas) {
	/**
	 * Initialize a new information panel to manipulate system properties.
	 * @param {string} label Display label for panel heading.
	 * @param {System} source Reference to data source (system, element) to manipulate.
	 * @param {function} variablesGetter Callback to retrieve current variable values.
	 */
	var InfoPropertiesPanel = function (label, source, variablesGetter) {
		this.source = source;
		this.variablesGetter = variablesGetter;
		this.el = this.init(label);
		this.rows = this.initRows();
	};

	/**
	 * Initialize the DOM elements, returning the container element.
	 * @param {string} label Display label for panel heading.
	 */
	InfoPropertiesPanel.prototype.init = function (label) {
		var el = document.createElement("div");
		el.className = "infoPropertiesPanel";
		el.innerHTML = [
			`<h1>${label}</h1>`,
			'<table><tbody></tbody></table>',
		].join("");
		return el;
	};

	/**
	 * Create the controls for the source's user properties.
	 */
	InfoPropertiesPanel.prototype.initRows = function () {
		var source = this.source,
			variablesGetter = this.variablesGetter,
			tbody = this.el.querySelector("tbody"),
			onPropertyChange = this.onPropertyChange.bind(this);
		return this.source.userProperties()
			.map(function (prop) {
				return new LaserCanvas.InputPropertyRow(prop, source, variablesGetter, onPropertyChange)
					.appendTo(tbody);
			});
	};

	/**
	 * Trigger the child components to update.
	 */
	InfoPropertiesPanel.prototype.update = function () {
		for (var row of this.rows) {
			row.update();
		}
	};

	// --------------
	//  Custom rows.
	// --------------

	/**
	 * Attach a custom row, perhaps read-only ABCD value.
	 * @param {string} propertyName Name by which to key the new control.
	 * @param {modePlane|string} plane Mode plane or key for auto-updating sources.
	 */
	InfoPropertiesPanel.prototype.addAbcdPropertyRow = function (propertyName, plane) {
		this.rows.push(new LaserCanvas.AbcdPropertyRow(propertyName, plane, this.source)
			.appendTo(this.el.querySelector("tbody")));
	};

	/** Add a sag/tan custom row, perhaps mode size. */
	InfoPropertiesPanel.prototype.addAbcdQPropertyRow = function (propertyName, fieldName) {
		this.rows.push(new LaserCanvas.AbcdQPropertyRow(propertyName, fieldName, this.source)
			.appendTo(this.el.querySelector("tbody")));
	};

	// -------------------
	//  DOM manipulation.
	// -------------------

	/**
	 * Attach the panel DOM to the parent element.
	 * @param {HTMLElement} parent Parent element where to attach the component.
	 */
	InfoPropertiesPanel.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	/** Remove the component from the DOM. */
	InfoPropertiesPanel.prototype.remove = function () {
		if (this.el.parentElement) {
			this.el.parentElement.removeChild(this.el);
		}
	};

	// ---------
	//  Events.
	// ---------

	/** Handle a notified change in an input property. */
	InfoPropertiesPanel.prototype.onPropertyChange = function (propertyName, value) {
		if (typeof this.source.set === "function") {
			this.source.set(propertyName, value);
		} else {
console.warn(`InfoPropertiesPanel.onPropertyChange ${propertyName}=${value} using legacy property() call`);
			this.source.property(propertyName, value);
		}
	};

	LaserCanvas.InfoPropertiesPanel = InfoPropertiesPanel;
}(window.LaserCanvas));