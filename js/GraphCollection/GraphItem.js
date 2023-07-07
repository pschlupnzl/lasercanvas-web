/**
 * Single Graph Collection item containing a line graph of a property value
 * against either "x" or "y" variable.
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
		'</div>'
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

	/**
	 * Returns the current variable dependency.
	 * @returns {string[]}
	 */
	GraphItem.prototype.variableNames = function () {
		return [this._variableName];
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


// =======================================================
//  Graph2d Item.
// =======================================================
(function (LaserCanvas) {
	/** Reference to {@link GraphItem} - much of the code is the same. */
	const GraphItem = LaserCanvas.GraphItem;

	/**
	 * Single Graph Collection item containing a 2d heatmap graph, suitable e.g.
	 * for plotting the cavity stability.
	 * Broadly matches the {@link GraphItem} interface.
	 * @param {System|Element} source Data source.
	 * @param {string} propertyName Name of property on the data source.
	 * @param {string=} fieldName Optional field for ABCD/Q type properties.
	 */
	var GraphHeatMapItem = function (source, propertyName, fieldName) {
		this._source = source;
		this._propertyName = propertyName;
		this._fieldName = fieldName;

		this._colormap = GraphHeatMapItem.getColormap("ire");
		this._colorRange = [-2, 2];
		this._plane = LaserCanvas.Enum.modePlane.sagittal;

		this.graph = new LaserCanvas.GraphHeatMap();
		this.el = this.init();
		this.events = {
			variableChange: []
		};
	};

	/** Template HTML for the item. */
	GraphHeatMapItem.template = [
		'<div class="title"></div>',
		'<div class="graph2dContainer"></div>',
		'<div class="variable">',
		'<span class="noPlaneAnnotation" color-theme-plane="sag"><em>S</em></span>',
		'<input type="checkbox" class="laserCanvasCheckbox" />',
		'<span class="noPlaneAnnotation" color-theme-plane="tan"><em>T</em></span>',
 		'</div>'
	].join("");

	/** Get a color map by its name, creating it if needed. */
	GraphHeatMapItem.getColormap = (function () {
		var maps = {};
		return function (name) {
			if (!maps[name]) {
				maps[name] = new LaserCanvas.Colormap(name, 256);
			}
			return maps[name];
		};
	}());

	/** Initialize the DOM element. */
	GraphHeatMapItem.prototype.init = function () {
		// TODO: We may need separate CSS class names.
		var el = document.createElement("div");
		el.className = "graphCollectionPanel"; 
		el.innerHTML = GraphHeatMapItem.template;
		this.graph.appendTo(el.querySelector(".graph2dContainer"));
		el.querySelector(".title").innerText = this.getTitle();
		el.querySelector('input[type="checkbox"]').checked = 
			this._plane !== LaserCanvas.Enum.modePlane.sagittal;
		return el;
	};

	// Copy prototype methods from GraphItem.
	GraphHeatMapItem.prototype.appendTo = GraphItem.prototype.appendTo;
	GraphHeatMapItem.prototype.destroy = GraphItem.prototype.destroy;
	GraphHeatMapItem.prototype.addEventListener = GraphItem.prototype.addEventListener;
	GraphHeatMapItem.prototype.fireEvent = GraphItem.prototype.fireEvent;
	GraphHeatMapItem.prototype.getTitle = GraphItem.prototype.getTitle;
	GraphHeatMapItem.prototype.source = GraphItem.prototype.source;
	GraphHeatMapItem.prototype.toJson = GraphItem.prototype.toJson;
	GraphHeatMapItem.prototype.sourceFromJson = GraphItem.prototype.sourceFromJson;
	GraphHeatMapItem.prototype.isEqual = GraphItem.prototype.isEqual;
	

	/** Returns the property value for the graph. */
	GraphHeatMapItem.prototype.getGraphValue = function () {
		var value,
			index = this._plane === LaserCanvas.Enum.modePlane.sagittal ? 0 : 1;
		if (this._fieldName) {
			return this._source.abcdQ[index][this._fieldName];
		} else {
			value = this._source.get(this._propertyName);
			if (Array.isArray(value)) {
				return value[index];
			} else {
				return value;
			}
		}
	};


	// -------------
	//  Accessors.
	// -------------

	/**
	 * Returns the current variable dependency.
	 * @returns {string[]}
	 */
	GraphHeatMapItem.prototype.variableNames = function () {
		return [];
	};

	/**
	 * Prepare for a new 2d scan.
	 * @param {Range[]} extents Extents for horizontal and vertical axes.
	 */
	GraphHeatMapItem.prototype.scan2dStart = function (extents) {
		this.graph.calcTicks(extents);
		this.graph.fillColormap(this._colormap, this._colorRange);
	};

	/**
	 * Iterate a single patch (pixel) at the given subdivision resolution.
	 * @param {[number, number]} coords Coordinates on plane being scanned.
	 * @param {number} subs Subdivision of plane for current mipmap level.
	 */
	GraphHeatMapItem.prototype.scan2dValue = function (coords, subs) {
		var value = this.getGraphValue(),
			fillStyle = this._colormap.rgb(value, this._colorRange);
		this.graph.fillPatch(fillStyle, coords, subs);
	};
	LaserCanvas.GraphHeatMapItem = GraphHeatMapItem;
}(window.LaserCanvas));