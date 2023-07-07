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
		this._lines = {}; // Lines keyed by variable name.
		this._marker = {}; // Marker value (current variable value).

		this.graph2d = new LaserCanvas.Graph2d();
		this.el = this.init();
		this.variableInput = this.el.querySelector('.variable input[type="checkbox"]');
		this.variableInput.onchange = this.onVariableChange.bind(this);
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

	/** The variable selector has changed. */
	GraphItem.prototype.onVariableChange = function () {
		this._variableName = this.variableInput.checked ? "y" : "x";
		this.updatePlot();
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

	/**
	 * Returns the property value for the graph.
	 * @returns {number[]}
	 */
	GraphItem.prototype.getGraphValue = function () {
		var value;
		if (this._fieldName) {
			return [
				this._source.abcdQ[0][this._fieldName],
				this._source.abcdQ[1][this._fieldName]
			];
		} else {
			value = this._source.get(this._propertyName);
			return Array.isArray(value) ? value : [value];
		}
	};

	// ------------
	//  Accessors.
	// ------------

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

	// ----------------
	//  Data plotting.
	// ----------------

	/** Prepare for a new variables can by clearing any data lines, if the variable matches. */
	GraphItem.prototype.scanStart = function (variableName) {
		this._lines[variableName] = [];
	};

	/** Add a scanning variable data point, if the variable matches. */
	GraphItem.prototype.scanValue = function (variableName, variableValue) {
		var dataValues = this.getGraphValue(),
			line = this._lines[variableName];
		dataValues.forEach(function (dataValue, lineIndex) {
			if (!line[lineIndex]) {
				line[lineIndex] = { x: [], y: [] };
			}
			line[lineIndex].x.push(variableValue);
			line[lineIndex].y.push(dataValue);
		});
	};

	/** Complete a variable scan and update the graphs, if the variable matches. */
	GraphItem.prototype.scanEnd = function (variableName, currentValue) {
		this._marker[variableName] = currentValue;
		if (variableName === this._variableName) {
			this.updatePlot();
		}
	};

	/**
	 * Returns the extents (ranges) of data across all plotting lines.
	 * @param {string} variableName Name of variable whose data to check.
	 */
	GraphItem.prototype.getDataExtents = function (variableName) {
		var lines = this._lines[variableName],
			extents = {
				x: { min: 0, max: 1, firstPoint: true },
				y: { min: 0, max: 1, firstPoint: true }
			};
		lines.forEach(function (line) {
			var p;
			for (var ax of ["x", "y"]) {
				for (var k = 0; k < line[ax].length; k += 1) {
					p = line[ax][k];
					if (isNaN(p) || !isFinite(p)) {
						// NOP - skip NaN and Infinity.
					} else if (extents[ax].firstPoint) {
						extents[ax].min = extents[ax].max = p;
						delete extents[ax].firstPoint;
					} else {
						extents[ax].min = Math.min(extents[ax].min, p);
						extents[ax].max = Math.max(extents[ax].max, p);
					}
				}
			}
		});
		return extents;
	};

	/**
	 * Update the plot using internal data, e.g. after a scan, or when the
	 * display variable changes.
	 */
	GraphItem.prototype.updatePlot = function () {
		var extents = this.getDataExtents(this._variableName);
		this.graph2d.calcTicks(extents);
		this.graph2d.renderLines(this._lines[this._variableName]);
		this.graph2d.renderVerticalMarker(this._marker[this._variableName]);
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

		this._plane = 0; // Sagittal / tangential plane.
		this._data = []; // 2d surface data for each plane.
		this._subs = 0; // Subdivision size (assume square).

		this._colormap = GraphHeatMapItem.getColormap("ire");
		this._colorRange = [-2, 2];

		this.graph = new LaserCanvas.GraphHeatMap();
		this.graph.getValueAt = function (rx, ry) {
			return this._data[this._plane]
				?.[Math.round(ry * this._subs)]
				?.[Math.round(rx * this._subs)];
		}.bind(this);
		this.el = this.init();
		this.planeInput = this.el.querySelector('input[type="checkbox"]');
		this.planeInput.onchange = this.onPlaneChange.bind(this);
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
		el.querySelector('input[type="checkbox"]').checked = this._plane !== 0;
		return el;
	};

	/** The plane toggle has changed. */
	GraphHeatMapItem.prototype.onPlaneChange = function () {
		this._plane = this.planeInput.checked ? 1 : 0;
		this.updatePlot();
	}

	// Copy prototype methods from GraphItem.
	GraphHeatMapItem.prototype.appendTo = GraphItem.prototype.appendTo;
	GraphHeatMapItem.prototype.destroy = GraphItem.prototype.destroy;
	GraphHeatMapItem.prototype.getTitle = GraphItem.prototype.getTitle;
	GraphHeatMapItem.prototype.getGraphValue = GraphItem.prototype.getGraphValue;
	GraphHeatMapItem.prototype.source = GraphItem.prototype.source;
	GraphHeatMapItem.prototype.toJson = GraphItem.prototype.toJson;
	GraphHeatMapItem.prototype.sourceFromJson = GraphItem.prototype.sourceFromJson;
	GraphHeatMapItem.prototype.isEqual = GraphItem.prototype.isEqual;

	// -------------
	//  Accessors.
	// -------------

	/**
	 * Prepare for a new 2d scan.
	 * @param {Range[]} extents Extents for horizontal and vertical axes.
	 */
	GraphHeatMapItem.prototype.scan2dStart = function (extents) {
		this.graph.calcTicks(extents);
		this.graph.fillColormap(this._colormap, this._colorRange);
		this._data = [];
		this._subs = 0;
	};

	/**
	 * Iterate a single patch (pixel) at the given subdivision resolution.
	 * @param {[number, number]} coords Coordinates on plane being scanned.
	 * @param {number} subs Subdivision of plane for current mipmap level.
	 */
	GraphHeatMapItem.prototype.scan2dValue = function (coords, subs) {
		var data = this._data,
			dataValues = this.getGraphValue(),
			row = coords[1],
			col = coords[0];

		// Subdivide up the existing data, if needed.
		this.subdivideData(subs);

		// Store the data.
		dataValues.forEach(function (dataValue, planeIndex) {
			var p = data[planeIndex];
			if (!p) {
				p = data[planeIndex] = [];
			}
			if (!p[row]) {
				p[row] = [];
			}
			p[row][col] = dataValue;
		});

		// Fill as we go.
		this.fillPatch(row, col);
	};

	/**
	 * Subdivide the data, i.e. double up the existing data ready for the next
	 * mipmap level. Assumes that we're going up by a factor of two.
	 * @param {number} subs Subdivision level.
	 */
	GraphHeatMapItem.prototype.subdivideData = function (subs) {
		if (subs > this._subs) {
			if (this._subs && !subs / this._subs === 2) {
				console.warning("GraphHeatMapItem.subdivideData: Subdivision not by 2:", subs / this._subs);
			}
			if (this._subs) {
				this._data.forEach(function (p) {
					// Assume we're doubling the subs.
					for (var rr = this._subs - 1; rr >= 0; rr -= 1) {
						p[2 * rr] = p[2 * rr] || [];
						p[2 * rr + 1] = p[2 * rr + 1] || [];
						for (var cc = this._subs - 1; cc >= 0; cc -= 1) {
							// Subdivide up the columns.
							p[2 * rr + 0][2 * cc + 0] = 
							p[2 * rr + 0][2 * cc + 1] =
							p[2 * rr + 1][2 * cc + 0] = 
							p[2 * rr + 1][2 * cc + 1] = 
								p[rr][cc];
						}
					}
				}.bind(this));
			};
			this._subs = subs;
		}
	};

	/**
	 * Fill a single patch on the graph.
	 * @param {number} row Row index to fill.
	 * @param {number} col Column index to fill.
	 */
	GraphHeatMapItem.prototype.fillPatch = function (row, col) {
		this.graph.fillPatch(
			this._colormap.rgb(
				this._data[this._plane][row][col],
				this._colorRange),
			row, col, this._subs);
	};

	/**
	 * Update the whole plot.
	 */
	GraphHeatMapItem.prototype.updatePlot = function () {
		for (var row = 0; row < this._subs; row += 1) {
			for (var col = 0; col < this._subs; col += 1) {
				this.fillPatch(row, col);
			}
		}
	};

	LaserCanvas.GraphHeatMapItem = GraphHeatMapItem;
}(window.LaserCanvas));