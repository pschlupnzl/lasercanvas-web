/**
 * Single Graph Collection item containing a 2d graph.
 * @param {System|Element} source Data source.
 * @param {string} propertyName Name of property on the data source.
 * @param {string=} fieldName Optional field for ABCD/Q type properties.
 * @param {string=} variableName Optional variable to plot against, default "x".
 */
(function (LaserCanvas) {
	var GraphItem = function (source, propertyName, fieldName, variableName) {
		this._source = source;
		this._propertyName = propertyName;
		this._fieldName = fieldName;
		this._variableName = variableName || "x";
		this.graph2d = new LaserCanvas.Graph2d();
		this.el = this.init();
		this.variableInput = this.el.querySelector('.variable input[type="checkbox"]');
		this.variableInput.onchange = this.onVariableChange.bind(this);
		this.events = {
			variableChange: []
		};
	};

	/** Template HTML for the item. */
	GraphItem.template = [
		'<div class="title"></div>',
		'<div class="graph2dContainer"></div>',
		'<div class="variable">',
		'<span>x</span>',
		'<input type="checkbox" class="laserCanvasCheckbox" />',
		'<span>y</span>',
	].join("");

	/** Initialize the DOM element. */
	GraphItem.prototype.init = function () {
		var el = document.createElement("div");
		el.className = "graphCollectionPanel";
		el.innerHTML = GraphItem.template;
		this.graph2d.appendTo(el.querySelector(".graph2dContainer"))
		el.querySelector(".title").innerText = this.getTitle();
		el.querySelector("input[type=checkbox]").checked = this._variableName !== "x";
		return el;
	};

	/** Attach to the given DOM parent. */
	GraphItem.prototype.appendTo = function (container) {
		container.appendChild(this.el);
		return this;
	};

	/** Destroy the content and remove the DOM element. */
	GraphItem.prototype.destroy = function () {
		this.el.parentElement.removeChild(this.el);
		return this;
	};

	// ---------
	//  Events.
	// ---------

	/** Add the handler to the given event. */
	GraphItem.prototype.addEventListener = function (eventName, handler) {
		this.events[eventName].push(handler);
		return this;
	};

	/** Fire all event listeners. */
	GraphItem.prototype.fireEvent = function (eventName) {
		this.events[eventName].forEach(function (handler) {
			handler();
		});
	};

	/** The variable selector has changed. */
	GraphItem.prototype.onVariableChange = function () {
		this._variableName = this.variableInput.checked ? "y" : "x";
		this.fireEvent("variableChange");
	};

	// -------------
	//  Properties.
	// -------------

	/** Returns a title for the graphed property. */
	GraphItem.prototype.getTitle = function () {
		var source = this._source.name,
			property = LaserCanvas.Utilities.prettify(this._propertyName);
		return source
			? `${source}: ${property}`
			: property;
	};

	/** Returns the property value for the graph. */
	GraphItem.prototype.getGraphValue = function (variableValue) {
		var value;
		if (this._fieldName) {
			return [{
				x: variableValue,
				y: this._source.abcdQ[0][this._fieldName]
			}, {
				x: variableValue,
				y: this._source.abcdQ[1][this._fieldName]
			}];
		} else {
			value = this._source.get(this._propertyName);
			if (Array.isArray(value)) {
				return value.map(function (val) {
					return {
						x: variableValue,
						y: val
					};
				});
			} else {
				return [{
					x: variableValue,
					y: value
				}];
			}
		}
	};

	// ------------
	//  Accessors.
	// ------------

	/** Returns the current variable dependency. */
	GraphItem.prototype.variableName = function () {
		return this._variableName;
	};

	/** Returns this item's source. */
	GraphItem.prototype.source = function () {
		return this._source;
	};

	/** Returns a serializable representation of the item. */
	GraphItem.prototype.toJson = function () {
		return {
			sourceType: this._source.type,
			sourceName: this._source.name,
			propertyName: this._propertyName,
			fieldName: this._fieldName,
			variableName: this._variableName
		};
	};

	/**
	 * Returns the source corresponding to a previously serialized graph item.
	 * If there are multiple elements of the same type and name, then the first
	 * matching item is returned. If no match is found, returns `undefined`.
	 * @param {object} json Serialized representation of the graph item to create.
	 * @param {System} system Reference to system whose properties to check.
	 * @param {Array<Element>} elements Reference to system's elements.
	 */
	GraphItem.sourceFromJson = function (json, system, elements) {
		if (json.sourceType === "System") {
			return system;
		}
		return elements.find(function (element) {
			return element.type === json.sourceType
				&& element.name === json.sourceName;
		});
	};

	/** Returns a value indicating whether this item matches the properties. */
	GraphItem.prototype.isEqual = function (source, propertyName, fieldName) {
		return source === this._source
			&& propertyName === this._propertyName
			&& (!fieldName || fieldName === this._fieldName);
	};

	// --------------
	//  Passthrough.
	// --------------

	/** Prepare for a new variables can by clearing any data lines, if the variable matches. */
	GraphItem.prototype.scanStart = function (variableName) {
		if (variableName === this._variableName) {
			this.graph2d.clearDataPoints();
		}
	};

	/** Add a scanning variable data point, if the variable matches. */
	GraphItem.prototype.scanValue = function (variableName, variableValue) {
		if (variableName === this._variableName) {
			this.graph2d.addDataPoints(this.getGraphValue(variableValue));
		}
	};

	/** Complete a variable scan and update the graphs, if the variable matches. */
	GraphItem.prototype.scanEnd = function (variableName, currentValue) {
		if (variableName === this._variableName) {
			this.graph2d.calcTicks();
			this.graph2d.createVerticalMarker(currentValue);
			this.graph2d.render();
		}
	};

	LaserCanvas.GraphItem = GraphItem;
}(window.LaserCanvas));
