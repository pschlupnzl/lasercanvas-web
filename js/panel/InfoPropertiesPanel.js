/**
 * Controls to manipulate system properties.
 */
(function (LaserCanvas) {
	/**
	 * Initialize a new information panel to manipulate system properties.
	 * @param {System} system Reference to system to manipulate.
	 * @param {function} variablesGetter Callback to retrieve current variable values.
	 */
	var InfoPropertiesPanel = function (source, variablesGetter) {
		this.source = source;
		this.variablesGetter = variablesGetter;
		this.el = this.init();
		this.controls = this.initControls();
	};

	/**
	 * Initialize the DOM elements, returning the container element.
	 */
	InfoPropertiesPanel.prototype.init = function () {
		var el = document.createElement("div");
		el.innerHTML = [
			'<h1>Info Properties Panel</h1>',
			'<table><tbody></tbody></table>',
		].join("");
		return el;
	};

	/**
	 * Create the controls for the source's user properties.
	 */
	InfoPropertiesPanel.prototype.initControls = function () {
		var source = this.source,
			variablesGetter = this.variablesGetter,
			tbody = this.el.querySelector("tbody");
		return this.source.userProperties()
			.map(function (prop) {
				return new LaserCanvas.InputPropertyRow(prop, source, variablesGetter)
					.appendTo(tbody);
			});
	};

	// /** Create a single non-interactive unary value row. */
	// InfoPropertiesPanel.prototype.initUnaryProperty = function (propertyName, source) {
	// 	var tr = document.createElement("tr");
	// 	tr.innerHTML = InfoPropertiesPanel.unary;
	// 	tr.querySelector('[data-cell="label"]').innerText = prettify(prop);
	// };

	/**
	 * Trigger the child components to update.
	 */
	InfoPropertiesPanel.prototype.update = function () {
		for (var control of this.controls) {
			control.update();
		}
	};

	/**
	 * Attach the panel DOM to the parent element.
	 * @param {HTMLElement} parent Parent element where to attach the component.
	 */
	InfoPropertiesPanel.prototype.appendTo = function (parent) {
		parent.appendChild(this.el);
		return this;
	};

	LaserCanvas.InfoPropertiesPanel = InfoPropertiesPanel;
}(window.LaserCanvas));