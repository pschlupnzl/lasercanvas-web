/**
* LaserCanvas - Interface to dielectric block element.
* @param {string:Dielectric.eType} blockType Type of block. If not set, assume output face.
*/
window.LaserCanvas.Element.Dielectric = function (blockType) {
	"use strict";
	this.type = 'Dielectric'; // {string} Primitive element type.
	this.name = 'D'; // {string} Name of this element (updated by System).
	this.loc = {   // Location on canvas.
		x: 0,       // {number} (mm) Horizontal location of element.
		y: 0,       // {number} (mm) Vertical location of element.
		p: 0,       // {number} (rad) Rotation angle of incoming axis.
		q: 0,       // {number} (rad) Rotation angle of outgoing axis.
		l: 0        // {number} (mm) Distance to next element.
	};
	this.group = [];              // {Array<Element>} Related elements: Input interface, lens, output interface.
	this.prop = {};     // {object} Public properties.
	this.priv = {};     // {object} Private properties.
	this.setDefaults(blockType);
	
	// Updated externally.
	this.abcdQ = {}; // {object<object>}} ABCD propagation coefficient after this optic.
};

// Types of dielectric block elements (affects angle calculations).
window.LaserCanvas.Element.Dielectric.eType = {
	Plate: 'Plate',        // Plate at arbitrary incidence angle.
	Brewster: 'Brewster',  // Brewster plate, incidence A = atan(n).
	Crystal: 'Crystal',    // Crystal. Angle is face normal to centerline, external incidence angle sinB = n sinA.
	Prism: 'Prism',        // Brewster-angled prism.
	Endcap: 'Endcap'       // Resonator end-coated.
};

// Default values to use when creating a group.
window.LaserCanvas.Element.Dielectric.propertyDefault = {
	refractiveIndex: 1.5,  // {number} Default refractive index.
	thickness: 20          // {number} (mm) Default thickness.
};

// -------------------------------------------------------
//  Create a new group
// -------------------------------------------------------
// @param {Element} prevElement Previous element in chain, whose distance to set.
// @param {number} segZ (mm) Distance along the segment where to insert.
// @returns {Array<Element>} Elements to insert.
window.LaserCanvas.Element.Dielectric.createGroup = function (prevElement, segZ) {
	"use strict";
	var Dielectric = window.LaserCanvas.Element.Dielectric, // {object} Namespace.
		segLen = prevElement.property('distanceToNext'), // {number} (mm) Distance on segment being inserted.
		propertyDefault = Dielectric.propertyDefault,    // {object} Default values for properties.
		len = propertyDefault.thickness,     // {number} (mm) Thickness of dielectric group.
		n = propertyDefault.refractiveIndex, // {number} Refractive index.
		elements = [
			new this(Dielectric.eType.Plate),        // {Dielectric} Input interface (first element, with all the properties)
			new window.LaserCanvas.Element.Lens(),   // {Lens} Thermal lens.
			new this()                               // {Dielectric} Output interface.
		];
	// Input face.
	elements[0].group = elements[2].group = elements;
	elements[0].property('thickness', len);        // {number} (mm) Thickness of dielectric block group.
	elements[0].property('refractiveIndex', n);    // {number} Refractive index.
	
	// Thermal lens.
	elements[0].updateThermalLens();
	
	// Distances.
	elements[2].property('distanceToNext', Math.max(0, segLen - segZ - len / 2)); // Remaining distance.
	prevElement.property('distanceToNext', Math.max(0, segZ - len / 2)); // Set new distance.
	return elements;
};

