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
			if (typeof expression === "number") {
				return expression;
			}
			var expr = expression
				.replace(/(x|y|z)/g, function (m, name) {
					return "(" + variables[name].value + ")";
				})
				.replace(/(\W)(sin|cos)(\W)/g, "$1Math.$2$3");
			value = eval(expr);
			return value;
		},

		/**
		 * Returns the expression, transformed as needed (not much), and with
		 * any missing variables (e.g. `z`) substituted by its value.
		 * @param {string} expression Equation to be evaluated.
		 * @param {object} variables Variable values.
		 * @param {number=} scl Optional scale, e.g. -1 to flip incidence angles.
		 */
		toExpression = function (expression, variables, scl) {
			var val,
				expr = expression
					.replace(/(z)/g, function (m, name) {
						return `(${variables[name].value})`;
					});

			// Try as number.
			val = +expr;
			if (!isNaN(val)) {
				if (scl && scl !== 1) {
					val *= scl;
				}
				return val;
			}

			// Apply scale as needed.
			if (scl && scl !== 1) {
				expr = `${scl}*(${expr})`;
			}
			return expr;
		},

		/**
		 * Add multiple expressions together. For example, this is used when
		 * concatenating multiple Distance To Next values.
		 * @param {string|number} initial Value to be added to. It's assumed this is already a number if it can be.
		 * @param {string} addad Value to be added. It is added as a number if possible.
		 * @param {object} variables Current variable values for interpolation (e.g. "z" variable).
		 */
		addExpressions = function (initial, added, variables) {
			var addedExpr = toExpression(added, variables);
			if (typeof initial === "number" && typeof addedExpr === "number") {
				return initial + addedExpr;
			}
			return `${initial} + ${addedExpr}`;
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

		toDielectricType = function (type) {
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
		 * Returns a JSON structure to create the system of elements.
		 * @param {Array<object>} elements Source element data.
		 * @param {object} variables Variables used to evaluate expression to numeric values.
		 */
		textElementsToJson = function (elements, variables) {
			if (!["Mirror", "Source"].includes(elements[0].type)) {
				throw "First element must be a mirror or source.";
			}

			// Add new elements.
			var jsonElements = [];
			for (var index = 0; index < elements.length; index += 1) {
				var src = elements[index];
				var linkedElement;
				var elementJson = {
					name: src.name,
					loc: {},
					prop: {}
				};
				switch (src.type) {
					case "Mirror":
						elementJson.type = LaserCanvas.Element.Mirror.Type;
						elementJson.prop = {
							radiusOfCurvature: toExpression(src.ROC, variables),
							angleOfIncidence: toExpression(src.FaceAngle, variables, FLIP)
						};
						break;

					case "ThinLens":
						elementJson.type = LaserCanvas.Element.Lens.Type;
						elementJson.prop = {
							focalLength: toExpression(src.FL, variables)
						};
						break;

					case "Screen":
						if (src.LinkedTo) {
							console.warn("Screen inside block not supported.");
							continue;
						}
						elementJson.type = LaserCanvas.Element.Screen.Type;
						break;

					case "Source":
						// `Source` elements are at start of propagation system.
						elementJson.type = LaserCanvas.Element.Screen.Type;
						break;

					case "BrewsterInput":
					case "CrystalInput":
					case "PlateInput":
						linkedElement = findElement(elements, src.LinkedTo);
						if (!linkedElement) {
							throw "Unable to find linked output element " + src.LinkedTo + ".";
						}
						elementJson.type = LaserCanvas.Element.Dielectric.Type;
						elementJson.prop = {
							type: toDielectricType(src.type),
							refractiveIndex: toExpression(src.RefractiveIndex, variables),
							flip: src.Flipped || false,
							curvatureFace1: toExpression(src.ROC, variables),
							curvatureFace2: toExpression(linkedElement.ROC, variables),
							thickness: toExpression(src.Thickness, variables)
						};

						if (src.type === "CrystalInput") {
							elementJson.prop.faceAngle = toExpression(src.FaceAngle, variables);
						} else if (src.type === "PlateInput") {
							elementJson.prop.angleOfIncidence = toExpression(src.FaceAngle, variables);
						}

						if (elements[index + 1].type === "ThermalLens") {
							elementJson.prop.thermalLens = toExpression(elements[index + 1].FL, variables);
						}
						
						// groupVelocityDispersion: 0,// {number} (um^-2) Group velocity dispersion for ultrafast calculations.
						break;

					case "ThermalLens":
						// Thermal lens handled at input face.
						continue;
	
					case "BrewsterOutput":
					case "CrystalOutput":
					case "PlateOutput":
						// Add thermal lens placeholder. The focal length is handled at input face.
						jsonElements.push({
							type: LaserCanvas.Element.Lens.Type,
							prop: {}
						});
						linkedElement = findElement(elements, src.LinkedTo);
						if (!linkedElement) {
							throw "Unable to find linked input element " + src.LinkedTo + ".";
						}
						elementJson.type = LaserCanvas.Element.Dielectric.Type;
						elementJson.prop = {
							type: toDielectricType(src.type),
						};
						if (src.type === "CrystalOutput") {
							elementJson.prop.faceAngle = toExpression(linkedElement.FaceAngle, variables);
						} else if (src.type === "PlateOutput") {
							elementJson.prop.angleOfIncidence = toExpression(linkedElement.FaceAngle, variables);
						}
						break;

					case "PrismA":
						elementJson.type = LaserCanvas.Element.Dispersion.Type;
						elementJson.prop = {
							type: LaserCanvas.Element.Dispersion.eType.Prism,
							refractiveIndex: toExpression(src.RefractiveIndex, variables)
						};
						break;

					case "PrismB":
						elementJson.type = LaserCanvas.Element.Dispersion.Type;
						elementJson.prop = {
							type: LaserCanvas.Element.Dispersion.eType.Prism
						};
						break;

					case "Flat":
						// Flat mirrors only. These are most likely between two
						// prisms, so we'll just ignore them here.
						// FALL THROUGH:
					default:
						// Accumulate skipped element spacing.
						if (src.DistanceToNext) {
							jsonElements[jsonElements.length - 1].prop.distanceToNext =
								addExpressions(
									jsonElements[jsonElements.length - 1].prop.distanceToNext,
									src.DistanceToNext, variables);
						}
						continue;
				}

				// Common properties.
				elementJson.prop.distanceToNext = src.DistanceToNext !== undefined
					? toExpression(src.DistanceToNext, variables)
					: 0;
		
				// Append to list.
				jsonElements.push(elementJson);
			}

			// Finishing.
			if (jsonElements.length < 2) {
				throw "Need at least two elements in the cavity.";
			}
			jsonElements[0].prop.startOptic = true;
			jsonElements[jsonElements.length - 1].prop.endOptic = true;

			return jsonElements;
		},

		// ----------
		//  Parsing.
		// ----------

		/** Regular expression matching a system name: [SystemName] */
		reSystemName = /^\[([^\]]+)\]$/m,

		/** Regular expression matching a system type: Resonator|... */
		reSystemType = /^(Resonator|Propagation)$/m,

		/** Regular expression matching lines to ignore. */
		reIgnore = /^\s*(?:Selected|Astigmatic|)\s*$/m,

		/** Regular expression matching a property declaration: Property = Expression */
		rePropertyDeclaration = /^\s*([A-Za-z][^\s]*)\s*=\s*(.*)$/m,

		/** Regular expression matching boolan properties for elements. */
		reBooleanProperty = /^(Flipped)$/m,

		/** Regular expression matching an element declaration: Element @ Name = { */
		reElementDeclaration = /^(Mirror|ThinLens|Screen|BrewsterInput|BrewsterOutput|CrystalInput|CrystalOutput|PlateInput|PlateOutput|ThermalLens|PrismA|PrismB|Flat|Source)\s*@\s*([^\s]+)\s*{$/m,
	
		/** Regular expression matching a renderer declaration: Renderer 2d { */
		reRendererDeclaration = /^Renderer\s+(1d|2d|3d|Inventory|Solver|SystemGraph|VertexGraph)\s*\{$/m,
		/**
		 * Parse the LaserCanvas text format into an object, returning
		 * the object. Only the first system is returned.
		 * @param {string} text Text file to parse.
		 */
		parseTextFile = function (text) {
			var match,
				/** Text file split into lines. */
				lines = text.replace(/\n\r/g, "\n").replace(/\r\n/g, "\n").split("\n"),
				/** First lines (system name and type), used as a check. */
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
		 * Parse the text file, assumed to be in LaserCanvas 5 data format,
		 * returning a JSON structure for the equivalent system.
		 * @param {string} text Source of text file.
		 */
		textFileToJson = function (text) {
			var root = parseTextFile(text),
				variables = getVariables(root),
				json = {
					variables: variables,
					prop: {
						configuration: 
							root.type === "Resonator" ? LaserCanvas.System.configuration.linear :
							root.type === "Propagation" ? LaserCanvas.System.configuration.propagation :
							LaserCanvas.System.configuration.linear,
						name: root.name,
						wavelength: toExpression(root.Wavelength, variables),
					},
					elements: textElementsToJson(root.elements, variables)
				};

			// Initial location.
			LaserCanvas.Utilities.extend(json.elements[0].loc, {
				x: toNumber(root.StartX, variables),
				y: FLIP * toNumber(root.StartY, variables),
				q: FLIP * toNumber(root.Rotation, variables) * Math.PI / 180,
			});
			return json;
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
		 * @param {function} variablesSetter Method to set variable values and ranges.
		 */
		attachLoadListener = function (input, system, render, variablesSetter) {
			var
				/** Create a new input field with a new listener. */
				refreshInput = function (oldInput) {
					var newInput = document.createElement("input"),
						parent = oldInput.parentElement;
					newInput.type = oldInput.type;
					newInput.className = oldInput.className;
					newInput.addEventListener("change", change);
					parent.insertBefore(newInput, oldInput);
					parent.removeChild(oldInput);
				},

				/** Load the text into the system. */
				loadText = function (src) {
					render.resetTransform();
					// TODO: A system load is more of an application load so
					// should really be at the LaserCanvas level, not System.
					system.fromTextFile(src, variablesSetter);
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
					refreshInput(this);
				};
			input.addEventListener("change", change);
		};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.textFileToJson = textFileToJson;
	LaserCanvas.SystemUtil.attachLoadListener = attachLoadListener;
}(window.LaserCanvas));
