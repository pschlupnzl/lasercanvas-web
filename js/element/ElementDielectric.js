/**
* LaserCanvas - Interface to dielectric block element.
* @param {function} variablesGetter Function to retrieve current variable values.
* @param {string:Dielectric.eType} blockType Type of block. If not set, assume output face.
*/
(function (LaserCanvas) {
LaserCanvas.Element.Dielectric = function (variablesGetter, blockType) {
	this.type = "Dielectric"; // {string} Primitive element type.
	this.name = "D"; // {string} Name of this element (updated by System).
	this.variablesGetter = variablesGetter; // {function} Used to retrieve variable values.
	this.loc = {   // Location on canvas.
		x: 0,       // {number} (mm) Horizontal location of element.
		y: 0,       // {number} (mm) Vertical location of element.
		p: 0,       // {number} (rad) Rotation angle of incoming axis.
		q: 0        // {number} (rad) Rotation angle of outgoing axis.
	};
	this.group = [];              // {Array<Element>} Related elements: Input interface, lens, output interface.
	this.prop = this.getDefaultProp(blockType); // {object} Public properties.
	this.priv = this.getDefaultPriv(blockType); // {object} Private properties.
	
	// Updated externally.
	this.abcdQ = {}; // {object<object>}} ABCD propagation coefficient after this optic.
};

/** Element type name to identify a dielectric element. */
LaserCanvas.Element.Dielectric.Type = "Dielectric";

// Types of dielectric block elements (affects angle calculations).
LaserCanvas.Element.Dielectric.eType = {
	Plate: "Plate",        // Plate at arbitrary incidence angle.
	Brewster: "Brewster",  // Brewster plate, incidence A = atan(n).
	Crystal: "Crystal",    // Crystal. Angle is face normal to centerline, external incidence angle sinB = n sinA.
	Prism: "Prism",        // Brewster-angled prism.
	Endcap: "Endcap"       // Resonator end-coated.
};

// Default values to use when creating a group.
LaserCanvas.Element.Dielectric.propertyDefault = {
	refractiveIndex: 1.5,  // {number} Default refractive index.
	thickness: 20          // {number} (mm) Default thickness.
};

// -------------------------------------------------------
//  Create a new group
// -------------------------------------------------------

/**
 * Create a new compound Dielectric element as a group comprising input,
 * thermal lens, and output face.
 * @param {Element} prevElement Previous element in chain, whose distance to set.
 * @param {number} segZ (mm) Distance along the segment where to insert.
 * @param {function} variablesGetter Function that returns variable values.
 * @returns {Array<Element>} Elements to insert.
 */
LaserCanvas.Element.Dielectric.createGroup = function (prevElement, segZ, variablesGetter) {
	var Dielectric = LaserCanvas.Element.Dielectric, // {object} Namespace.
		segLen = prevElement.get("distanceToNext"), // {number} (mm) Distance on segment being inserted.
		propertyDefault = Dielectric.propertyDefault,    // {object} Default values for properties.
		len = propertyDefault.thickness,     // {number} (mm) Thickness of dielectric group.
		n = propertyDefault.refractiveIndex, // {number} Refractive index.
		group = [
			new this(variablesGetter, Dielectric.eType.Plate), // {Dielectric} Input interface (first element, with all the properties)
			new LaserCanvas.Element.Lens(variablesGetter),     // {Lens} Thermal lens.
			new this(variablesGetter)                          // {Dielectric} Output interface.
		];
	// Input face.
	group[0].group = group[2].group = group;
	group[0].set("thickness", len);        // {number} (mm) Thickness of dielectric block group.
	group[0].set("refractiveIndex", n);    // {number} Refractive index.
	
	// Thermal lens.
	group[0].updateThermalLens();
	
	// Distances.
	group[2].set("distanceToNext", Math.max(0, segLen - segZ - len / 2)); // Remaining distance.
	prevElement.set("distanceToNext", Math.max(0, segZ - len / 2)); // Set new distance.
	return group;
};

LaserCanvas.Element.Dielectric.prototype = {
	/** Return a serializable representation of this object. */
	toJson: function () {
		return {
			type: this.type,
			name: this.name,
			loc: LaserCanvas.Utilities.extend({}, this.loc),
			priv: LaserCanvas.Utilities.extend({}, this.priv),
			prop: LaserCanvas.Utilities.extend({}, this.prop)
		};
	},

	/** Load a serialized representation of this object. */
	fromJson: function (json) {
		this.name = json.name;
		this.prop = this.getDefaultProp(json.prop.type);
		this.priv = this.getDefaultPriv(json.prop.type);
		LaserCanvas.Utilities.extend(this.loc, json.loc);
		LaserCanvas.Utilities.extend(this.priv, json.priv);

		for (var propertyName in this.prop) {
			if (this.prop.hasOwnProperty(propertyName)) {
				if (typeof this.prop[propertyName] === "object") {
					this.prop[propertyName].set(json.prop[propertyName]);
				} else {
					this.prop[propertyName] = json.prop[propertyName];
				}
			}
		}
	},

	/**
	 * Returns a new collection of user-settable properties.
	 * @param {string:Dielectric.eType} blockType Type of block. If not set, assume output face.
	 */
	getDefaultProp: function (blockType) {
		return {
			type: blockType,           // {string:Enum} Type of dielectric element (see Dielectric.type enum) "Plate"|"Brewster"|"Crystal".
			flip: false,               // {boolean} Value indicating whether Brewster angle is flipped.
			distanceToNext: new LaserCanvas.Equation(0),         // {number} (mm) Distance to next element.
			refractiveIndex: new LaserCanvas.Equation(1),        // {number} Refractive index.
			groupVelocityDispersion: new LaserCanvas.Equation(0),// {number} (um^-2) Group velocity dispersion for ultrafast calculations.
			angleOfIncidence: new LaserCanvas.Equation(0),       // {number} (deg) Angle of incidence. Auto-calculated for Brewster and Crystal.
			faceAngle: new LaserCanvas.Equation(0),              // {number} (deg) Face angle relative to internal propagation for Crystal (also used for painting).
			curvatureFace1: new LaserCanvas.Equation(0),         // {number} (mm) Radius of curvature for input interface, or 0 for flat.
			curvatureFace2: new LaserCanvas.Equation(0),         // {number} (mm) Radius of curvature for output interface, or 0 for flat.
			thermalLens: new LaserCanvas.Equation(0),            // {number} (mm) Focal length of thermal lens, or 0 for none.
			thickness: new LaserCanvas.Equation(0)               // {number} (mm) Thickness of element (opening element only).
		};
	},

	getDefaultPriv: function (blockType) {
		return {
			derivedFaceAngle: 0, // {number} (rad) Face angle relative to internal propagation, used for drawing; copied from public prop for Crystal, derived for others.
			derivedAngleOfIncidence: 0, // {number} (rad) External angle of incidence, used for ABCD; derived for Crystals, copied from public prop for others.
			deflectionAngle: 0   // {number} (rad) Deflection angle from axes, used when setting properties in location().
		}
	},

	/**
	 * Hook to update the internal properties when variables change independent
	 * of a user-triggered `set` operation. This might happen, for example, when
	 * variables are changed by dragging UI sliders, or when they are scanned to
	 * build up graphs.
	 */
	onVariablesChange: function () {
		if (this === this.group[0]) {
			this.updateAngles();
		}
	},

	/**
	* Re-calculate angles based on new values and type. It is assumed
	* that any and all properties are set. The declared prop values are
	* *not* overwritten here, because they may be defined as equations.
	*/
	updateAngles: function () {
		var eType = LaserCanvas.Element.Dielectric.eType,
			angleLimit = 80 * Math.PI / 180,      // {number} Maximum angle of incidence.
			A, B, C, nsinB,                       // Temporary variables.
			type = this.get("type"),              // {eType} Current block type.
			isBrewster = type === eType.Brewster, // {boolean} Value indicating whether the dielectric is a Brewster crystal.
			isPrism = type === eType.Prism,       // {boolean} Value indicating whether the dielectric is a Prism.
			sign = this.get("flip") ? -1 : 1,     // {number} Reverse angles on flip.
			angleOfIncidence = this.get("angleOfIncidence") * Math.PI / 180, // {number} (deg) External incidence angle (n = 1 side?).
			faceAngle = this.get("faceAngle") * Math.PI / 180, // {number} (deg) Face angle, used for Crystal.
			n = Math.max(1, this.get("refractiveIndex"));      // {number} Refractive index (must be n >= 1).

		// Brewster plate: Fix external angle of incidence.
		if (isBrewster || isPrism) {
			angleOfIncidence = sign * Math.atan(n);
		}
		
		// Limit angles.
		angleOfIncidence = Math.max(-angleLimit, Math.min(angleLimit, angleOfIncidence));
		
		// Derived angles.
		switch (type) {
			case eType.Plate:
			case eType.Brewster:
			case eType.Prism:
				// External angle A, internal angle B, deflection angle C.
				//
				//  \_  A  :           A  Angle of incidence
				//     \_  :
				// _______\:________
				//         :\_ 
				//         : \ \_      B  Internal angle
				//         :B \ C \_   C  Deflection angle
				// Snell's law:  sinA = n sinB
				//                  B = asin(sinA / n).
				// Geometry:        A = B + C
				//                  C = A - B.
				A = angleOfIncidence;            // {number} (rad) External incidence angle.
				B = Math.asin(Math.sin(A) / n);  // {number} (rad) Internal propagation angle.
				break;
				
			case eType.Crystal:
			case eType.Endcap:
				// Face normal angle B, external angle A, deflection angle C.
				// Snell's law:  sinA = nsinB
				//                  A = asin(n sinB) (up to TIR)
				// Geometry:    B + C = A
				//                  C = A - B.
				B = faceAngle;                  // {number} (rad) Face (normal) angle to internal propagation.
				nsinB = n * Math.sin(B);        // External angle product.
				A = nsinB < -1 ? -Math.PI / 2 : // {number} (rad) External incidence angle.
					nsinB > +1 ? +Math.PI / 2 : // Protect against TIR.
					Math.asin(nsinB);           // Angles are good.
				break;
		}

		C = A - B;                  // {number} (rad) Deflection angle.
		this.set("derivedFaceAngle", B)         // {number} (rad) Face angle relative to internal propagation axis.
		this.set("derivedAngleOfIncidence", A); // {number} (rad) External angle of incidence relative to face normal.
		this.set("deflectionAngle", C);         // {number} (rad) Deflection from beam propagation direction.
	
		// Thickness.
		this.updateThermalLens();
	},
	
	/**
	* Update the internal and thermal lens properties.
	* These are distances, not angles.
	*/
	updateThermalLens: function () {
		var isEndcap = this.get("type") === LaserCanvas.Element.Dielectric.eType.Endcap,
			thickness = this.get("thickness"),        // {number} (mm) Declared thickness.
			thermalLens = this.get("thermalLens"),    // {number} (mm) Focal length of thermal lens.
			n = this.get("refractiveIndex"),          // {number} Refractive index within dielectric.
			faceAngle = this.get("derivedFaceAngle"), // {number} (rad) Face angle.
			len = isEndcap ? thickness : thickness / Math.cos(faceAngle), // Thickness projected for non-endcap.
			// Show full propagation if there is no thermal lens.
			l1 = thermalLens === 0 ? len : len / 2,   // {number} (mm) Propagation before lens.
			l2 = len - l1;                            // {number} (mm) Propagation after lens.
		this.group[0].set("distanceToNext", l1);
		this.group[1].setThermalLens(thermalLens, n, l2);
	},
	
	// ----------------------------------------------------
	//  Coordinates and properties.
	// ----------------------------------------------------

	/**
	* Remove a group of elements.
	* @param {Element} prevElement Previous element in chain, whose distance to set.
	* @returns {number} Count of elements in this group.
	*/
	removeGroup: function (prevElement) {
		prevElement.set("distanceToNext", 
			prevElement.get("distanceToNext") 
			+ this.get("thickness")
			+ this.group[this.group.length - 1].get("distanceToNext"));
		return this.group.length;
	},
	
	/**
	* Gets or sets the location for this element.
	* @param {object} ax When setting, the incoming axis and Cartesian coordinates for the element.
	* @returns {object} The element location object.
	*/
	location: function (ax) {
		// Deflection angle: -1 returns to parallel to input; +1 deflects again (e.g. prism)
		var isFirst = this === this.group[0],
			isPrism = this.get("type") === LaserCanvas.Element.Dielectric.eType.Prism,
			deflectionAngle = this.get("deflectionAngle");

		if (ax) {
			this.loc.x = ax.x;
			this.loc.y = ax.y;
			this.loc.q = this.loc.p = ax.q; // {number} (rad) Incoming axis.

			this.loc.q += isFirst || isPrism ? deflectionAngle : -deflectionAngle;
		}

		return LaserCanvas.Utilities.extend(
			LaserCanvas.clone(this.loc), {
				x0: (this.group[0].loc.x + this.group[2].loc.x) / 2,
				y0: (this.group[0].loc.y + this.group[2].loc.y) / 2
			});
	},
	
	/**
	* Return ordered array of user-settable properties.
	* This is used by both property and information panel.
	* @returns {Array<object>} Array of property keys.
	*/
	userProperties: function () {
		var k,
			eType = LaserCanvas.Element.Dielectric.eType,
			props = [],

			allProps = {
				type: {
					propertyName: "type",
					options: ["Plate", "Brewster", "Crystal", "Prism"],
					infoPanel: false
				},
				elementDistanceToNext: {
					propertyName: "elementDistanceToNext",
					increment: 5,
					min: 0
				},
				refractiveIndex: {
					propertyName: "refractiveIndex",
					increment: 0.1,
					min: 1
				},
				groupVelocityDispersion: {
					propertyName: "groupVelocityDispersion",
					increment: 0.001
				},
				thickness: {
					propertyName: "thickness",
					increment: 1,
					min: 1
				},
				curvatureFace1: {
					propertyName: "curvatureFace1",
					increment: 10
				},
				curvatureFace2: {
					propertyName: "curvatureFace2",
					increment: 10
				},
				angleOfIncidence: {
					propertyName: "angleOfIncidence",
					increment: 1,
					min: -85,
					max: +85
				},
				flip: {
					propertyName: "flip",
					dataType: "boolean",
					infoPanel: false,
					propertyPanel: this.prop.type === eType.Brewster || this.prop.type === eType.Prism
				},
				faceAngle: {
					propertyName: "faceAngle",
					increment: 1,
					min: -85,
					max: +85
				}, 
				thermalLens: {
					propertyName: "thermalLens",
					increment: 10
				}
			},
			elementProps =
				this.prop.type === eType.Plate ? ["type", "elementDistanceToNext", "refractiveIndex", "groupVelocityDispersion", "thickness", "curvatureFace1", "curvatureFace2", "angleOfIncidence", "flip"] :
				this.prop.type === eType.Brewster ? ["type", "elementDistanceToNext", "refractiveIndex", "groupVelocityDispersion", "thickness", "flip"] :
				this.prop.type === eType.Crystal ? ["type", "elementDistanceToNext", "refractiveIndex", "groupVelocityDispersion", "thickness", "curvatureFace1", "curvatureFace2", "flip", "faceAngle", "thermalLens"] :
				this.prop.type === eType.Prism ? ["type", "elementDistanceToNext", "refractiveIndex", "thickness", "flip"] :
				this.prop.type === eType.Endcap ? ["elementDistanceToNext", "refractiveIndex", "groupVelocityDispersion", "thickness", "curvatureFace1", "curvatureFace2", "flip", "faceAngle", "thermalLens"] :
				[];

		// No properties except for first element.
		if (this === this.group[0]) {
			for (k = 0; k < elementProps.length; k += 1) {
				props.push(allProps[elementProps[k]]);
			}
		}
		return props;
	},
	
	/**
	* Gets a value indicating whether this element can adjust transfer properties.
	* @param {string} propertyName Name of property being probed "distanceToNext"|"deflectionAngle".
	*/
	canSetProperty: function (propertyName) {
		var eType = LaserCanvas.Element.Dielectric.eType,     // {string:Enum} Type of dielectric block.
			firstElement = this === this.group[0],                    // {boolean} Value indicating whether this is the first item in the group.
			lastElement = this === this.group[this.group.length - 1], // {boolean} Value indicating whether this is the last element.
			endcap = firstElement && this.prop.type === eType.Endcap, // {boolean} Value indicating whether interface is endcap.
			brewster = this.prop.type === eType.Brewster || this.prop.type === eType.Prism; // {boolean} Value indicating whether this is a Brewster plate or prism.

		return {
			type: !endcap,
			thickness: firstElement,
			refractiveIndex: firstElement,
			groupVelocityDispersion: firstElement,
			angleOfIncidence: this.prop.type === eType.Plate,
			faceAngle: this.prop.type === eType.Crystal || this.prop.type === eType.Endcap,
			flip: brewster,
			insertElement: this === this.group[this.group.length - 1], // Can insert new elements only after last.
			thermalLens: !brewster,
			curvatureFace1: !brewster,
			curvatureFace2: !brewster,
			distanceToNext: lastElement,
			elementDistanceToNext: true,
			outgoingAngle: endcap // Used for cavity geometry adjustment.
		}[propertyName] || false;
	},
	
	/**
	 * Sets internal parameters to match new property value -OR- gets the current value.
	 * Gets or sets internal parameters to match new property value.
	 * @param {string} propertyName Name of property to set "distanceToNext" etc.
	 * @param {number|boolean=} newValue (mm|rad) New target value to set, if any.
	 * @param {...=} arg Additional argument, if needed (e.g. outgoing angle).
	 * @returns {number=} The current value, if retrieving only.
	 */
	set: function (propertyName, newValue, arg) {
		var eType = LaserCanvas.Element.Dielectric.eType;
		// Only the first element in the group stores property
		// values. For setting / getting values here, we could
		// use
		//    this.group[0].prop[propertyName]
		// to allow any element in the group to return the value
		// but instead work on the assumption that only the first
		// element has valid values and use
		//    this.prop[propertyName]
		// instead.
		switch (propertyName) {
			case "type":
				switch (newValue) {
					case eType.Plate:
						this.prop.thermalLens.set(0);
						break;
					case eType.Brewster:
					case eType.Prism:
						this.prop.thermalLens.set(0);
						this.prop.curvatureFace1.set(0);
						this.prop.curvatureFace2.set(0);
						break;
				}
				this.prop[propertyName] = newValue;
				this.updateAngles();
				break;
				
			case "flip":
				this.prop[propertyName] = newValue;
				this.updateAngles();
				break;

			case "refractiveIndex":
			case "curvatureFace1":
			case "curvatureFace2":
				this.prop[propertyName].set(newValue);
				this.updateAngles();
				break;
				
			case "thickness":
				this.prop[propertyName].set(newValue);
				this.updateThermalLens();
				break;
				
			case "angleOfIncidence":
			case "faceAngle":
				// this.prop[propertyName] = newValue * Math.PI / 180.00;
				this.prop[propertyName].set(newValue);
				this.updateAngles();
				break;
				
			case "thermalLens":
				this.prop[propertyName].set(newValue);
				this.updateThermalLens();
				break;
			
			case "outgoingAngle":
				// newValue {number} (rad) New outgoing angle on canvas.
				// arg {boolean} Value indicating whether this is first element in cavity.
				if (arg) {
					this.loc.q = newValue;
				}
				break;

			case "distanceToNext": // {number} (mm) New distance to next element.
			case "groupVelocityDispersion":
				this.prop[propertyName].set(newValue);
				break;
			
			case "elementDistanceToNext": // {number} (mm) New distance to next element *after* the group.
				this.group[this.group.length - 1].prop.distanceToNext.set(newValue);
				break;

			case "derivedFaceAngle":
			case "derivedAngleOfIncidence":
			case "deflectionAngle":
				this.priv[propertyName] = newValue;
				break;

			case "startOptic":
			case "endOptic":
				// NOP - ignore these. They are used to determine whether
				// elements can be inserted.
				break;

default:
	console.warn(`Set property ${propertyName}=${newValue} not implemented`);
	break;
		}
	},

	/**
	 * Returns a property value.
	 */
	get: function (propertyName) {
		var variables = this.variablesGetter(),
			value = this.prop[propertyName]
				&& this.prop[propertyName].value
				&& this.prop[propertyName].value(variables);

		switch (propertyName) {
			case "type":            // {string} Dielectric block type.
			case "flip":            // {boolean} Value indicating whether to flip a Brewster plate.
				return this.group[0].prop[propertyName];

			case "angleOfIncidence":
			case "faceAngle":
				return value;
				
			case "distanceToNext": // {number} (mm) Distance to next element.
			case "thickness":       // {number} (mm) Thickness of element.
				return Math.max(0, value);

			case "refractiveIndex": // {number} Refractive index.
				return Math.max(1, value);

			case "curvatureFace1":
			case "curvatureFace2":
			case "groupVelocityDispersion": // {number} (um^-2) Group velocity dispersion.
			case "thermalLens":     // {number} (mm) Focal length of thermal lens, or 0 for none.
				return value;

			case "elementDistanceToNext": // {number} (mm) New distance to next element *after* the group.
				return this.group[this.group.length - 1].get("distanceToNext");

			case "derivedFaceAngle":
			case "derivedAngleOfIncidence":
			case "deflectionAngle":
				return this.group[0].priv[propertyName];
		}
	},
	
	/** Returns the source expression for the property. */
	expression: function (propertyName) {
		switch (propertyName) {
			case "elementDistanceToNext":
				return this.group[this.group.length - 1].expression("distanceToNext");
		}
		return this.prop[propertyName].expression();
	},

	/**
	* Return the group delay dispersion for the element.
	* @param {number} lam (nm) Wavelength (note units nm).
	* @returns {number} (fs^2/rad) Group delay dispersion.
	*/
	groupDelayDispersion: LaserCanvas.Element.groupDelayDispersion,
	
	/**
	* Return the ABCD matrix for this element.
	* @param {number} dir Direction -1:backwards|+1:forwards
	* @param {number.Enum:modePlane} plane Sagittal or tangential plane.
	* @returns {Matrix2x} Transfer matrix.
	*/
	elementAbcd: function (dir, plane) {
		var Matrix2x2 = LaserCanvas.Math.Matrix2x2,
			abcd,                               // {object:Matrix2x2} Returned matrix.
			n1, n2, q1, q2, cosq1, cosq2, dn,   // Temporary variables.
			start = this.group[0],              // Starting element with all the properties.
			isFirst = this === this.group[0],   // {boolean} Value indicating whether this is face 1 (false means face 2).
			type = this.get("type"),            // {eType} Type of this dielectric.
			nint = start.get("refractiveIndex"),         // {number} Refractive index within dielectric block.
			qext = start.get("derivedAngleOfIncidence"), // {number} (rad) (External) Angle of incidence (assume parallel faces).
			qint = Math.asin(Math.sin(qext) / nint),     // {number} (rad) Internal angle.
			roc = isFirst                       // {number} (mm) Radius of curvature to use.
				? start.get("curvatureFace1")
				: start.get("curvatureFace2"),
			dnR = 0;                            // {number} (1/mm) Scaled inverse curvature.

		// Endcap: Normal incidence non-astigmatic curved mirror.
		if (isFirst && type === LaserCanvas.Element.Dielectric.eType.Endcap) {
			return new Matrix2x2(1, 0, roc === 0 ? 0 : 2 / roc, 1);
		}

		// Refractive index and angles.
		// Curvature and refractive indices
		//  - Always R < 0 for focusing
		//  - Always n2 = n; n1 = 1.00
		// Angles
		//  - Input  -->--  q2 = qInt, q1 = qExt
		//  - Input  --<--  q2 = qExt, q1 = qInt
		//  - Output -->--  q2 = qExt, q1 = qInt
		//  - Output --<--  q2 = qInt, q1 = qExt
		if ((isFirst && dir > 0) || (!isFirst && dir < 0)) {
			// Entering block.
			n1 = 1.00;
			n2 = nint;
			q1 = qext;
			q2 = qint;
		} else {
			// Exiting block.
			// What new devilry is this? Why are  n1 = 1 and  n2 = n for
			// both entering and exiting the material?
			//
			// It turns out this is the only way to get normal-incidence
			// lensmaker's cavity to work, to wit:
			//
			// |----()----| Lens with f = 200 mm
			// |---(::)---| Thin material with n = 2, R = 400.
			//
			// Lensmakers formula
			//
			//   1             /  1     1  \
			//  --- = (n - 1) |  --- - ---  |
			//   f             \ R_1   R_2 /
			//
			// although we're using the opposite sign convention for R_2.
			// The implications are that angled, curved interfaces *may*
			// not give correct results.
			//  - The normal incidence case has been checked against the
			//    lensmaker's formula.
			//  - The flat face case is independent of n, since the only
			//    elements to involve the refractive index are scaled by
			//    1 / R;  the other (diagonal) elements depend on angles
			//    only.  Inspection of the beam behaviour  (expansion in
			//    the tangential plane by the projection angle) suggests
			//    that these calculations are correct.
			//  - I don't have an easy way to  check the curved,  angled
			//    case. The values here agree with with those calculated
			//    by the desktop LaserCanvas app.
			n1 = 1.00;
			n2 = nint;
			q1 = qint;
			q2 = qext
		}

		cosq1 = Math.cos(q1);
		cosq2 = Math.cos(q2);

		// Sagittal or tangential.
		//  n1 sin q1 = n2 sin q2
		//     dn_sag = n2 cos q2 - n1 cos q1 
		//               n2 cos q2 - n1 cos q1
		//     dn_tan = -----------------------
		//                   cos q1 cos q2
		//    Sagittal             Tangential
		//    [              ]     [  cos q2             ]
		//    [    1       0 ]     [ --------      0     ]
		//    [              ]     [  cos q1             ]
		//    [              ]     [                     ]
		//    [  dn_sag      ]     [  dn_tan     cos q1  ]
		//    [ --------   1 ]     [ --------   -------- ]
		//    [     R        ]     [     R       cos q2  ]
		if (plane === LaserCanvas.Enum.modePlane.sagittal) {
			if (roc === 0) {
				dnR = 0;
			} else {
				// This is wrong: dn = n2 * cosq2 - n1 * cosq1;
				dn = nint * Math.cos(qint) - 1.00 * Math.cos(qext);
				dnR = dn / roc;
			}
			abcd = new Matrix2x2(1, 0, dnR, 1);
		} else {
			if (roc === 0) {
				dnR = 0;
			} else {
				// This is wrong: dn = (n2 * cosq2 - n1 * cosq1) / (cosq1 * cosq2);
				dn = (nint * Math.cos(qint) - 1.00 * Math.cos(qext)) / (cosq1 * cosq2);
				dnR = dn / roc;
			}
			abcd = new Matrix2x2(cosq2 / cosq1, 0, dnR, cosq1 / cosq2);
		}
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
	atLocation: function (pt, tol) {
		var U,
			Vector = LaserCanvas.Math.Vector; // {function} Constructor function for Vector.
		if (this === this.group[0]) {
			// Allow first only. 
			U = new Vector([pt.x - this.loc.x, pt.y - this.loc.y]) // {Vector} Vector from first element to mouse..
				.rotate(this.loc.q); // .. Rotated by axis direction.
			return Math.abs(U[1]) < tol &&
				U[0] > -tol && U[0] < this.get("thickness") + tol;
		}
		return false;
	},
	
	/**
	* Draw this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	*/
	draw: function (render, layer) {
		var 
			eType = LaserCanvas.Element.Dielectric.eType,
			renderLayer = LaserCanvas.Enum.renderLayer, // {Enum} Layer to draw.
			r = 20,               // {number} Radius ("width") of dielectric block.
			l, qf, tan1, tan2, path, endcap, // Drawing variables.
			
			// Create a string command, rounding
			// the coordinates as needed.
			// @param {string} type Type of command "M"|"L".
			// @param {number} x Horizontal value to use.
			// @param {number} y Vertical value to use.
			// @returns {string} Command corresponding to given parameters.
			cmd = function (type, x, y) {
				return [type, x.toFixed(2), y.toFixed(2)].join(' ');
			},
			
			// Create the path for a single face.
			// @param {number} roc Radius of curvature, used to approximate curvature.
			// @param {number} l Horizontal offset (distance).
			// @param {number} s Set to -1 to flip the coordinates.
			// @param {number} tan Skew factor to use.
			// @returns {Array<string>} Array of commands for face.
			createFace = function (roc, l, s, tan) {
				var c, k, kk, x, y,
					cmds = [], // {Array<string>} Returned commands.
					// dx = [0.13, 0.12, 0.11, 0.08, 0.04],
					dx = [0.0, -0.01, -0.02, -0.05, -0.09],
					n = dx.length - 1;
										
				if (roc === 0) {
					// Flat face.
					cmds = [
						cmd("L", l - s * tan, -s * r),
						cmd("L", l + s * tan,  s * r)
					];
				} else {
					// Curvature deflection (indicative only).
					c = s * 20 * (roc < 0 ? -1 : +1) * (Math.abs(roc) < 300 ? 2 : 1);
						
					for (k = -n; k <= n; k += 1) {
						kk = k < 0 ? -k : k;
						x = c * dx[kk];  // {number} Horizontal shift.
						y = k / n;       // {number} [-1 .. 1] Vertical position.
						cmds.push(cmd("L", l + s * y * tan + x, s * r * y));
					}
				}
				return cmds;
			},

			// Create the path for a prism.
			// @param {number} n Refractive index to use.
			// @param {number} s Set to -1 to flip.
			createPrismPath = function (n, s) {
				var 
					qB = Math.atan(n),           // {number} (rad) Brewster's angle.
					a = Math.PI - 2 * qB,        // {number} (rad) Apex angle.
					h = l / 2 / Math.tan(a / 2), // {number} (mm) Distance to reach apex.
					rApex = 5,//TODO: Figure this out to reach apex.

					cmds = [
						cmd("M", l / 2, -s * h),
						cmd("L", l - s * tan2, s * r),
						cmd("L", 0 + s * tan2, s * r)
					];
				return cmds;
			};

		// Draw full element at first of group.
		if (this === this.group[0]) {
			switch (layer) {
				case renderLayer.optics:
					// Parameters.
					endcap = this.prop.type === eType.Endcap;
					r = 20;                             // {number} Radius ("width") of dielectric block.
					l = this.get("distanceToNext")      // {number} Length of dielectric block.
						+ this.group[1].get("distanceToNext"); // Plus thermal lens.
					qf = -this.get("derivedFaceAngle"); // {number} (rad) Angle of face, relative to internal propagation axis.
					tan2 = r * Math.tan(qf || 1e-3);    // {number} Face angle secant, for face offset.
					tan1 = endcap ? 0 : tan2;           // {number} Face angle on first face.
					
					// Assemble path.
					if (this.group[0].prop.type === eType.Prism) {
						path = createPrismPath(this.get("refractiveIndex"), this.prop.flip ? -1 : +1).concat("ZFS")
							.join(' ');
					} else {
						path = [cmd("M", 0.5 * l + tan1, r)].concat(
							createFace(this.get("curvatureFace2"), l, -1, tan2),
							createFace(this.get("curvatureFace1"), 0, +1, tan1),
							"ZFS").join(' ');
					}

					// Render path.
					render
						.save()
						.setStroke('#000', 1)
						.createPattern(LaserCanvas.theme.current.blockFill)
						.drawPath(path, this.loc.x, this.loc.y, -this.loc.q)
						.restore();
					break;
					
				case renderLayer.annotation:
					render.fillText(LaserCanvas.Utilities.numberFormat(this.get("refractiveIndex")), this.loc.x, this.loc.ylog);
					break;
			}
		}
		
		if (layer === renderLayer.annotation) {
			if (this === this.group[0] || this === this.group[this.group.length - 1]) {
				render.fillText(this.name, this.loc.x, this.loc.y, -0.3 * this.name.length, 1.2);
			}
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
