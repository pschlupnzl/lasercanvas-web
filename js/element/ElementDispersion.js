/**
* LaserCanvas - Dispersion compensation element (prism or grating).
* @param {string:Dielectric.eType} dispersionType Type of dispersion compensation pair to create.
*/
(function (LaserCanvas) {
	"use strict";
LaserCanvas.Element.Dispersion = function (dispersionType) {
	this.type = 'Dispersion'; // {string} Primitive element type.
	this.name = 'DC';  // {string} Name of this element (updated by System).
	this.loc = {       // Location on canvas.
		x: 0,           // {number} (mm) Horizontal location of element.
		y: 0,           // {number} (mm) Vertical location of element.
		p: 0,           // {number} (rad) Rotation angle of incoming axis.
		q: 0            // {number} (rad) Rotation angle of outgoing axis.
	};
	this.group = [];   // {Array<Element>} Elements in this dispersion compensation pair.
	this.prop = {      // Public properties, for first of pair only.
		distanceToNext: 0 // {number} (mm) Distance to next element.
	};
	this.priv = {};    // Private properties, for first of pair only.
	this.setDefaults(dispersionType); // Set default properties for first of pair.
	
	// Updated externally.
	this.abcdQ = {};   // {object<object>}} ABCD propagation coefficient after this optic.
};

/** Element type name to identify a dispersion element. */
LaserCanvas.Element.Dispersion.Type = "Dispersion";

// Types of dispersion compensation elements (affects angle calculations).
LaserCanvas.Element.Dispersion.eType = {
	Prism: 'Prism'
	////Grating: 'Grating'
};

// Default values to use when creating a new group.
LaserCanvas.Element.Dispersion.propertyDefault = {
	// Prism values:
	prismInsertion: 0,             // {number} (mm) Prism insertion.
	refractiveIndex: 1.5,          // {number} Refractive index (for prism).
	indexDispersion: 0,            // {number} (um^-1) First derivative dn / d lam. (e.g. BK7@1um).
	groupVelocityDispersion: 0     // {number} (um^-2) Second derivative d^2 n / d lam^2 (e.g. BK7@1um).
	
	////// Grating values:
	////gratingDensity: 600   // {number} (1/mm) Groove density per mm (for gratings).
};

// -------------------------------------------------------
//  Create a prism / grating pair group.
// -------------------------------------------------------

/**
 * Creates a new dispersion compensation pair, returning the paired elements.
 * @param {Element} prevElement Previous element in chain, whose distance to set.
 * @param {number} segZ (mm) Distance along the segment where to insert.
 * @returns {Array<Element>} Elements to insert.
 */
LaserCanvas.Element.Dispersion.createGroup = function (prevElement, segZ) {
	var Dispersion = LaserCanvas.Element.Dispersion, // {object} Namespace.
		segLen = prevElement.property('distanceToNext'), // {number} (mm) Distance on segment being inserted.
		elements = [
			new this(Dispersion.eType.Prism), // {Dispersion} First element, with all the properties.
			new this()                        // {Dispersion} Second element.
		];
	elements[0].group = elements[1].group = elements;
	elements[0].setDefaults();
	elements[2].property('distanceToNext', Math.max(0, segLen - segZ));
	prevElement.property('distanceToNext', Math.max(0, segZ));
	return elements;
};

/**
 * Updates the angle calculations of a Brewster-angled prism
 * of the given refracitve index. Sets the apexAngle, deflectionAngle
 * and internalLength properties.
 * @param {number} refractiveIndex Refractive index of prism.
 * @param {number} prismInsertion (mm) Amount by which prism is inserted into beam.
 * @param {object} priv Reference to object whose properties are updated.
 */
LaserCanvas.Element.Dispersion.brewsterPrism = function (refractiveIndex, prismInsertion, priv) {
	// Brewster cut prism pair at minimum deviation angle.
	// See e.g. https://arxiv.org/pdf/1411.0232.pdf
	//                        .
	//                       /a\
	//                      /   \
	//              q1  ___/_ _ _\___  q4
	//              ___/  /q2   q3\  \___
	//          ___/     /_________\     \___
	// At minimum deviation 
	//    q1 = q4.
	// Apex angle 
	//    q2 = q3 = a/2.
	// At Brewster's angle
	// From Snell's law 
	//    sin q1 = n sin q2
	// and Brewster's angle
	//    q1 + q2 = pi/2.
	// we find that 
	//    qB = atan(n).
	// Deflection angle would seem to be
	//    qD = 2 ( pi/2 - q1 - q2 ) ??
	// or qD = 2 (q1 - q2) ??
	var
		n = refractiveIndex,              // {number} Refractive index.
		qB = Math.atan(n),                // {number} (rad) Brewster's angle.
		a = Math.PI - 2 * qB,             // {number} (rad) Apex angle.
		q2 = Math.asin(Math.sin(qB) / n), // {number} (rad) Internal refraction angle.
		d = 2 * (qB - q2);                // {number} (rad) Deflection angle.
	priv.apexAngle = a;                  // {number} (rad) Apex angle.
	priv.deflectionAngle = -d;           // {number} (rad) Deflection angle.
	priv.internalLength = 2 * prismInsertion * Math.tan(a);
};

LaserCanvas.Element.Dispersion.prototype = {
	/** Return a serializable representation of this object. */
	toJson: function () {
		return {
			type: this.type,
			name: this.name,
			loc: LaserCanvas.Utilities.extend({}, this.loc),
			prop: LaserCanvas.Utilities.extend({}, this.prop),
			priv: LaserCanvas.Utilities.extend({}, this.priv)
		};
	},

	/** Load a serialized representation of this object. */
	fromJson: function (json) {
		this.name = json.name;
		this.setDefaults(json.prop.type);
		LaserCanvas.Utilities.extend(this.loc, json.loc);
		LaserCanvas.Utilities.extend(this.prop, json.prop);
		LaserCanvas.Utilities.extend(this.priv, json.priv);
	},

	/**
	* Set default values (for first of pair only).
	* @param {string:Dielectric.eType} dispersionType Type of dispersion compensation pair to create.
	*/
	setDefaults: function (dispersionType) {
		var Dispersion = LaserCanvas.Element.Dispersion,  // {object} Namespace.
			eType = Dispersion.eType,                     // {object:Enum} Types of dispersion pairs.
			propertyDefault = Dispersion.propertyDefault; // {object} Default properties to set.
		
		if (dispersionType) {
			// Set for first element only.
			this.prop = {
				type: eType.Prism, // {string:Enum} Type of dispersion pair 'Prism'|'Grating'.
				distanceToNext: 0  // {number} (mm) Distance to next element.
			};
			LaserCanvas.Utilities.extend(this.prop, Dispersion.propertyDefault);
			
			this.priv = { // Calculated at updateAngles, below.
				apexAngle: 0.1,     // {number} (rad) Apex angle.
				deflectionAngle: 0, // {number} (rad) Deflection angle.
				internalLength: 0   // {number} (mm) Internal propagation length.
			};
		}
	},

	/**
	* Re-calculate angles based on new values and type.
	*/
	updateAngles: function () {
		var eType = LaserCanvas.Element.Dispersion.eType; // {object:Enum} Types of dispersion pairs.
		// Update for first element.
		if (this === this.group[0]) {
			switch (this.prop.type) {
				case eType.Prism:
					LaserCanvas.Element.Dispersion.brewsterPrism(this.prop.refractiveIndex, this.prop.prismInsertion, this.priv);
					break;
				////case eType.Grating:
				////	// TODO: Grating calculation.
				////	break;
			}
		}
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
			this.loc.p = this.loc.q = ax.q;  // {number} (rad) Incoming axis.
			
			this.loc.q += this.property('deflectionAngle');
		}
		return LaserCanvas.clone(this.loc);
	},
	
	/**
	* Return ordered array of user-settable properties.
	* @returns {Array<object>} Array of property keys.
	*/
	userProperties: function () {
		var eType = LaserCanvas.Element.Dispersion.eType,
			props = [{
				propertyName: 'type',
				options: ['Prism'], // , 'Grating'], // TODO: Grating.
				infoPanel: false
			}, {
				propertyName: 'distanceToNext',
				increment: 5,
				min: 0
			}];
		switch (this.group[0].prop.type) {
			case eType.Prism:
				props = props.concat([
					{
						propertyName: 'prismInsertion',
						increment: 0.5,
						min: 0,
						infoPanel: this === this.group[0]
					}, {
						propertyName: 'refractiveIndex',
						increment: 0.1,
						min: 1,
						infoPanel: this === this.group[0]
					}, {
						propertyName: 'indexDispersion',
						increment: 0.001,
						infoPanel: this === this.group[0]
					}, {
						propertyName: 'groupVelocityDispersion',
						increment: 0.001,
						infoPanel: this === this.group[0]
					}
					// ?? { // d^2n / dl^2 Only used with insertion.
					// ?? 	propertyName: 'indexSecondDerivative',
					// ?? 	increment: 0.001
					// ?? },
				]);
				break;
			////case eType.Grating:
			////	props.push({
			////		propertyName: 'gratingDensity',
			////		increment: 10,
			////		min: 10
			////	});
			////	break;
		}
		props.canDelete = false; // Cannot delete a dispersion compensation pair.
		return props;
	},
	
	/**
	* Gets a value indicating whether this element can adjust transfer properties.
	* @param {string} propertyName Name of property being probed 'distanceToNext'|'deflectionAngle'.
	* @param {object} adjustingElement Element being dragged - to retain intra-pair spacing.
	*/
	canSetProperty: function (propertyName, adjustingElement) {
		var eType = LaserCanvas.Element.Dispersion.eType, // {object:Enum} Dispersion pair types.
			isPrism = this.group[0].prop.type === eType.Prism; // {boolean} Value indicating whether the dispersion pair is a prism.
		return {
			distanceToNext: true, // !(adjustingElement === this && this === this.group[0]), // Retain intra-pair spacing.
			////gratingDensity: this.group[0].prop.type === eType.Grating, // Prisms have refractive index.
			insertElement: this === this.group[this.group.length - 1], // Can insert elements after last of pair.
			prismInsertion: isPrism,
			refractiveIndex: isPrism,  // Prisms have refractive index.
			indexDispersion: isPrism,
			groupVelocityDispersion: isPrism,
			type: true
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

		// Set value, if specified.
		if (newValue !== undefined) {
			switch (propertyName) {
				case 'distanceToNext': // {number} (mm) New distance to next element.
					this.prop[propertyName] = newValue;
					break;
					
				////case 'gratingDensity':
				case 'prismInsertion':
				case 'refractiveIndex':
				case 'indexDispersion':
				case 'groupVelocityDispersion':
				case 'type':
					this.group[0].prop[propertyName] = newValue;
					this.group[0].updateAngles();
					break;
			}
		} else {
			// Otherwise, return the current value.
			switch (propertyName) {
				case 'distanceToNext': // {number} (mm) Distance to next element.
					return this.prop[propertyName];
					
				case 'deflectionAngle': // {number} (rad) Outgoing axis.
					return this.group[0].priv.deflectionAngle *
						(this === this.group[0] ? +1 : -1);
				
				////case 'gratingDensity':
				case 'prismInsertion':
				case 'refractiveIndex':
				case 'indexDispersion':
				case 'groupVelocityDispersion':
				case 'type':
					return this.group[0].prop[propertyName];
			}
		}
	},
	
	/**
	* Return the refractive index for the space following the 
	* element. The method is exposed here because prisms have
	* a refractiveIndex property that does NOT apply to the
	* following space. It's exposed as a method rather than a
	* property() value so that the method doesn't need to be
	* invoked on elements that don't use it.
	* @returns {number} Refractive index for space following the element.
	*/
	spaceRefractiveIndex: function () {
		return 1.0;
	},
	
	/**
	* Return the group delay dispersion for the dispersion pair.
	* @param {number} lam (nm) Wavelength (note units nm).
	* @returns {number|boolean} (fs^2/rad) Group delay dispersion, or FALSE for second element where method doesn't apply.
	*/
	groupDelayDispersion: function (lam) {
		var gdd, A, B, c, l3pic2, dndl, d2ndl2;

		// See https://arxiv.org/pdf/1411.0232.pdf.
		// Also Randy's manuscript for full compressor (i.e. 2 round trips):
		//                  lam^3    (  d n  )^2
		//   phi'' = -4 L ---------- (-------)
		//                 2 pi c^2  ( d lam )
		if (this === this.group[0]) {
			// Properties.
			dndl = this.prop.indexDispersion; // {number} (1/um) First derivative dn / dlam.
			d2ndl2 = this.prop.groupVelocityDispersion; // {number} (1/um^2) Group velocity dispersion d^2n / dlam^2.
			
			// Variables.
			c = LaserCanvas.constant.c; // {number} (um/fs) Speed of light.
			l3pic2 = lam * lam * lam / (Math.PI * c * c); // Factor lam^2 / pi c^2.
			A = this.property("distanceToNext"); // {number} (mm) Distance between prisms.
			B = 0;          // {number} (mm) Insertion.
			
			// Calculation (approximate).
			gdd = B * l3pic2 * d2ndl2
				- A * 2 * l3pic2 * dndl * dndl;
				
			// Units: Wavelength [um] <-- lam [nm] x 1e-3.
			//        Distance [um] <-- distToNext [mm] x 1e+3.
			// Wavelength cubed, distance once.
			gdd *= 1e-6;

			// Add dispersion from prism insertion.
			// LaserCanvas..groupDelayDispersion returns non-zero only for first in group.
			gdd += LaserCanvas.Element.groupDelayDispersion.call(this, lam, this.priv.internalLength);
			
			// Return.
			return gdd;
		
		} else {
			// Only used at first of pair.
			return false;
		}
		
		
	},
	
	/**
	* Return the ABCD matrix for this element.
	* @param {number} dir Direction -1:backwards|+1:forwards. The parameter is not used.
	* @param {number.Enum:modePlane} plane Sagittal or tangential plane. The parameter is not used.
	* @returns {Matrix2x} Transfer matrix.
	*/
	elementAbcd: function (dir, plane) {
		var abcd = LaserCanvas.Math.Matrix2x2.eye();
		return abcd;
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
	*/
	draw: function (render, layer) {
		var qf, tan, path,
			i = this === this.group[0] ? 0    // {number} (mm) Prism insertion.
				: this.group[0].prop.prismInsertion, // Assign to second prism only (although stored on first).
			r = Math.max(40, 1.5 * i),        // {number} Prism length.
			qc = -this.loc.p - this.property('deflectionAngle') / 2, // {number} (rad) Display angle on canvas.
			renderLayer = LaserCanvas.Enum.renderLayer; // {Enum} Layer to draw.
		
		// Second of pair opposite sense.
		if (this !== this.group[0]) {
			qc += Math.PI;
		}
		
		switch (layer) {
			case renderLayer.optics:
				qf = this.group[0].priv.apexAngle / 2; // {number} (rad) Apex half angle.
				tan = r * Math.tan(qf);  // {number} Base half-width of prism.
				path = LaserCanvas.Utilities.stringFormat('M 0 {0} L {1} {2} L {3} {4} ZFS',
					i.toFixed(2), -tan.toFixed(2), (i - r).toFixed(2), +tan.toFixed(2), (i - r).toFixed(2));
				render
					.save()
					.setStroke('#000', 1)
					.createPattern(LaserCanvas.theme.current.blockFill)
					.drawPath(path, this.loc.x, this.loc.y, qc)
					.restore();
				break;
				
			case renderLayer.annotation:
				render.fillText(this.name, this.loc.x, this.loc.y, 
					-2 * Math.sin(qc) - 0.3 * this.name.length, 
					+2 * Math.cos(qc) + 0.5);
				break;
		}
	},
	
	/**
	* Draw a wireframe of this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	*/
	wireframe: function (render, layer) {
		return this.draw(render, layer);
	}
};
}(window.LaserCanvas));
