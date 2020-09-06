/**
* LaserCanvas - Screen element for inspecting the beam.
*/
(function (LaserCanvas) {
LaserCanvas.Element.Screen = function (variablesGetter) {
	this.type = "Screen"; // {string} Primitive element type.
	this.name = 'I';      // {string} Name of this element (updated by System).
	this.variablesGetter = variablesGetter; // {function} Used to retrieve variable values.
	this.loc = {          // Location on canvas.
		x: 0,              // {number} (mm) Horizontal location of element.
		y: 0,              // {number} (mm) Vertical location of element.
		p: 0,              // {number} (rad) Rotation angle of incoming axis.
		q: 0               // {number} (rad) Rotation angle of outgoing axis.
	};
	this.prop = {
		distanceToNext: new LaserCanvas.Equation(0)  // {number} (mm) Distance to next element.
	};
	this.priv = {
		startOptic: false, // {boolean} Value indicating whether this is the first element (e.g. propagation system).
		endOptic: false,   // {boolean} Value indicating whether this is the final element (e.g. propagation system).
	};
	this.panel = null;    // {HTMLDivElement?} Information panel.
	this.showProperties = false; // {boolean} Value indicating whether this can show properties window. FALSE to suppress.
	this.abcdQ = {};      // {object<object>} ABCD propagation coefficient after this optic.
};

/** Element type name to identify screen element. */
LaserCanvas.Element.Screen.Type = "Screen";

LaserCanvas.Element.Screen.prototype = {
	/** Return a serializable representation of this object. */
	toJson: function () {
		return {
			type: this.type,
			name: this.name,
			loc: LaserCanvas.Utilities.extend({}, this.loc),
			prop: LaserCanvas.Utilities.extend({}, this.prop)
		};
	},

	/** Load a serialized representation of this object. */
	fromJson: function (json) {
		this.name = json.name;
		LaserCanvas.Utilities.extend(this.loc, json.loc);
		for (var propertyName in this.prop) {
			if (this.prop.hasOwnProperty(propertyName)) {
				this.prop[propertyName] = new LaserCanvas.Equation(json.prop[propertyName]);
			}
		}
	},

	// ----------------------------------------------------
	//  Information panel.
	// ----------------------------------------------------
	
	/**
	* Initializer once properties have been set.
	* @param {System} Parent system - for deleting element.
	*/
	init: function (system) {
		this.panel = this.createPanel(system);
	},
	
	/**
	* Update the name of this element.
	* @param {string} name New name to set.
	*/
	setName: function (name) {
		// TODO: Remove this and call at System.js@525
		// The readout panel should belong to Render, not the element.
		if (this.panel) {
			this.name = this.panel.querySelector('h1').innerHTML = name;
		}
	},
	
	/**
	* Create the information panel.
	* For a propagation starting screen, the panel exists button
	* is not attached to the DOM. For ending screen, the delete
	* button is removed.
	* @param {System} Parent system - for deleting element.
	* @returns {HTMLDivElement} The created panel.
	*/
	createPanel: function (system) {
		var self = this,
			el,
			panel = document.createElement('div');
		panel.className = 'elementScreenPanel';
		panel.setAttribute('data-compact-view', 'true');
		panel.innerHTML = LaserCanvas.Element.Screen.panelHtml;
		
		panel.querySelector('button[data-action="compact"]').onclick = function () {
			panel.setAttribute('data-compact-view', panel.getAttribute('data-compact-view') !== 'true');
		};
		
		el = panel.querySelector('button[data-action="delete"]');
		if (this.priv.endOptic) {
			el.parentNode.removeChild(el);
		} else {
			el.onclick = function () {
				system.removeElement(self);
			};
		}
		
		if (!this.priv.startOptic) {
			document.body.appendChild(panel);
			LaserCanvas.localize(panel);
			LaserCanvas.Utilities.draggable(panel, {
				handle: panel.querySelector('.dragbar')
			});
		}
		return panel;
	},
	
	// ----------------------------------------------------
	//  Coordinates and properties.
	// ----------------------------------------------------

	/**
	* Gets or sets the location for this element.
	* @param {object} ax When setting, the incoming axis and Cartesian coordinates for the element.
	* @returns {object} The element location object.
	*/
	location: function (ax) {
		if (ax) {
			this.loc.x = ax.x;
			this.loc.y = ax.y;
			this.loc.q = this.loc.p = ax.q; // {number} (rad) Incoming axis.
		}
		return LaserCanvas.clone(this.loc);
	},
	
	/**
	* Return ordered array of user-settable properties.
	* @returns {Array<object>} Array of property keys.
	*/
	userProperties: function () {
		return [{
			propertyName: 'distanceToNext',
			increment: 5,
			min: 0
		}];
	},
	
	/**
	* Gets a value indicating whether this element can adjust transfer properties.
	* @param {string} propertyName Name of property being probed 'distanceToNext'|'deflectionAngle'.
	*/
	canSetProperty: function (propertyName) {
		return {
			distanceToNext: !this.priv.endOptic,
			insertElement: true,
			outgoingAngle: this.priv.startOptic || this.priv.endOptic // Propagation system ends.
		}[propertyName] || false;
	},
	
	/**
	 * Sets a user property to a new value.
	 * @param {string} propertyName Name of property to set.
	 * @param {number|string} newValue New value to set to, which may be an equation.
	 * @param {boolean=} arg Optional, e.g. value indicating whether this is the first element.
	 */
	set: function (propertyName, newValue, arg) {
		switch (propertyName) {
			case "outgoingAngle":
				// newValue {number} (rad) New outgoing angle on canvas.
				// arg {boolean} Value indicating whether this is first element in cavity.
				if (arg) {
					this.loc.q = newValue;
				}
				break;

			case "startOptic":
			case "endOptic":
				this.priv[propertyName] = newValue;
				break;

			case "distanceToNext":
				this.prop[propertyName].set(newValue);
				break;
		}
	},

	/**
	 * Returns a user property value.
	 */
	get: function (propertyName) {
		var variables = this.variablesGetter();
		switch (propertyName) {
			case "startOptic":
			case "endOptic":
				return this.prop[propertyName];
			case "distanceToNext":
				return this.prop[propertyName].value(variables);
		}
	},

	/** Returns a property's source equation. */
	expression: function (propertyName) {
		return this.prop[propertyName].expression();
	},

	/**
	* Return the ABCD matrix for this element.
	* @param {number} dir Direction -1:backwards|+1:forwards
	* @param {number.Enum:modePlane} plane Sagittal or tangential plane.
	* @returns {Matrix2x} Transfer matrix.
	*/
	elementAbcd: function (dir, plane) {
		return new LaserCanvas.Math.Matrix2x2.eye();
	},
	
	/**
	* Set this element propagation parameters.
	* @param {object} abcdQ Propagation parameters to set.
	* @param {number:ModePlane} plane Plane for which to set.
	*/
	updateAbcdQ: function (abcdQ, plane) {
		var k, info, el,
			sel = '[data-column="{0}"]'.replace('{0}', plane === LaserCanvas.Enum.modePlane.sagittal ? 'sag' : 'tan'),
			rows = this.panel.querySelectorAll('[data-info]');
		for (k = 0; k < rows.length; k += 1) {
			info = rows[k].getAttribute('data-info');
			el = rows[k].querySelector(sel);
			el.innerHTML = 
				!abcdQ || !abcdQ.hasOwnProperty(info) || isNaN(abcdQ[info]) ? '-'
				: !isFinite(abcdQ[info]) ? '&infin;'
				: LaserCanvas.Utilities.numberFormat(abcdQ[info]);
		}
	},
	
	/**
	* The element is being destroyed.
	*/
	destroy: function () {
		if (this.panel && this.panel.parentNode) {
			this.panel.parentNode.removeChild(this.panel);
		}
	},
	
	// ----------------------------------------------------
	//  Painting.
	// ----------------------------------------------------

	/**
	* Determine whether this element is at a location.
	* @param {Point} pt Point to look at.
	* @param {number} tol Tolerance.
	* @returns {boolean} Value indicating whether this element is at given location.
	*/
	atLocation: LaserCanvas.Element.atLocation,
	
	/**
	* Draw this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	* @param {boolean} wireframe Value indicating whether called via wireframe.
	*/
	draw: function (render, layer, wireframe) {
		var
			renderLayer = LaserCanvas.Enum.renderLayer, // {Enum} Layer to draw.
			qc = -this.loc.q; // {number} (rad) Angle on canvas.
		
		switch (layer) {
			case renderLayer.optics:
				if (wireframe) {
					render
						.save()
						.setStroke('#000', 1)
						.drawPath(LaserCanvas.Utilities.stringFormat(
							LaserCanvas.Element.Screen.wireframePath,
							3, 20), this.loc.x, this.loc.y, qc)
						.restore();
				} else {
					render.drawImage(LaserCanvas.theme.current.screen, this.loc.x, this.loc.y, qc);
				}
				break;
				
			case renderLayer.annotation:
				render.fillText(this.name, this.loc.x, this.loc.y, 
					-1.5 * Math.sin(qc), 
					1.5 * Math.cos(qc) + 0.2);
				break;
		}
	},
	
	/**
	* Draw a wireframe of this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	*/
	wireframe: function (render, layer) {
		this.draw(render, layer, true);
	}
};

/**
* Drawing path for wireframe.
*/
LaserCanvas.Element.Screen.wireframePath = 
	'M {0} -{1} L 0 -{1} L 0 {1} L {0} {1} S';

/**
* Inner HTML content for the panel.
*/
LaserCanvas.Element.Screen.panelHtml = [
	'<div class="dragbar"></div>',
	'<h1></h1>',
	'<button data-action="compact"></button>',
	'<table><thead>',
	'<tr>',
		'<th data-column="name" data-localize="Property"></th>',
		'<th data-column="symbol" data-localize="Symbol"></th>',
		'<th data-column="sag" data-localize="Sagittal"></th>',
		'<th data-column="tan" data-localize="Tangential"></th>',
		'<th data-column="unit" data-localize="Unit"></th>',
	'</tr>',
	'</thead><tbody>',
	'<tr data-info="w">',
		'<td data-column="name" data-localize="Mode"></td>',
		'<td data-column="symbol"><i>w</i></td>',
		'<td data-column="sag"></td>',
		'<td data-column="tan"></td>',
		'<td data-column="unit">&micro;m</td>',
	'</tr>',
	'<tr data-info="r">',
		'<td data-column="name" data-localize="Curvature"></td>',
		'<td data-column="symbol"><i>r</i></td>',
		'<td data-column="sag"></td>',
		'<td data-column="tan"></td>',
		'<td data-column="unit">mm</td>',
	'</tr>',
	'<tr data-info="w0">',
		'<td data-column="name" data-localize="Waist"</td>',
		'<td data-column="symbol"><i>w</i><sub>0</sub></td>',
		'<td data-column="sag"></td>',
		'<td data-column="tan"></td>',
		'<td data-column="unit">&micro;m</td>',
	'</tr>',
	'<tr data-info="z0">',
		'<td data-column="name" data-localize="Distance"></td>',
		'<td data-column="symbol"><i>z</i><sub>0</sub></td>',
		'<td data-column="sag"></td>',
		'<td data-column="tan"></td>',
		'<td data-column="unit">mm</td>',
	'</tr>',
	'<tr data-info="zR">',
		'<td data-column="name" data-localize="Rayleigh"></td>',
		'<td data-column="symbol"><i>z</i><sub><i>R</i></sub></td>',
		'<td data-column="sag"></td>',
		'<td data-column="tan"></td>',
		'<td data-column="unit">mm</td>',
	'</tr>',
	'</tbody></table>',
	'<div class="lcbuttons">',
		'<button class="lcbutton padded" data-action="delete">',
			'<label data-localize="Delete"></label>',
		'</button>',
	'</div>'
].join('');
}(window.LaserCanvas));
