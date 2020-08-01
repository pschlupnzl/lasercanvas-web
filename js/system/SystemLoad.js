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

		/**
		 * Returns the dielectric element eType for the type.
		 * @param {string} type Type label from data file.
		 */
		toBlockType = function (type) {
			switch (type) {
				case "CrystalInput":
				case "CrystalOutput":
					return LaserCanvas.Element.Dielectric.eType.Crystal;
				case "BrewsterInput":
				case "BrewsterOutput":
					return LaserCanvas.Element.Dielectric.eType.Brewster;
				case "PlateInput":
				case "PlateOutput":
					return LaserCanvas.Element.Dielectric.eType.Plate;
			}
		},

		/**
		 * Search the array of source elements for an element of the 
		 * given name, returning the found element.
		 * @param {Array<object>} elements Source elements to search.
		 * @param {string} name Name of element to return.
		 */
		findElement = function (elements, name) {
			return elements.find(function (element) { return element.name === name });
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
						if (src.LinkedTo) {
							console.warn("Screen inside block not supported.");
							// melements[melements.length - 1].loc.l += toNumber(src.DistanceToNext, variables);
							continue;
						}
						element = new LaserCanvas.Element.Screen();
						break;

					case "BrewsterInput":
					case "CrystalInput":
					case "PlateInput":
						element = new LaserCanvas.Element.Dielectric(toBlockType(src.type));
						linkedElement = findElement(elements, src.LinkedTo);
						if (!linkedElement) {
							throw "Unable to find linked output element " + src.LinkedTo + ".";
						}
						props = {
							refractiveIndex: toNumber(src.RefractiveIndex, variables),
							flip: src.Flipped || false,
							curvatureFace1: toNumber(src.ROC, variables),
							curvatureFace2: toNumber(linkedElement.ROC, variables),
						};

						if (src.type === "CrystalInput") {
							props.faceAngle = toNumber(src.FaceAngle, variables) * Math.PI / 180;
						} else if (src.type === "PlateInput") {
							props.angleOfIncidence = toNumber(src.FaceAngle, variables) * Math.PI / 180;
						}

						if (elements[index + 1].type === "ThermalLens") {
							props.thermalLens = toNumber(elements[index + 1].FL, variables);
						}
						
						// groupVelocityDispersion: 0,// {number} (um^-2) Group velocity dispersion for ultrafast calculations.
						element.loc.l = toNumber(src.Thickness, variables);
						break;

						case "ThermalLens":
							// Thermal lens handled at input face.
							continue;
	
					case "BrewsterOutput":
					case "CrystalOutput":
					case "PlateOutput":
						// Add thermal lens placeholder. The focal length is handled at input face.
						melements.push(new LaserCanvas.Element.Lens());
						element = new LaserCanvas.Element.Dielectric(toBlockType(src.type));
						linkedElement = findElement(elements, src.LinkedTo);
						if (!linkedElement) {
							throw "Unable to find linked input element " + src.LinkedTo + ".";
						}
						props = {};
						if (src.type === "CrystalOutput") {
							props.faceAngle = toNumber(linkedElement.FaceAngle, variables), Math.PI / 180;
						} else if (src.type === "PlateOutput") {
							props.angleOfIncidence = toNumber(linkedElement.FaceAngle, variables) * Math.PI / 180;
						}
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
		reElementDeclaration = /^(Mirror|ThinLens|Screen|BrewsterInput|BrewsterOutput|CrystalInput|CrystalOutput|PlateInput|PlateOutput|ThermalLens|PrismA|PrismB)\s*@\s*([^\s]+)\s*{$/m,
	
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
				lines = text.replace(/\n\r/g, "\n").replace(/\r\n/g, "\n").split("\n"),
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
		},
		
		/**
		 * Parse the text file, assumed to be in LaserCanvas 5
		 * data format, to create a system.
		 * @param {string} text Source of text file.
		 * @param {object} mprop System properties to set.
		 * @param {Array<Element>} melements System elements to update.
		 */
		fromTextFile =function (text, mprop, melements) {
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
		},

		// --------------
		//  UI handling.
		// --------------

		/**
		 * Attach a listener to the given element to trigger a system
		 * load when the file changes.
		 * @param {HTMLInputElement} input Element where to attach listener.
		 * @param {System} system System whose load to trigger.
		 * @param {Render} render Renderer.
		 */
		attachLoadListener = function (input, system, render) {
			var
				/** Load the text into the system. */
				loadText = function (src) {
					render.resetTransform();
					system.fromTextFile(src);
				},

				/** Completion function for text reader. */
				onload = function () {
					var src = this.result;
					loadText(src);
				},

				/** Respond to a change in the file by loading it. */
				change = function () {
					var file = this.files[0],
						reader = new FileReader();
					if (file && (file.type === "" || file.type === "text/plain")) {
						reader.onload = onload;
						text = reader.readAsText(file);
					}
				};
			input.addEventListener("change", change);
		};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.fromTextFile = fromTextFile;
	LaserCanvas.SystemUtil.attachLoadListener = attachLoadListener;
}(window.LaserCanvas));
