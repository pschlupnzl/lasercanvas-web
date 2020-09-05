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
				'<li>You can use variables <em>x</em> and <em>y</em> in properties, for example <input disabled value="200 * cos(x)" /></li>',
				'<li>Drag the sliders to see the effects of changing variables</li>',
				'<li>Toggle the <span>👁</span> icon in the Info panel to plot a property\'s behaviour with varying values</li>',
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
			return graph.variableName() === variableName;
		});
	};

	/** Prepare for a new variable scan by clearing any data lines. */
	GraphCollection.prototype.scanStart = function (variableName) {
		this.graphs.forEach(function (graph) {
			graph.scanStart(variableName);
		});
	};

	/** Add a scanning variable data point. */
	GraphCollection.prototype.scanValue = function (variableName, variableValue) {
		this.graphs.forEach(function (graph) {
			graph.scanValue(variableName, variableValue);
		});
	};

	/** Complete a variable scan and update the graphs. */
	GraphCollection.prototype.scanEnd = function (variableName, currentValue) {
		this.graphs.forEach(function (graph) {
			graph.scanEnd(variableName, currentValue);
		});
	};

	/** One of the graph's variable dependencies has changed. */
	GraphCollection.prototype.onVariableChange = function () {
		this.fireEvent("change");
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
	 * Add a new graph for the given element and property.
	 * @param {System|Element} source Data source.
	 * @param {string} propertyName Name of property on the data source.
	 * @param {string=} fieldName Optional field for ABCD/Q type properties.
	 */
	GraphCollection.prototype.toggleGraph = function (source, propertyName, fieldName) {
		var index = this.graphIndex(source, propertyName, fieldName);
		if (index >= 0) {
			this.removeGraphAt(index);
		} else {
			this.graphs.push(
				new LaserCanvas.GraphItem(source, propertyName, fieldName)
				.appendTo(this.el.querySelector(".graphItems"))
				.addEventListener("variableChange", this.onVariableChange.bind(this)));
			this.fireEvent("change");
		}
		this.el.setAttribute("data-has-graphs", this.graphs.length ? "true" : "false");
	};

	/** Remove the graph at the given collection index. */
	GraphCollection.prototype.removeGraphAt = function (index) {
		this.graphs[index].destroy();
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
			graph =  this.graphs[index];
			if (!elements.find(function (element) { return element === graph.source(); })) {
				this.removeGraphAt(index);
			}
		}
		return this;
	};

	LaserCanvas.GraphCollection = GraphCollection;
}(window.LaserCanvas));
