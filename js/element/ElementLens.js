/**
* LaserCanvas - lens element.
* Also used as thermal lens within a block.
*/
(function (LaserCanvas) {
LaserCanvas.Element.Lens = function () {
	this.type = 'Lens'; // {string} Primitive element type.
	this.name = 'L'; // {string} Name of this element (updated by System).
	this.loc = {   // Location on canvas.
		x: 0,       // {number} (mm) Horizontal location of element.
		y: 0,       // {number} (mm) Vertical location of element.
		p: 0,       // {number} (rad) Rotation angle of incoming axis.
		q: 0        // {number} (rad) Rotation angle of outgoing axis.
	};
	this.prop = {
		distanceToNext: new LaserCanvas.Equation(0),  // {number} (mm) Distance to next element.
		focalLength: 250    // {number} (mm) Focal length, 0 for infinite.
	};
	this.priv = {
		refractiveIndex: 0  // {number} Refractive index, when used as a thermal lens.
	};
	this.abcdQ = {}; // {object<object>}} ABCD propagation coefficient after this optic.
};

/** Element type name to identify a lens element. */
LaserCanvas.Element.Lens.Type = "Lens";

// Standard focal lengths.
LaserCanvas.Element.Lens.standard = [
	-1000, -750, -500, -400, -300, -250, -200, -175, -150, -125, -100,  -75,  -50,   -25,
	  +25,  +50,  +75, +100, +125, +150, +175, +200, +250, +300, +400, +500, +750, +1000];

LaserCanvas.Element.Lens.prototype = {
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
		LaserCanvas.Utilities.extend(this.loc, json.loc || {});
		LaserCanvas.Utilities.extend(this.prop, json.prop || {});
		this.prop.distanceToNext = new LaserCanvas.Equation(json.prop.distanceToNext);
	},

	/**
	* Set thermal lens attributes.
	* @param {number} focalLength (mm) Focal length of lens to create.
	* @param {number} refractiveIndex Refractive index to set. Set to 0 to remove thermal lens.
	* @param {number} distanceToNext (mm) Distance to next element.
	* @returns {Element:Lens} This element for chaining.
	*/
	setThermalLens: function (focalLength, refractiveIndex, distanceToNext) {
		this.prop.focalLength = focalLength;
		this.priv.refractiveIndex = refractiveIndex;
		this.prop.distanceToNext = distanceToNext;
	},

	/**
	* Returns a value indicating whether this element is a
	* thermal lens within a block.
	* @returns {boolean} Value indicating whether this element is a thermal lens.
	*/
	isThermalLens: function () {
		return this.priv.refractiveIndex !== 0;
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
			this.loc.q = this.loc.p = ax.q; // {number} (rad) Incoming / outgoing axis.
		}
		return LaserCanvas.clone(this.loc);
	},
	
	/**
	* Return ordered array of user-settable properties.
	* @returns {Array<object>} Array of property keys.
	*/
	userProperties: function () {
		return [{
			propertyName: 'focalLength',
			increment: 10, // {number} Increment on up/down key.
			standard: LaserCanvas.Element.Lens.standard // {Array<number>} Standard values.
		}, {
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
		var isThermalLens = this.isThermalLens(); // {boolean} Value indicating whether this is a thermal lens in a block.
		return {
			distanceToNext: !isThermalLens,
			focalLength: true,
			insertElement: !isThermalLens
		}[propertyName] || false;
	},
	
	/**
	 * Sets an internal property equation to a new value.
	 * @param {string} propertyName Name of property to set, "distanceToNext"|...
	 * @param {string|number} newValue New value to set. It is passed to the equation.
	 */
	set: function (propertyName, newValue, arg) {
		switch (propertyName) {
			case "distanceToNext":
				this.prop[propertyName].set(newValue);
				break;
		}
	},

	/**
	 * Returns the property evaluated using the given variable values.
	 * @param {string} propertyName Name of property to evaluate and return.
	 * @param {object} variables Variable values, keyed by variable names.
	 */
	get: function (propertyName, variables) {
		var value = this.prop[propertyName].value(variables);
		switch (propertyName) {
			case "distanceToNext":
				return Math.max(0, value);
		}
		return value;
	},

	/**
	* Sets internal parameters to match new property value -OR- gets the current value.
	* @param {string} propertyName Name of property to set 'distanceToNext' etc.
	* @param {number=} newValue (mm|rad) New target value to set, if any.
	* @returns {number=} The current value, if retrieving only.
	*/
	property: function (propertyName, newValue) {
		// Set value, if specified.
		if (newValue !== undefined) {
			switch (propertyName) {
				case 'distanceToNext': // {number} (mm) New distance to next element.
				case 'focalLength':
					this.prop[propertyName] = newValue;
					break;
			}
		} else {
			// Otherwise, return the current value.
			switch (propertyName) {
				case 'refractiveIndex': // {number} Refractive index, when used as thermal lens (used by ABCD calculation).
					return this.priv.refractiveIndex === 0 ? 1 : this.priv.refractiveIndex;
					
				case 'unused': // {boolean} Value indicating whether the element is unused, e.g. null thermal lens.
					return this.isThermalLens() && this.prop.focalLength === 0;
					
				default:
					return this.prop[propertyName];
			}
		}
	},
	
	/**
	* Return the ABCD matrix for this element.
	* Lens:
	*    f = focal length (mm). Focusing lens f > 0.
	* ABCD = [  1    0 ]
	*        [-1/f   1 ]
	* @param {number} dir The parameter is not used. Direction -1:backwards|+1:forwards.
	* @param {number} plane The parameter is not used. Sagittal (0) or tangential (1) plane.
	*/
	elementAbcd: function (dir_notused, plane_notused) {
		var f = this.prop.focalLength;  // {number} (mm) Focal length.
		return new LaserCanvas.Math.Matrix2x2(1, 0, f === 0 ? 0 : -1 / f, 1);
	},
	
	// ----------------------------------------------------
	//  Painting.
	// ----------------------------------------------------

	/**
	* Draw this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	*/
	draw: function (render, layer) {
		var image, 
			f = this.prop.focalLength,
			qc = -this.loc.p, // {number} (rad) Display angle on canvas.
			renderLayer = LaserCanvas.Enum.renderLayer; // {Enum} Layer to draw.
		
		if (!this.isThermalLens() || f !== 0) { // Don't draw an empty thermal lens.
			switch (layer) {
				case renderLayer.optics:
					image = LaserCanvas.theme.current[
						f < 0 ? 'lensConcave' :
						'lensConvex'
					];
					render.drawImage(image, this.loc.x, this.loc.y, qc);
					break;
					
				case renderLayer.annotation:
					render.fillText(this.name, this.loc.x, this.loc.y, 
						-1.5 * Math.sin(qc) - 0.3 * this.name.length, 
						1.5 * Math.cos(qc) + 0.2);
					break;
			}
		}
	},
	
	/**
	* Draw a wireframe of this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	*/
	wireframe: function (render, layer) {
		var k, dx,
			renderLayer = LaserCanvas.Enum.renderLayer,    // {Enum} Layer to draw.
			d = [], // {Array<string>} Path drawing instructions.
			r = 8,  // {number} "Thickness" of mirror.
			qc = -this.loc.p, // {number} (rad) Display angle on canvas.
			f = this.prop.focalLength,
			
			// Parabola to approximate curvature of mirror.
			// @param {number} k Plotting point.
			// @returns {number} Displacement.
			dx = function (k) {
				return f === 0 ? 0 :
					(f > 0 ? 0.5 : 0.2) * r + 0.2 * (k * k) * (f > 0 ? -1 : +1);
			};
			
		if (!this.isThermalLens() || f !== 0) { // Don't draw an empty thermal lens.
			switch (layer) {
				case renderLayer.optics:
					k = -4;
					d.push(LaserCanvas.Utilities.stringFormatPrecision(2, 'M {0} {1}', dx(k), r * k));
					for (k += 1; k <= +4; k += 1) {
						d.push(LaserCanvas.Utilities.stringFormatPrecision(2, 'L {0} {1}', dx(k), r * k));
					}
					for (k = +4; k >= -4; k -= 1) {
						d.push(LaserCanvas.Utilities.stringFormatPrecision(2, 'L {0} {1}', -dx(k), r * k));
					}
					d.push('Z');
					render
						.save()
						.setStroke('#000', 1)
						.beginPath()
						.drawPath(d.join(' '), this.loc.x, this.loc.y, qc)
						.stroke()
						.restore();
				break;
				
				case renderLayer.annotation:
					if (!this.isThermalLens() || f !== 0) { // Don't draw an empty thermal lens.
						render.fillText(this.name, this.loc.x, this.loc.y, 
							-1.5 * Math.sin(qc) - 0.3 * this.name.length, 
							1.5 * Math.cos(qc) + 0.2);
					}
					break;
			}
		}
	}
};
}(window.LaserCanvas));
