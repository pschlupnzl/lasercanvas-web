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
			this.graphs.push({
				source: source,
				propertyName: propertyName,
				fieldName: fieldName,
				el: (function (parent) {
					var el = document.createElement("div");
					el.innerText = `Graph ${source.name} ${propertyName} ${fieldName}`;
					parent.appendChild(el);
					return el;
				}(this.el))
			});
		}
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

	/** The system has been updated (e.g. drag, prop change): Update the graphs. */
	GraphCollection.prototype.update = function () {
		this.graphs.forEach(function (graph) {
			var value;
			if (graph.fieldName) {
				value = [
					graph.source.abcdQ[0][graph.fieldName],
					graph.source.abcdQ[1][graph.fieldName]
				];
			} else {
				value = graph.source.get(graph.propertyName);
			}
			graph.el.innerText = value.map(function (val) { return LaserCanvas.Utilities.numberFormat(val)});
		});
	};

	LaserCanvas.GraphCollection = GraphCollection;
}(window.LaserCanvas));
