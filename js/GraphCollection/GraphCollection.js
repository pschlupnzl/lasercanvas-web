/**
 * Collection handler for property graphs.
 */
(function (LaserCanvas) {
	/**
	 * Initialize a new instance of the GraphCollection class.
	 */
	var GraphCollection = function () {
		this.graphs = [];
		this.el = this.init(); // {HTMLElement} DOM element where to attach graphs.
		this.events = {
			/** A graph is added or a variable dependency is changed. */
			change: []
		};
	};

	GraphCollection.template = [
		'<div class="about">',
			'<ul>',
				'<li>Variables  <em>x</em>, <em>y</em> in properties: <input class="demoPropertyInput" disabled data-expression="true" value="200 * cos(x)" /></li>',
				'<li>Sliders change values</li>',
				'<li>Toggle graphs with <span>&#x1f4ca;</span> in information panel</li>',
			'</ul>',
		'</div>',
		'<vid class="graphItems"></div>'
	].join("");

	/** Prepare the collection. */
	GraphCollection.prototype.init = function () {
		var el = document.createElement("div");
		el.className = "graphCollection";
		el.innerHTML = GraphCollection.template;
		return el;
	};

	/** Append the collection to the given DOM container. */
	GraphCollection.prototype.appendTo = function (container) {
		container.appendChild(this.el);
		return this;
	};

	/** Add the handler to the change event. */
	GraphCollection.prototype.addEventListener = function (eventName, handler) {
		this.events[eventName].push(handler);
	};

	/** Trigger event listeners to fire. */
	GraphCollection.prototype.fireEvent = function (eventName) {
		this.events[eventName].forEach(function (handler) {
			handler();
		});
	};

	// ---------------------
	//  Scanning variables.
	// ---------------------

	/** Returns a value indicating whether any graphs depend on the variable. */
	GraphCollection.prototype.hasRange = function (variableName) {
		return this.graphs.some(function (graph) { 
			return !!graph.scanStart;
		});
	};

	/** Prepare for a new variable scan by clearing any data lines. */
	GraphCollection.prototype.scanStart = function (variableName) {
		this.graphs.forEach(function (graph) {
			graph.scanStart && graph.scanStart(variableName);
		});
	};

	/** Add a scanning variable data point. */
	GraphCollection.prototype.scanValue = function (variableName, variableValue) {
		this.graphs.forEach(function (graph) {
			graph.scanValue && graph.scanValue(variableName, variableValue);
		});
	};

	/** Complete a variable scan and update the graphs. */
	GraphCollection.prototype.scanEnd = function (variableName, currentValue) {
		this.graphs.forEach(function (graph) {
			graph.scanEnd && graph.scanEnd(variableName, currentValue);
		});
	};

	// -----------
	//  2d Scans.
	// -----------

	/** Returns a value indicating whether any graphs use 2d scan (e.g. heat map). */
	GraphCollection.prototype.has2dRange = function () {
		return this.graphs.some(function (graph) {
			return !!graph.scan2dStart;
		})
	};

	/** Start a new 2d scan. */
	GraphCollection.prototype.scan2dStart = function (extents) {
		this.graphs.forEach(function (graph) {
			graph.scan2dStart && graph.scan2dStart(extents);
		})
	};

	/**
	 * Iterate a single patch (pixel) at the given subdivision resolution.
	 * @param {[number, number]} coords Coordinates on plane being scanned.
	 * @param {number} subs Subdivision of plane for current mipmap level.
	 */
	GraphCollection.prototype.scan2dValue = function (coords, subs) {
		this.graphs.forEach(function (graph) {
			graph.scan2dValue && graph.scan2dValue(coords, subs);
		})
	};

	// -------------------
	//  Graph management.
	// -------------------

	/** Returns the (zero-based) index of the graph, or -1 if not matched. */
	GraphCollection.prototype.graphIndex = function (source, propertyName, fieldName) {
		return this.graphs.findIndex(function (graph) {
			return graph.isEqual(source, propertyName, fieldName);
		});
	};

	/**
	 * Returns a value indicating whether the collection has a graph for the given
	 * source.
	 * @param {System|Element} source Data source.
	 * @param {string} propertyName Name of property on the data source.
	 * @param {string=} fieldName Optional field for ABCD/Q type properties.
	 */
	GraphCollection.prototype.hasGraph = function (source, propertyName, fieldName) {
		return this.graphIndex(source, propertyName, fieldName) >= 0;
	};

	/**
	 * Add a new graph for the given element and property or remove it if it exists.
	 * @param {System|Element} source Data source.
	 * @param {string} propertyName Name of property on the data source.
	 * @param {string=} fieldName Optional field for ABCD/Q type properties.
	 */
	GraphCollection.prototype.toggleGraph = function (source, propertyName, fieldName) {
		var index = this.graphIndex(source, propertyName, fieldName);
		if (index >= 0) {
			this.removeGraphAt(index);
		} else {
			this.addGraph(source, propertyName, fieldName);
		}
	};

	/**
	 * Add a new graph for the given element and property.
	 * @param {System|Element} source Data source.
	 * @param {string} propertyName Name of property on the data source.
	 * @param {string=} fieldName Optional field for ABCD/Q type properties.
	 * @param {string=} variableName Optional variable to plot against, default "x".
	 */
	GraphCollection.prototype.addGraph = function (source, propertyName, fieldName, variableName) {
		var Item = 
			["System.stability"].includes(source.type + "." + propertyName)
			? LaserCanvas.GraphHeatMapItem
			: LaserCanvas.GraphItem
		this.graphs.push(
			new Item(source, propertyName, fieldName, variableName)
			.appendTo(this.el.querySelector(".graphItems")));
		this.fireEvent("change");
		this.el.setAttribute("data-has-graphs", this.graphs.length ? "true" : "false");
	};

	/** Remove the graph at the given collection index. */
	GraphCollection.prototype.removeGraphAt = function (index) {
		this.graphs[index].destroy();
		this.graphs.splice(index, 1);
		this.el.setAttribute("data-has-graphs", this.graphs.length ? "true" : "false");
	};

	/** Remove all current graphs. */
	GraphCollection.prototype.removeAllGraphs = function () {
		for (var index = this.graphs.length - 1; index >= 0; index -= 1) {
			this.removeGraphAt(index);
		}
	};

	// ----------------
	//  Serialization.
	// ----------------

	/**
	 * Returns a serializable representation of the collection of graphs. We store
	 * references to the source by a type and name.
	 */
	GraphCollection.prototype.toJson = function () {
		return this.graphs.map(function (graph) {
			return graph.toJson();
		});
	};

	/**
	 * Recreates graph panels and links them to the system and elements.
	 * @param {object} json Serialized representation of graphs to create.
	 * @param {System} system Reference to system to be used for system graphs.
	 * @param {Array<Element>} elements Reference to system's elements for element graphs.
	 */
	GraphCollection.prototype.fromJson = function (json, system, elements) {
		var source;
		this.removeAllGraphs();
		for (var graphJson of json || []) {
			source = LaserCanvas.GraphItem.sourceFromJson(graphJson, system, elements);
			if (source) {
				this.addGraph(source, graphJson.propertyName, graphJson.fieldName, graphJson.variableName);
			}
		};
	};

	// ---------
	//  Events.
	// ---------

	/**
	 * The system has changed: Ensure all our references are still valid.
	 * Each graph is checked against the system and those that refer to
	 * elements no longer in the system are removed.
	 * @param {Array<Element>} elements List of elements still in the system.
	 */
	GraphCollection.prototype.change = function (elements) {
		var graph;
		for (var index = this.graphs.length - 1; index >= 0; index -= 1) {
			graph =  this.graphs[index];
			if (!elements.find(function (element) { return element === graph.source(); })) {
				this.removeGraphAt(index);
			}
		}
		return this;
	};

	LaserCanvas.GraphCollection = GraphCollection;
}(window.LaserCanvas));
