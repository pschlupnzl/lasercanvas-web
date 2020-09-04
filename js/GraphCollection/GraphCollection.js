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

	/** Prepare the collection. */
	GraphCollection.prototype.init = function () {
		var el = document.createElement("div");
		el.className = "graphCollection";
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
			return graph.variableName === variableName;
		});
	};

	/** Iterate over graphs corresponding to the variable name. */
	GraphCollection.prototype.graphsForVariable = function (variableName, callback) {
		this.graphs.forEach(function (graph) {
			if (graph.variableName === variableName) {
				callback.call(this, graph);
			}
		}.bind(this));
	};

	/** Prepare for a new variable scan by clearing any data lines. */
	GraphCollection.prototype.scanStart = function (variableName) {
		this.graphsForVariable(variableName, function (graph) {
			graph.graph2d.clearDataPoints();
		});
	};

	/** Add a scanning variable data point. */
	GraphCollection.prototype.scanValue = function (variableName, variableValue) {
		this.graphsForVariable(variableName, function (graph) {
			graph.graph2d.addDataPoints(this.getGraphValue(variableValue, graph))
		});
	};

	/** Complete a variable scan and update the graphs. */
	GraphCollection.prototype.scanEnd = function (variableName) {
		this.graphsForVariable(variableName, function (graph) {
			graph.graph2d.calcTicks();
			graph.graph2d.render();
		});
	};

	/** One of the graph's variable dependencies has changed. */
	GraphCollection.prototype.onVariableChange = function () {
console.log('variablechange')
		this.fireEvent("change");
	};

	// -------------------
	//  Graph management.
	// -------------------

	/**
	 * Add a new graph for the given element and property.
	 * @param {System|Element} source Data source.
	 * @param {string} propertyName Name of property on the data source.
	 * @param {string=} fieldName Optional field for ABCD/Q type properties.
	 */
	GraphCollection.prototype.toggleGraph = function (source, propertyName, fieldName) {
		if (!this.removeGraph(source, propertyName, fieldName)) {
			var el = this.createGraphContainer(),
				graph = {
					el: el,
					variableInput: el.querySelector('.variable input[type="checkbox"]'),
					source: source,
					propertyName: propertyName,
					fieldName: fieldName,
					variableName: "x",
					graph2d: new LaserCanvas.Graph2d()
						.appendTo(el.querySelector(".graph2dContainer"))
				};
			el.querySelector(".title").innerText = this.getTitle(graph);
			// TODO: Refactor to make GraphItem.
			graph.variableInput.onchange = (function (self) {
				return function () {
					graph.variableName = this.checked ? "y" : "x";
					self.onVariableChange();
				};
			}(this));
			this.graphs.push(graph);
			this.fireEvent("change");
		}
	};

	/**
	 * Create a container for the graph to sit in.
	 */
	GraphCollection.prototype.createGraphContainer = function () {
		var el = document.createElement("div");
		el.className = "graphCollectionPanel";
		el.innerHTML = [
			'<div class="title"></div>',
			'<div class="graph2dContainer"></div>',
			'<div class="variable">',
			'<span>x</span>',
			'<input type="checkbox" class="laserCanvasCheckbox" />',
			'<span>y</span>',
		].join("");
		this.el.appendChild(el);
		return el;
	};

	/** Remove a graph, if found, returning a value indicating whether a graph was deleted. */
	GraphCollection.prototype.removeGraph = function (source, propertyName, fieldName) {
		var graph,
			deleted = false;
		for (var index = this.graphs.length - 1; index >= 0; index -= 1) {
			graph = this.graphs[index];
			if (graph.source === source
				&& graph.propertyName === propertyName
				&& graph.fieldName === fieldName) {
				this.removeGraphAt(index);
				deleted = true;
			}
		}
		return deleted;
	};

	/** Remove the graph at the given collection index. */
	GraphCollection.prototype.removeGraphAt = function (index) {
		var graph = this.graphs[index];
		graph.graph2d.destroy();
		graph.el.parentElement.removeChild(graph.el);
		this.graphs.splice(index, 1);
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
			graph = this.graphs[index];
			if (!elements.find(function (element) { return element === graph.source; })) {
				this.removeGraphAt(index);
			}
		}
		return this;
	};

	/** Returns a title for the graphed property. */
	GraphCollection.prototype.getTitle = function (graph) {
		var source = graph.source.name,
			property = LaserCanvas.Utilities.prettify(graph.propertyName);
		return source
			? `${source}: ${property}`
			: property;
	};

	/** Returns the property value for the graph. */
	GraphCollection.prototype.getGraphValue = function (variableValue, graph) {
		var value;
		if (graph.fieldName) {
			return [{
				x: variableValue,
				y: graph.source.abcdQ[0][graph.fieldName]
			}, {
				x: variableValue,
				y: graph.source.abcdQ[1][graph.fieldName]
			}];
		} else {
			value = graph.source.get(graph.propertyName);
			if (Array.isArray(value)) {
				return value.map(function (val) {
					return {
						x: variableValue,
						y: val
					};
				});
			} else {
console.warn(`getGraphValue is NOT an array ${graph.variableName}`)
				return [{
					x: variableValue,
					y: value
				}];
			}
		}
	};

	LaserCanvas.GraphCollection = GraphCollection;
}(window.LaserCanvas));
