/**
 * Loading of systems, i.e., converting data file to internal representation.
 */

(function (LaserCanvas) {
	var
		/** LaserCanvas v5 has (0, 0) bottom left; web is top left. */
		FLIP = -1,
		// ------------
		//  Variables.
		// ------------

		/**
		 * Retrieve variable declarations, returning an object
		 * with the variable values and ranges.
		 * @param {object} root Parsed root object.
		 */
		getVariables = function (root) {
			var get = function (name) {
				var value = root["Variable(" + name + ")"] || "0",
					range = (root["Range(" + name + ")"] || "0,1").split(",");
				return {
					value: +value,
					min: +range[0],
					max: +range[1]
				};
			};
			return {
				x: get("x"),
				y: get("y"),
				z: get("z")
			};
		},

		/**
		 * Returns the numerical value of the expression. If the expression
		 * contains variables, they are substituted.
		 * In the future, we will want to retain equations.
		 * @param {string} expression Equation to be evaluated.
		 * @param {object} variables Variable values.
		 */
		toNumber = function (expression, variables) {
			// TODO:
			// This into a separate Equation utility method
			// Avoid using eval (?)
			var expr = expression
				.replace(/(x|y|z)/g, function (m, name) {
					return "(" + variables[name].value + ")";
				})
				.replace(/(\W)(sin|cos)(\W)/g, "$1Math.$2$3");
			value = eval(expr);
			return value;
		},

		// -----------
		//  Elements.
		// -----------

		toBlockType = {
			"CrystalInput": LaserCanvas.Element.Dielectric.eType.Crystal,
			"CrystalOutput": LaserCanvas.Element.Dielectric.eType.Crystal,
			"BrewsterInput": LaserCanvas.Element.Dielectric.eType.Brewster,
			"BrewsterOutput": LaserCanvas.Element.Dielectric.eType.Brewster,
			"PlateInput": LaserCanvas.Element.Dielectric.eType.Plate,
			"PlateOutput": LaserCanvas.Element.Dielectric.eType.Plate,
		},

		/**
		 * Create the system elements into the given array.
		 * @param {Array<Element>} melements Array of elements to be filled.
		 * @param {Array<object>} elements Source element data.
		 * @param {object} variables Variables used to evaluate expression to numeric values.
		 */
		createElements = function (melements, elements, variables) {
			if (elements[0].type !== "Mirror"
				|| elements[elements.length - 1].type !== "Mirror") {
				throw "First and last elements must be mirrors.";
			}

			// Prepare system.
			LaserCanvas.SystemUtil.resetElements(melements);

			// Add new elements.
			for (var index = 0; index < elements.length; index += 1) {
				var src = elements[index];
				var name = src.name;
				var props, element, linkedElement;

				switch (src.type) {
					case "Mirror":
						element = new LaserCanvas.Element.Mirror();
						props = {
							radiusOfCurvature: toNumber(src.ROC, variables),
							angleOfIncidence: FLIP * toNumber(src.FaceAngle, variables) * Math.PI / 180.00
						};
						break;

					case "ThinLens":
						// TODO: Check lens format in data file.
						element = new LaserCanvas.Element.Lens();
						props = {
							focalLength: toNumber(src.FL, variables)
						};
						break;

					case "Screen":
						element = new LaserCanvas.Element.Screen();
						break;

					case "BrewsterInput":
					case "CrystalInput":
					case "PlateInput":
						element = new LaserCanvas.Element.Dielectric(toBlockType[src.type]);
						props = {
							refractiveIndex: toNumber(src.RefractiveIndex, variables),
							flip: src.Flipped || false,
						};
						if (src.type === "CrystalInput") {
							props.faceAngle = toNumber(src.FaceAngle, variables) * Math.PI / 180;
						} else if (src.type === "PlateInput") {
							props.faceAngle = toNumber(src.FaceAngle, variables) * Math.PI / 180;
						}
						
						// groupVelocityDispersion: 0,// {number} (um^-2) Group velocity dispersion for ultrafast calculations.
						// angleOfIncidence: 0,       // {number} (rad) Angle of incidence. Auto-calculated for Brewster and Crystal.
						// faceAngle: 0,              // {number} (rad) Face angle relative to internal propagation for Crystal (also used for painting).
						// flip: false,               // {boolean} Value indicating whether Brewster angle is flipped.
						// curvatureFace1: 0,         // {number} (mm) Radius of curvature for input interface, or 0 for flat.
						// curvatureFace2: 0,         // {number} (mm) Radius of curvature for output interface, or 0 for flat.
						// thermalLens: 0             // {number} (mm) Focal length of thermal lens, or 0 for none.
// console.log(toBlockType[src.type], props)
						element.loc.l = toNumber(src.Thickness, variables);
						break;

					case "BrewsterOutput":
					case "CrystalOutput":
					case "PlateOutput":
						// TODO: Check for thermal lens in source
						melements.push(new LaserCanvas.Element.Lens());
						element = new LaserCanvas.Element.Dielectric(toBlockType[src.type]);

						// TODO: Search backwards.
						linkedElement = elements[index - 1];
						props = {};
						if (src.type === "CrystalOutput" || src.type === "PlateOutput") {
							props.angleOfIncidence = toNumber(linkedElement.FaceAngle, variables) * Math.PI / 180;
						}
// console.log("BBB", props)
						break;

					default:
						// Accumulate skipped element spacing.
						if (src.DistanceToNext) {
							melements[melements.length - 1].loc.l += toNumber(src.DistanceToNext, variables);
						}
console.log("Skipping element type " + src.type);
						continue;
				}

				// Properties.
				element.name = name;
				if (props) {
					for (var key in props) {
						if (props.hasOwnProperty(key)) {
							element.prop[key] = props[key];
						}
					}
				}

				// Distance to next.
				if (src.DistanceToNext !== undefined && index < elements.length - 1) {
					element.loc.l = toNumber(src.DistanceToNext, variables);
				}

				// Initialize (e.g. screen).
				if (element.init) {
					element.init()
				}

				// Append to list.
				melements.push(element);
			}

			// Finishing.
			if (melements.length < 2) {
				throw "Need at least two elements in the cavity.";
			}
			melements[0].startOptic = true;
			melements[melements.length - 1].endOptic = true;

			// Collect dielectrics into groups and force angle calculations.
			LaserCanvas.Element.Dielectric.collectGroups(melements);
			for (var element of elements) {
				if (element.updateAngles) {
					element.updateAngles();
				}
			}
		},

		// ----------
		//  Parsing.
		// ----------

		/** Regular expression matching a system name: [SystemName] */
		reSystemName = /^\[([^\]]+)\]$/m,

		/** Regular expression matching a system type: Resonator|... */
		reSystemType = /^(Resonator)$/m,

		/** Regular expression matching lines to ignore. */
		reIgnore = /^\s*(?:Selected|Astigmatic|)\s*$/m,

		/** Regular expression matching a property declaration: Property = Expression */
		rePropertyDeclaration = /^\s*([A-Za-z][^\s]*)\s*=\s*(.*)$/m,

		/** Regular expression matching boolan properties for elements. */
		reBooleanProperty = /^(Flipped)$/m,

		/** Regular expression matching an element declaration: Element @ Name = { */
		reElementDeclaration = /^(Mirror|ThinLens|Screen|BrewsterInput|BrewsterOutput|CrystalInput|CrystalOutput|PlateInput|PlateOutput|PrismA|PrismB)\s*@\s*([^\s]+)\s*{$/m,
	
		/** Regular expression matching a renderer declaration: Renderer 2d { */
		reRendererDeclaration = /^Renderer\s+(SystemGraph|2d)\s*\{$/m,
		/**
		 * Parse the LaserCanvas text format into an object, returning
		 * the object. Only the first system is returned.
		 * @param {string} text Text file to parse.
		 */
		parseTextFile = function (text) {
			var match,
				/** Text file split into lines. */
				lines = text.replace(/\n\r/g, "\n").split("\n"),
				/** First line, used as a check. */
				firstLines = lines.splice(0, 2),
				/** Root object being assembled. */
				root = {
					/** Array of elements in the system. */
					elements: [],
					/** Array of renderers (probably not used). */
					renderers: []
				},
				/** Reference to object at nested level. */
				curr = root,
				/** Nested tree. */
				stack = [curr];

			// First line: Check and system name.
			match = reSystemName.exec(firstLines[0]);
			if (!match) {
				throw "Wrong file format. Expected [SystemName] in first row.";
			}
			curr.name = match[1];

			// Second line: System type.
			match = reSystemType.exec(firstLines[1]);
			if (!match) {
				// TODO: Actually we CAN handle other types!
				throw "Unable to process system type " + firstLines[1];
			}
			curr.type = match[1];

			for (var line of lines) {

				if (reIgnore.test(line)) {
					// Ignored lines.
					continue;

				} else if (reSystemName.test(line)) {
					// Import first system only.
					// TODO: Warning instead of fail.
					throw "Only one system can be imported at once.";

				} else if (!!(match = rePropertyDeclaration.exec(line))) {
					// Property declarations.
					var prop = match[1],
						expr = match[2];
					curr[prop] = expr;

				} else if (!!(match = reBooleanProperty.exec(line))) {
					// Boolean value set to TRUE if statement is included.
					curr[match[1]] = true;

				} else if (!!(match = reElementDeclaration.exec(line))) {
					// Element blocks.
					curr = {
						type: match[1], // Mirror|Lens etc.
						name: match[2]
					};
					root.elements.push(curr);
					stack.push(curr);

				} else if (!!(match = reRendererDeclaration.exec(line))) {
					// Renderer block.
					curr = {
						type: match[1], // SystemGraph, 2d etc.
					};
					root.renderers.push(curr);
					stack.push(curr);

				} else if (line === "}") {
					// Unindent.
					if (stack.length <= 1) {
						throw "Bad file format, too many closing -}-";
					}
					curr = stack.pop();

				} else {
					throw "Unknown line " + line;
				}
			}
			return root;
		};
		
	/**
	 * Parse the text file, assumed to be in LaserCanvas 5
	 * data format, to create a system.
	 * @param {string} text Source of text file.
	 * @param {object} mprop System properties to set.
	 * @param {Array<Element>} melements System elements to update.
	 */
	function fromTextFile (text, mprop, melements) {
		var root = parseTextFile(text),
			variables = getVariables(root);

		// System properties.
		mprop.name = root.name;
		mprop.wavelength = toNumber(root.Wavelength, variables);

		// Elements.
		createElements(melements, root.elements, variables);

		// Initial location.
		LaserCanvas.Utilities.extend(melements[0].loc, {
			x: toNumber(root.StartX, variables),
			y: FLIP * toNumber(root.StartY, variables),
			q: FLIP * toNumber(root.Rotation, variables) * Math.PI / 180,
		});
	};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.fromTextFile = fromTextFile;
}(window.LaserCanvas));

// (function () {
window.LaserCanvas.SystemUtil.demoTextFile = function (mprop, melements) {
	var text =
`[Sys_023075d0]
Resonator
Variable(x) = 105.99
Range(x) = 80, 150
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = -21.8858
StartX = -88
StartY = 64
Mirror @ M3 {
   DistanceToNext = 146.932
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}
Screen @ I9 {
   DistanceToNext = 231.33
}
Mirror @ M2 {
   DistanceToNext = x
   FaceAngle = -11.0658
   ROC = 200
   ROC_tan = 200
}
BrewsterInput @ BI5 {
   LinkedTo = BO6
   RefractiveIndex = 1.5
   ROC = 0
   ROC_tan = 0
   Thickness = 10
}
BrewsterOutput @ BO6 {
   Selected
   LinkedTo = BI5
   DistanceToNext = x
   ROC = 0
   ROC_tan = 0
}
Mirror @ M1 {
   DistanceToNext = 203.38
   FaceAngle = -12.8854
   ROC = 200
   ROC_tan = 200
}
PrismA @ Pa7 {
   LinkedTo = Pb8
   DistanceToNext = 64.1979
   RefractiveIndex = 1.5
}
PrismB @ Pb8 {
   LinkedTo = Pa7
   DistanceToNext = 113.342
}
Mirror @ M4 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}

Renderer 2d {
   System = Sys_023075d0
   Window = 0, 0, 717, 446
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
Renderer SystemGraph {
   System = Sys_023075d0
   Window = 26, 26, 500, 369
   XMin = 80
   XMax = 150
   YMin = -1
   YMax = 1
   Variable = x
   Function = Stability
}
`;
	window.LaserCanvas.SystemUtil.fromTextFile(text, mprop, melements);
};
// }());
