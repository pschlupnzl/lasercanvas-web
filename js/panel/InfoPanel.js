/**
* Information panel about whole system.
* @param {HTMLDivElement} info Where to write information.
*/
(function (LaserCanvas) {
	var InfoPanel = function (info) {
		this.system = null; // {System} Reference to system, set in init().
		this.render = null; // {Render} Reference to renderer, set in init().
		this.variablesGetter = null; // {function|null} Method to retrieve variable values.
		this.toggleGraph = null; // {function|null} Callback to create or remove a graph.
		this.info = info; // {HTMLDivElement} Information panel.
	};


	/**
	 * Initialize references to system and render.
	 * @param {System} system Reference to system.
	 * @param {Render} render Reference to renderer.
	 * @param {function} variablesGetter Function used to retrieve current variable values.
	 * @param {function} toggleGraph Callback to display or remove a property graph.
	 */
	InfoPanel.prototype.init = function (system, render, variablesGetter, toggleGraph) {
		this.system = system;
		this.render = render;
		this.variablesGetter = variablesGetter;
		this.toggleGraph = toggleGraph;
		this.systemPropertiesPanel = null;
		this.elementPropertiesPanels = [];
		return this;
	};

	/**
	* The components of the system have changed.
	* @return {object:InfoPanel} This object for chaining.
	*/
	InfoPanel.prototype.change = function () {
		var variablesGetter = this.variablesGetter,
			toggleGraph = this.toggleGraph,
			panelSystem = this.info.querySelector(".systems"),
			panelElements = this.info.querySelector(".elements"),
			system = this.system,
			render = this.render,
			onElementEnter = function (e, source) {
				render.highlightElement(source);
			},
			onElementLeave = function (e, source) {
				render.highlightElement(null);
			},
			onChange = function () {
				system.update(true);
			};

		// System panel.
		if (this.systemPropertiesPanel) {
			this.systemPropertiesPanel.remove();
		}
		this.systemPropertiesPanel = new LaserCanvas.InfoPropertiesPanel(this.system.get("name"), this.system, variablesGetter, toggleGraph)
			.appendTo(panelSystem);
		this.systemPropertiesPanel.addAbcdPropertyRow("abcdSag", "sag");
		this.systemPropertiesPanel.addAbcdPropertyRow("abcdTan", "tan");
		
		// Element panels.
		while (this.elementPropertiesPanels.length > 0) {
			this.elementPropertiesPanels.pop().remove();
		}
		this.elementPropertiesPanels = this.system.elements().map(function (element) {
			var panel = new LaserCanvas.InfoPropertiesPanel(element.name, element, variablesGetter, toggleGraph)
				.addEventListener("mouseenter", onElementEnter)
				.addEventListener("mouseleave", onElementLeave)
				.addEventListener("change", onChange)
				.appendTo(panelElements);
			panel.addAbcdQPropertyRow("modeSize", "w");
			panel.addAbcdQPropertyRow("distanceToWaist", "z0");
			panel.addAbcdQPropertyRow("wavefrontROC", "r");
			panel.addAbcdQPropertyRow("waistSize", "w0");
			panel.addAbcdQPropertyRow("rayleighLength", "zR");
			panel.addAbcdPropertyRow("abcdSag", LaserCanvas.Enum.modePlane.sagittal);
			panel.addAbcdPropertyRow("abcdTan", LaserCanvas.Enum.modePlane.tangential);
			return panel;
		});
		return this;
	};
	
	/**
	* An element within the system has had a property
	* updated, or an element has moved.
	* @return {object:InfoPanel} This object for chaining.
	*/
	InfoPanel.prototype.update = function () {
		this.systemPropertiesPanel.update();
		this.elementPropertiesPanels.forEach(function (panel) {
			panel.update();
		});
		return this;
	};

	/**
	 * Update the graph icons (and perhaps other detailed information.)
	 * @param {GraphCollection} graphCollection Collection whose graph status to match to.
	 */
	InfoPanel.prototype.updateGraphs = function (graphCollection) {
		this.systemPropertiesPanel.updateGraphs(graphCollection);
		this.elementPropertiesPanels.forEach(function (panel) {
			panel.updateGraphs(graphCollection);
		});
	};

	/**
	 * Highlights the given element.
	 * @param {Element} element Element to highlight.
	 */
	InfoPanel.prototype.highlightElement = function (element) {
		var elements = this.system.elements();
		this.elementPropertiesPanels.forEach(function (panel, index) {
			panel.setHighlight(element === elements[index]);
		});
	};

	LaserCanvas.InfoPanel = InfoPanel;
}(window.LaserCanvas));