// Collect groups from a given system.
// @param {Array<object:Elements>} elements Elements of the system to combine.
window.LaserCanvas.Element.Dielectric.collectGroups = function (elements) {
	"use strict";
	var k, m,        // {number} Element loop counters.
		element,      // {object:Element} Iterated element.
		group = null; // {Array<object:Element>} Grouped elements.

	for (k = 0; k < elements.length; k += 1) {
		element = elements[k];
		if (group === null && element.hasOwnProperty('group')) {
			// Start a new group.
			group = [element];
			if (element.type === 'Dielectric') {
				element.priv.thickness = element.loc.l;
			}
			
		} else if (group) {
			switch (element.type) {
				case 'Lens':
					// Continue group.
					group.push(element);
					break;
			
				case 'Dielectric':
				case 'Dispersion':
					// Finish group.
					group.push(element);
					for (m = 0; m < group.length; m += 1) {
						if (group[m].hasOwnProperty('group')) {
							group[m].group = group;
						}
					}
					if (group[0].type === 'Dielectric') {
						group[0].updateAngles();
						////group[0].updateThermalLens();
					} else {
						group[0].updateAngles();
					}
					group = null;
					break;
			}
		}
	}
};

window.LaserCanvas.Element.Dielectric.prototype = {
	/** 
	* Set the default public and private properties based
	* on the placement of the interface to the block.
	* @param {string:Dielectric.eType} blockType Type of block. If not set, assume output face.
	*/
	setDefaults: function (blockType) {
		"use strict";
		var Dielectric = window.LaserCanvas.Element.Dielectric; // {object} Namespace.

		if (blockType) {
			this.prop = {
				type: blockType,           // {string:Enum} Type of dielectric element (see Dielectric.type enum) 'Plate'|'Brewster'|'Crystal'.
				refractiveIndex: 1,        // {number} Refractive index.
				groupVelocityDispersion: 0,// {number} (um^-2) Group velocity dispersion for ultrafast calculations.
				angleOfIncidence: 0,       // {number} (rad) Angle of incidence. Auto-calculated for Brewster and Crystal.
				faceAngle: 0,              // {number} (rad) Face angle relative to internal propagation for Crystal (also used for painting).
				flip: false,               // {boolean} Value indicating whether Brewster angle is flipped.
				curvatureFace1: 0,         // {number} (mm) Radius of curvature for input interface, or 0 for flat.
				curvatureFace2: 0,         // {number} (mm) Radius of curvature for output interface, or 0 for flat.
				thermalLens: 0             // {number} (mm) Focal length of thermal lens, or 0 for none.
			};
			
			this.priv = {
				thickness: 0,        // {number} (mm) Thickness of element (opening element only).
				deflectionAngle: 0   // {number} (rad) Deflection angle from axes, used when setting properties in location().
			}
		}
	},
	
	
	/**
	* Re-calculate angles based on new values and type.
	* It is assumed that any and all properties are set.
	* This method overrides any derived quantities and 
	* sets the remaining values.
	* @param {number} angleOfIncidence (rad) Angle of incidence to set (for Plate).
	* @param {number} refractiveIndex Refractive index to set.
	*/
	updateAngles: function () {
		"use strict";

		var eType = window.LaserCanvas.Element.Dielectric.eType,
			maxA = 80 * Math.PI / 180,     // {number} Maximum angle of incidence.
			A, B, C, nsinB,                // Temporary variables.
			n = this.prop.refractiveIndex; // {number} Refractive index (must be n >= 1).
		
		// Boundary conditions.
		if (n < 1.0) {
			n = this.prop.refractiveIndex = 1.0;
		}
		
		// Brewster plate: Fix external angle of incidence.
		if (this.prop.type === eType.Brewster
			|| this.prop.type === eType.Prism) {
			this.prop.angleOfIncidence = (this.prop.flip ? -1 : +1) *
				Math.atan(this.prop.refractiveIndex);
		}
		
		// Limit angles.
		if (this.prop.angleOfIncidence > maxA) {
			this.prop.angleOfIncidence = maxA;
		} else if (this.prop.angleOfIncidence < -maxA) {
			this.prop.angleOfIncidence = -maxA;
		}
		
		// Derived angles.
		switch (this.prop.type) {
			case eType.Plate:
			case eType.Brewster:
			case eType.Prism:
				// External angle A, internal angle B, deflection angle C.
				// Snell's law:  sinA = n sinB
				//                  B = asin(sinA / n).
				// Geometry:         A = B + C
				//                   C = A - B.
				A = this.prop.angleOfIncidence; // {number} (rad) External incidence angle.
				B = Math.asin(Math.sin(A) / n); // {number} (rad) Internal propagation angle.
				C = A - B;                      // {number} (rad) Deflection angle.
				this.prop.faceAngle = B;        // Face angle, relative to internal propagation axis.
				this.priv.deflectionAngle = C;
				break;
				
			case eType.Crystal:
			case eType.Endcap:
				// Face normal angle B, external angle A, deflection angle C.
				// Snell's law:  sinA = nsinB
				//                  A = asin(n sinB) (up to TIR)
				// Geometry:    B + C = A
				//                  C = A - B.
				B = this.prop.faceAngle;        // {number} (rad) Face (normal) angle to internal propagation.
				nsinB = n * Math.sin(B);        // External angle product.
				A = nsinB < -1 ? -Math.PI / 2 : // {number} (rad) External incidence angle.
					nsinB > +1 ? +Math.PI / 2 :  // Protect against TIR.
					Math.asin(nsinB);            // Angles are good.
				C = A - B;                      // {number} (rad) Deflection angle.
				this.prop.angleOfIncidence = A;
				this.priv.deflectionAngle = C;
				break;

			// // case eType.Prism:
			// // 	window.LaserCanvas.Element.Dispersion.brewsterPrism(this.prop.refractiveIndex, 0, this.priv);
			// // 	console.log("prism priv->", this.priv);
			// // 	break;
		}
			
		// Thickness.
		this.updateThermalLens();
	},
	
	/**
	* Update the internal and thermal lens properties.
	* These are distances, not angles.
	*/
	updateThermalLens: function () {
		"use strict";
		var len = 
				this.prop.type === window.LaserCanvas.Element.Dielectric.eType.Endcap
				? this.priv.thickness 
				: this.priv.thickness / Math.cos(this.prop.faceAngle),
			l1 = this.prop.thermalLens === 0 ? len : len / 2, // {number} (mm) Propagation before lens.
			l2 = len - l1;  // {number} (mm) Propagation after lens.
		
		this.group[0].loc.l = l1;
		this.group[1].setThermalLens(
			this.prop.thermalLens, 
			this.prop.refractiveIndex, 
			l2);
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
		"use strict";
		prevElement.property('distanceToNext', 
			prevElement.property('distanceToNext') 
			+ this.group[0].property('thickness')
			+ this.group[this.group.length - 1].property('distanceToNext'));
		return this.group.length;
	},
	
	/**
	* Gets or sets the location for this element.
	* @param {object} ax When setting, the incoming axis and Cartesian coordinates for the element.
	* @returns {object} The element location object.
	*/
	location: function (ax) {
		"use strict";
		var outDefl = this.group[0].prop.type === window.LaserCanvas.Element.Dielectric.eType.Prism ? +1 : -1;

		if (ax) {
			this.loc.x = ax.x;
			this.loc.y = ax.y;
			this.loc.q = this.loc.p = ax.q; // {number} (rad) Incoming axis.

			this.loc.q += this.group[0].priv.deflectionAngle * (
				this === this.group[0] ? +1 :
				this === this.group[this.group.length - 1] ? outDefl :
				0);
		}

		return window.LaserCanvas.Utilities.extend(
			window.LaserCanvas.clone(this.loc), {
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
		"use strict";
		var k,
			eType = window.LaserCanvas.Element.Dielectric.eType,
			props = [],

			allProps = {
				type: {
					propertyName: 'type',
					options: ['Plate', 'Brewster', 'Crystal', 'Prism'],
					infoPanel: false
				},
				refractiveIndex: {
					propertyName: 'refractiveIndex',
					increment: 0.1,
					min: 1
				},
				groupVelocityDispersion: {
					propertyName: 'groupVelocityDispersion',
					increment: 0.001
				},
				thickness: {
					propertyName: 'thickness',
					increment: 1,
					min: 1
				},
				curvatureFace1: {
					propertyName: 'curvatureFace1',
					increment: 10
				},
				curvatureFace2: {
					propertyName: 'curvatureFace2',
					increment: 10
				},
				angleOfIncidence: {
					propertyName: 'angleOfIncidence',
					increment: 1,
					min: -85,
					max: +85
					////propertyPanel: this.prop.type === eType.Plate
				},
				flip: {
					propertyName: 'flip',
					dataType: 'boolean',
					infoPanel: false,
					propertyPanel: this.prop.type === eType.Brewster || this.prop.type === eType.Prism
				},
				faceAngle: {
					propertyName: 'faceAngle',
					increment: 1,
					min: -85,
					max: +85
					////propertyPanel: this.prop.type === eType.Crystal || this.prop.type === eType.Endcap
				}, 
				thermalLens: {
					propertyName: 'thermalLens',
					increment: 10
					////propertyPanel: this.prop.type === eType.Crystal || this.prop.type === eType.Endcap
				}
			},
			elementProps =
				this.prop.type === eType.Plate ? ["type", "refractiveIndex", "groupVelocityDispersion", "thickness", "curvatureFace1", "curvatureFace2", "angleOfIncidence", "flip"] :
				this.prop.type === eType.Brewster ? ["type", "refractiveIndex", "groupVelocityDispersion", "thickness", "flip"] :
				this.prop.type === eType.Crystal ? ["type", "refractiveIndex", "groupVelocityDispersion", "thickness", "curvatureFace1", "curvatureFace2", "flip", "faceAngle", "thermalLens"] :
				this.prop.type === eType.Prism ? ["type", "refractiveIndex", "thickness", "flip"] :
				this.prop.type === eType.Endcap ? ["refractiveIndex", "groupVelocityDispersion", "thickness", "curvatureFace1", "curvatureFace2", "flip", "faceAngle", "thermalLens"] :
				"";

		// No properties except for first element.
		if (this === this.group[0]) {
			for (k = 0; k < elementProps.length; k += 1) {
				props.push(allProps[elementProps[k]]);
			}
		}
		
		/*
		// Properties all for first element in group.
		if (this.prop.type !== eType.Endcap) {
			props = props.concat([
				{
					propertyName: 'type',
					options: ['Plate', 'Brewster', 'Crystal', 'Prism'],
					infoPanel: false
				}]);
		}
		
		// Standard properties.
		props = props.concat([
			{
				propertyName: 'refractiveIndex',
				increment: 0.1,
				min: 1
			}]);
		
		if (this.prop.type !== eType.Prism) {
			props = props.concat(
				{
					propertyName: 'groupVelocityDispersion',
					increment: 0.001
				});
		}

		props = props.concat({
			propertyName: 'thickness',
			increment: 1,
			min: 1
		});

		// Curvatures: Not for Brewster.
		if (this.prop.type !== eType.Brewster
			&& this.prop.type !== eType.Prism) {
			props = props.concat([
			{
				propertyName: 'curvatureFace1',
				increment: 10
			}, {
				propertyName: 'curvatureFace2',
				increment: 10
			}]);
		}
			
		// Plate.
		if (this.prop.type === eType.Plate) {
			props = props.concat([
			{
				propertyName: 'angleOfIncidence',
				increment: 1,
				min: -85,
				max: +85
				////propertyPanel: this.prop.type === eType.Plate
			}]);
		}
		
		// Brewster.
		props = props.concat([
		{
			propertyName: 'flip',
			dataType: 'boolean',
			infoPanel: false,
			propertyPanel: this.prop.type === eType.Brewster || this.prop.type === eType.Prism
		}]);
		
		// Crystal and endcap.
		if (this.prop.type === eType.Crystal 
			|| this.prop.type === eType.Endcap) {
			props = props.concat([
			{
				propertyName: 'faceAngle',
				increment: 1,
				min: -85,
				max: +85
				////propertyPanel: this.prop.type === eType.Crystal || this.prop.type === eType.Endcap
			}, {
				propertyName: 'thermalLens',
				increment: 10
				////propertyPanel: this.prop.type === eType.Crystal || this.prop.type === eType.Endcap
			}]);
		}
		*/
		return props;
	},
	
	/**
	* Gets a value indicating whether this element can adjust transfer properties.
	* @param {string} propertyName Name of property being probed 'distanceToNext'|'deflectionAngle'.
	*/
	canSetProperty: function (propertyName) {
		"use strict";
		var eType = window.LaserCanvas.Element.Dielectric.eType,     // {string:Enum} Type of dielectric block.
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
			outgoingAngle: endcap // Used for cavity geometry adjustment.
		}[propertyName] || false;
	},
	
	/**
	* Sets internal parameters to match new property value -OR- gets the current value.
	* Gets or sets internal parameters to match new property value.
	* @param {string} propertyName Name of property to set 'distanceToNext' etc.
	* @param {number|boolean=} newValue (mm|rad) New target value to set, if any.
	* @param {...=} arg Additional argument, if needed.
	* @returns {number=} The current value, if retrieving only.
	*/
	property: function (propertyName, newValue, arg) {
		"use strict";
		var eType = window.LaserCanvas.Element.Dielectric.eType;
		// Set value, if specified.
		if (newValue !== undefined) {
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
				case 'type':
					switch (newValue) {
						case eType.Plate:
							this.prop.thermalLens = 0;
							break;
						case eType.Brewster:
						case eType.Prism:
							this.prop.thermalLens =
								this.prop.curvatureFace1 =
								this.prop.curvatureFace2 = 0;
							break;
					}
					this.prop[propertyName] = newValue;
					this.updateAngles();
					break;
					
				case 'flip':
				case 'refractiveIndex':
				case 'curvatureFace1':
				case 'curvatureFace2':
					this.prop[propertyName] = newValue;
					this.updateAngles();
					break;
					
				case 'thickness':
					if (this.priv.thickness !== newValue) {
						// Compensate thickness change.
						this.group[this.group.length - 1].property('distanceToNext', Math.max(0, 
							this.group[this.group.length - 1].property('distanceToNext') 
							+ this.priv.thickness - newValue));
						this.priv[propertyName] = newValue;
						this.updateThermalLens();
					}
					break;
					
				case 'angleOfIncidence':
				case 'faceAngle':
					this.prop[propertyName] = newValue * Math.PI / 180.00;
					this.updateAngles();
					break;
					
				case 'groupVelocityDispersion':
					this.prop[propertyName] = newValue;
					break;
				
				case 'thermalLens':
					this.prop[propertyName] = newValue;
					this.updateThermalLens();
					break;
				
				case 'distanceToNext': // {number} (mm) New distance to next element.
					this.loc.l = newValue;
					break;
					
				case 'outgoingAngle':
					// newValue {number} (rad) New outgoing angle on canvas.
					// arg {boolean} Value indicating whether this is first element in cavity.
					if (arg) {
						this.loc.q = newValue;
					}
					break;
			}
		} else {
			// Otherwise, return the current value.
			switch (propertyName) {
				case 'angleOfIncidence':
				case 'faceAngle':
					return this.prop[propertyName] * 180.00/ Math.PI;
					
				case 'curvatureFace1':
				case 'curvatureFace2':
				case 'type':            // {string} Dielectric block type.
				case 'refractiveIndex': // {number} Refractive index.
				case 'groupVelocityDispersion': // {number} (um^-2) Group velocity dispersion.
				case 'flip':            // {boolean} Value indicating whether to flip a Brewster plate.
				case 'thermalLens':     // {number} (mm) Focal length of thermal lens, or 0 for none.
					return this.prop[propertyName];

				case 'thickness':       // {number} (mm) Thickness of element.
					return this.priv[propertyName];
					
				case 'distanceToNext': // {number} (mm) Distance to next element.
					return this.loc.l;
			}
		}
	},
	
	/**
	* Return the group delay dispersion for the element.
	* @param {number} lam (nm) Wavelength (note units nm).
	* @returns {number} (fs^2/rad) Group delay dispersion.
	*/
	groupDelayDispersion: window.LaserCanvas.Element.groupDelayDispersion,
	
	////groupDelayDispersion: function (lam) {
	////	"use strict";
	////	// Group delay dispersion (see e.g. https://www.newport.com/n/the-effect-of-dispersion-on-ultrashort-pulses)
	////	// 
	////	//         lam^3      d^2 n
	////	// GDD = ---------- --------- L.
	////	//        2 pi c^2   d lam^2
	////	//
	////	// Units:
	////	//           [nm^3]       1
	////	//     = ------------- -------- [mm]
	////	//        [um^2/fs^2]   [um^2]
	////	//
	////	//     = [nm^3 mm /um^4] [fs^2].
	////	//
	////	//     = -9 * 3 - 3 / -6 * 4
	////	//     = -30 / -24
	////	//     = -6.
	////	
	////	var c = 0.299792458; // {number} (um/fs) Speed of light.
	////	return this === this.group[0]
	////		? 1e-6 * lam * lam * lam / (2 * Math.PI * c * c) * this.prop.groupVelocityDispersion * this.loc.l
	////		: 0;
	////},
	
	/**
	* Return the ABCD matrix for this element.
	* @param {number} dir Direction -1:backwards|+1:forwards
	* @param {number.Enum:modePlane} plane Sagittal or tangential plane.
	* @returns {Matrix2x} Transfer matrix.
	*/
	elementAbcd: function (dir, plane) {
		"use strict";
		var LaserCanvas = window.LaserCanvas,  // {object} Namespace.
			Matrix2x2 = LaserCanvas.Math.Matrix2x2,
			abcd,                               // {object:Matrix2x2} Returned matrix.
			n1, n2, q1, q2, cosq1, cosq2, dn,   // Temporary variables.
			prop = this.group[0].prop,          // Starting element with all the properties.
			isFace1 = this === this.group[0],   // {boolean} Value indicating whether this is face 1 (false means face 2).
			n = prop.refractiveIndex,           // {number} Refractive index within dielectric block.
			q0 = prop.angleOfIncidence,         // {number} (rad) Angle of incidence (assume parallel faces).
			roc = isFace1                       // {number} (mm) Radius of curvature to use.
				? prop.curvatureFace1
				: -prop.curvatureFace2,
			dnR = 0;                            // {number} (1/mm) Scaled inverse curvature.

		// Endcap: Normal incidence non-astigmatic curved mirror.
		if (isFace1 && prop.type === LaserCanvas.Element.Dielectric.eType.Endcap) {
			return new Matrix2x2(1, 0, roc === 0 ? 0 : 2 / roc, 1);
		}
			
		// We work off the external angle of incidence.
		if ((dir > 0 && isFace1) || (dir < 0 && !isFace1)) {
			// ! C++ LaserCanvas does not distinguish the ABCD transfer !
			// ! matrix based on propagation direction, which I think   !
			// ! now is wrong. It's equivalent to   if (isFace1)        !
			n1 = 1.0;   // Incident from air.
			n2 = n;     // Going into dielectric.
			q1 = q0;    // {number} (rad) External angle of incidence.
			q2 = Math.asin(Math.sin(q0) / n); // {number} (rad) Internal angle of refraction.
		} else {
			n1 = n;     // Incident from dielectric.
			n2 = 1.0;   // Going into air.
			q1 = Math.asin(Math.sin(q0) / n); // {number} (rad) Internal angle of refraction.
			q2 = q0;    // {number} (rad) External angle of incidence.
		}
		cosq1 = Math.cos(q1);
		cosq2 = Math.cos(q2);
		
		// Sagittal or tangential.
		if (plane === LaserCanvas.Enum.modePlane.sagittal) {
			if (roc !== 0) {
				dn = n2 * cosq2 - n1 * cosq1;
				dnR = dn / roc;
			}
			abcd = new Matrix2x2(1, 0, dnR, 1);
		} else {
			if (roc !== 0) {
				dn = (n2 * cosq2 - n1 * cosq1) / (cosq1 * cosq2);
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
		"use strict";
		var U,
			Vector = window.LaserCanvas.Math.Vector; // {function} Constructor function for Vector.
		if (this === this.group[0]) {
			// Allow first only. 
			U = new Vector([pt.x - this.loc.x, pt.y - this.loc.y]) // {Vector} Vector from first element to mouse..
				.rotate(this.loc.q); // .. Rotated by axis direction.
			return Math.abs(U[1]) < tol &&
				U[0] > -tol && U[0] < this.priv.thickness + tol;
		}
		return false;
	},
	
	/**
	* Draw this object.
	* @param {Render} render Rendering context.
	* @param {LaserCanvas.renderLayer} layer Rendering layer.
	*/
	draw: function (render, layer) {
		"use strict";
		var 
			eType = window.LaserCanvas.Element.Dielectric.eType,
			renderLayer = LaserCanvas.Enum.renderLayer, // {Enum} Layer to draw.
			r = 20,               // {number} Radius ('width') of dielectric block.
			l, qf, tan1, tan2, path, endcap, // Drawing variables.
			
			// Create a string command, rounding
			// the coordinates as needed.
			// @param {string} type Type of command 'M'|'L'.
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
						cmd('L', l - s * tan, -s * r),
						cmd('L', l + s * tan,  s * r)
					];
				} else {
					// Curvature deflection (indicative only).
					c = s * 20 * (roc < 0 ? -1 : +1) * (Math.abs(roc) < 300 ? 2 : 1);
						
					for (k = -n; k <= n; k += 1) {
						kk = k < 0 ? -k : k;
						x = c * dx[kk];  // {number} Horizontal shift.
						y = k / n;       // {number} [-1 .. 1] Vertical position.
						cmds.push(cmd('L', l + s * y * tan + x, s * r * y));
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
						cmd('M', l / 2, -s * h),
						cmd('L', l - s * tan2, s * r),
						cmd('L', 0 + s * tan2, s * r)
					];
				return cmds;
			};

		// Draw full element at first of group.
		if (this === this.group[0]) {
			switch (layer) {
				case renderLayer.optics:
					// Parameters.
					endcap = this.prop.type === eType.Endcap;
					r = 20;                          // {number} Radius ('width') of dielectric block.
					l = this.loc.l                   // {number} Length of dielectric block.
						+ this.group[1].property('distanceToNext'); // Plus thermal lens.
					qf = -this.prop.faceAngle;       // {number} (rad) Angle of face, relative to internal propagation axis.
					tan2 = r * Math.tan(qf || 1e-3); // {number} Face angle secant, for face offset.
					tan1 = endcap ? 0 : tan2;        // {number} Face angle on first face.
					
					// Assemble path.
					if (this.group[0].prop.type === eType.Prism) {
						path = createPrismPath(this.prop.refractiveIndex, this.prop.flip ? -1 : +1).concat('ZFS')
							.join(' ');
					} else {
						path = [cmd('M', 0.5 * l + tan1, r)].concat(
							createFace(this.prop.curvatureFace2, l, -1, tan2),
							createFace(this.prop.curvatureFace1, 0, +1, tan1),
							'ZFS').join(' ');
					}

					// Render path.
					render
						.save()
						.setStroke('#000', 1)
						.createPattern(window.LaserCanvas.theme.current.blockFill)
						.drawPath(path, this.loc.x, this.loc.y, -this.loc.q)
						.restore();
					break;
					
				case renderLayer.annotation:
					render.fillText(window.LaserCanvas.Utilities.numberFormat(this.prop.refractiveIndex), this.loc.x, this.loc.ylog);
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
		"use strict";
		return this.draw(render, layer);
	}
};