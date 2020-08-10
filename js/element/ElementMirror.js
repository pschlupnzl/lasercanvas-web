/**
* LaserCanvas - mirror element.
*/
(function (LaserCanvas) {
LaserCanvas.Element.Mirror = function () {
	"use strict";
	this.type = 'Mirror'; // {string} Primitive element type.
	this.name = 'M'; // {string} Name of this element (updated by System).
	this.loc = {   // Location on canvas.
		x: 0,       // {number} (mm) Horizontal location of element.
		y: 0,       // {number} (mm) Vertical location of element.
		p: 0,       // {number} (rad) Rotation angle of incoming axis.
		q: 0        // {number} (rad) Rotation angle of outgoing axis.
	};
	this.prop = {
		startOptic: false,            // {boolean} Value indicating whether this is the cavity start optic.
		endOptic: false,              // {boolean} Value indicating whether this is the cavity end optic.
		distanceToNext: 0,            // {number} (mm) Distance to next element.
		radiusOfCurvature: 0,         // {number} (mm) Radius of curvature, or 0 for flat.
		angleOfIncidence: Math.PI / 2 // {number} (rad) Angle of incidence. Default no deflection
	};
	this.abcdQ = {}; // {object<object>}} ABCD propagation coefficient after this optic.
};

/** Element type name to identify a mirror element. */
LaserCanvas.Element.Mirror.Type = "Mirror";

// Standard radii of curvature.
LaserCanvas.Element.Mirror.standard = [
	-1000, -750, -500, -400, -300, -250, -200, -175, -150, -125, -100,  -75,  -50,   -25, 0,
	  +25,  +50,  +75, +100, +125, +150, +175, +200, +250, +300, +400, +500, +750, +1000]

LaserCanvas.Element.Mirror.prototype = {

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
		LaserCanvas.Utilities.extend(this.prop, json.prop);
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
		"use strict";
		if (ax) {
			this.loc.x = ax.x;
			this.loc.y = ax.y;
			this.loc.p = this.loc.q = ax.q;  // {number} (rad) Incoming axis.
			this.loc.q += this.property('deflectionAngle'); // {number} (rad) Outgoing axis.
		}
		return LaserCanvas.clone(this.loc);
	},
	
	/**
	* Return ordered array of user-settable properties.
	* @returns {Array<object>} Array of property keys.
	*/
	userProperties: function () {
		var props = [
			{
				propertyName: 'radiusOfCurvature',
				increment: 5, // {number} Increment on up/down key.
				standard: LaserCanvas.Element.Mirror.standard // {Array<number>} Standard values.
			}
		];
		if (!(this.prop.startOptic || this.prop.endOptic)) {
			props = props.concat(
			[
				{
					propertyName: 'angleOfIncidence',
					increment: 1,
					wrap: 90
				}
			]);
		}
		if (this.prop.startOptic || this.prop.endOptic) {
			props.canDelete = false;
		}
		return props;
	},
	
	/**
	* Gets a value indicating whether this element can adjust transfer properties.
	* @param {string} propertyName Name of property being probed 'distanceToNext'|'deflectionAngle'.
	*/
	canSetProperty: function (propertyName) {
		"use strict";
		return {
			angleOfIncidence: !(this.prop.startOptic || this.prop.endOptic),
			deflectionAngle: !(this.prop.startOptic || this.prop.endOptic),
			distanceToNext: !this.prop.endOptic,
			insertElement: !this.prop.endOptic,
			outgoingAngle: true, // Used by SystemAdjustLite when dragging.
			radiusOfCurvature: true
		}[propertyName] || false;
	},
	
	/**
	* Sets internal parameters to match new property value -OR- retrieve the current value.
	* @param {string} propertyName Name of property to set 'distanceToNext' etc.
	* @param {number=} newValue (mm|rad) New target value to set, if any.
	* @param {...=} arg Additional argument, if needed.
	* @returns {number=} The current value, if retrieving only.
	*/
	property: function (propertyName, newValue, arg) {
		"use strict";
		var i;
		
		// Set value, if specified.
		if (newValue !== undefined) {
			switch (propertyName) {
				case 'angleOfIncidence':
					this.prop.angleOfIncidence = newValue * Math.PI / 180;
					break;
					
				case 'deflectionAngle': // {number} (rad) New deflection angle.
					// SPECIAL CASE: Set angle of incidence to match a required deflection.
					while (newValue < -Math.PI) {
						newValue += 2 * Math.PI;
					}
					while (newValue > Math.PI) {
						newValue -= 2 * Math.PI;
					}
					this.prop.angleOfIncidence = (newValue < 0 ? -1 : +1) * (Math.PI - Math.abs(newValue)) / 2;
					break;
					
				case 'outgoingAngle': 
					// newValue {number} (rad) New outgoing angle on canvas.
					// arg {boolean} Value indicating whether this is first element in cavity.
					if (arg) {
						this.loc.q = newValue;
					} else {
						this.property('deflectionAngle', newValue - this.loc.p);
					}
					break;
					
				case 'distanceToNext': // {number} (mm) New distance to next element.
				case 'radiusOfCurvature':
					this.prop[propertyName] = newValue;
					break;
			}
		} else {
			// Otherwise, return the current value.
			switch (propertyName) {
				case 'angleOfIncidence':
					return this.prop.angleOfIncidence * 180 / Math.PI;
					
				case 'deflectionAngle': // {number} (rad) New deflection angle.
					i = this.prop.angleOfIncidence;
					return (i < 0 ? -1 : +1) * (Math.PI - 2 * Math.abs(i));
					
				case "distanceToNext":
				default:
					return this.prop[propertyName];
			}
		}
	},
	
	/**
	* Return the ABCD matrix for this element.
	* Mirror:
	*    R = radius of curvature (mm). Concave R > 0.
	*    q = angle of incidence (rad).
	*    ABCD = [    1    0 ]
	*           [ -2 / R' 1 ]
	*    where R' = | R cos q     in Tangential plane
	*               | R / cos q   in Sagittal plane
	* @param {number} dir Direction -1:backwards|+1:forwards
	* @param {number.Enum:modePlane} plane Sagittal or tangential plane.
	* @returns {Matrix2x} Transfer matrix.
	*/
	elementAbcd: function (dir, plane) {
		var R = this.prop.radiusOfCurvature,            // {number} (mm) Radius of curvature.
			cosq = Math.cos(this.prop.angleOfIncidence), // {number} Projection of angle of incidence.
			Re = plane === LaserCanvas.Enum.modePlane.sagittal
				? R / cosq // Sagittal
				: R * cosq, // Tangential
			c2_Re = R === 0 ? 0 : -2 / Re, // Flat mirror has R = 0 rather than R = Infinity
			abcd = new LaserCanvas.Math.Matrix2x2(1, 0, c2_Re, 1);
		return abcd;
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
		////return this.wireframe(render, layer);
		"use strict";
		var image, roc,
			qc = -this.loc.p + this.prop.angleOfIncidence, // {number} (rad) Display angle on canvas.
			renderLayer = LaserCanvas.Enum.renderLayer; // {Enum} Layer to draw.
		
		switch (layer) {
			case renderLayer.optics:
				roc = this.prop.radiusOfCurvature;
				image = LaserCanvas.theme.current[
					roc > 300 ? 'mirrorConcave' :
					roc < -300 ? 'mirrorConvex' :
					roc > 0 ? 'mirrorConcaveMore' :
					roc < 0 ? 'mirrorConvexMore' :
					'mirrorPlane'
				];
				render.drawImage(image, this.loc.x, this.loc.y, qc);
				break;
			case renderLayer.annotation:
				render.fillText(this.name, this.loc.x, this.loc.y, 
					Math.cos(qc) - 0.3 * this.name.length, 
					Math.sin(qc) + 0.5);
				break;
		}
	},
	
	/**
	* Draw a wireframe of this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	*/
	wireframe: function (render, layer) {
		"use strict";
		var k, dx,
			renderLayer = LaserCanvas.Enum.renderLayer,    // {Enum} Layer to draw.
			d = [], // {Array<string>} Path drawing instructions.
			r = 8,  // {number} "Thickness" of mirror.
			qc = -this.loc.p + this.prop.angleOfIncidence, // {number} (rad) Display angle on canvas.
			roc = this.prop.radiusOfCurvature,
			
			// Parabola to approximate curvature of mirror.
			// @param {number} k Plotting point.
			// @returns {number} Displacement.
			dx = function (k) {
				return roc === 0 ? 0 :
					1.0 * (k * k)
						* (Math.abs(roc) > 300 ? 0.15 : 0.3)
						* (roc > 0 ? -1 : +1);
			};
			
		switch (layer) {
			case renderLayer.optics:
				for (k = -4; k < +4; k += 1) {
					d.push(LaserCanvas.Utilities.stringFormatPrecision(2, 'M {0} {1} L {2} {3} L {4} {5}',
						r, (k + 1) * r,
						dx(k), k * r,
						dx(k + 1), (k + 1) * r));
				}
				render
					.save()
					.setStroke('#000', 1)
					.beginPath()
					.drawPath(d.join(' '), this.loc.x, this.loc.y, qc)
					.stroke()
					.restore();
			break;
			
			case renderLayer.annotation:
				render.fillText(this.name, this.loc.x, this.loc.y, 
					Math.cos(qc) - 0.3 * this.name.length, 
					Math.sin(qc) + 0.5);
				break;
		}
	}
};
}(window.LaserCanvas));
