/**
 * Loading of systems, i.e., converting data file to internal representation.
 */

(function (LaserCanvas) {
	var
		// ------------
		//  Variables.
		// ------------

		/**
		 * Scan the lines for variable declarations, returning an object
		 * with the variable values and ranges.
		 * @param {string} text Source text where to find variables.
		 */
		scanVariables = function (text) {
			var 
				// Regular expression matching Variable(x)=3 or Range(x)=0,10.
				// Capture groups:
				//  1  Variable|Range.
				//  2  x|y|z.
				//  3  Value or first of range.
				//  4  Second of range, if used.
				re = /^(Variable|Range)\((x|y|z)\)\s*=\s*([^,\n]+)(?:,([^\n]))?$/gm,
				variables = {
					x: { value: 0, min: 0, max: 1 },
					y: { value: 0, min: 0, max: 1 },
					z: { value: 0, min: 0, max: 1 }
				},
				match = re.exec(text);
			while (match) {
				if (match[1] === "Variable") {
					variables[match[2]].value = +match[3];
				} else {
					variables[match[2]].min = +match[3];
					variables[match[2]].max = +match[4];
				}
				match = re.exec(text);
			}
console.log(variables);
			return variables;
		},

		// --------------------------
		//  Declaration expressions.
		// --------------------------

		/**
		 * Scan the text for the property, returning its declared expression.
		 * @param {string} text Source text where to find variables.
		 * @param {string} propertyName Name of property to find.
		 */
		scanExpression = function (text, propertyName) {
			var re = new RegExp("^" + propertyName + "\\s*=\\s*([^\n]+)", "gm"),
				match = re.exec(text);
			return match && match[1];
		},

		/**
		 * Scan the text for the property, returning its declared numerical
		 * value. If the value is an expression, it is evaluated using the
		 * variable values.
		 * @param {string} text Source text where to find variables.
		 * @param {string} propertyName Name of property to find.
		 * @param {object} variables Variables whose values to substitute.
		 */
		scanNumber = function (text, propertyName, variables) {
			var expr = scanExpression(text, propertyName),
				value = +expr;
			if (!isNaN(value)) {
				return value;
			}

			// TODO:
			// This into a separate Equation utility method
			// Avoid using eval (?)
			var expression = expr
				.replace(/(x|y|z)/g, function (m, name) {
					return "(" + variables[name].value + ")";
				})
				.replace(/(\W)(sin|cos)(\W)/g, "$1Math.$2$3");
			value = eval(expression);
			return value;
		},

		// -----------
		//  Elements.
		// -----------

		/** Regular expression matching a block describing an element. */
		reElementBlock = /(Mirror|Screen)\s*@\s*([^\s{]+)\s*\{([^}]+)\}/g,

		scanElement = function (elementType, name, blockText, variables, props) {
console.log(blockText);
			for (var name in props) {
				var value = scanNumber(blockText, name, variables);
console.log(name + "=" + value);
			}
		},

		/**
		 * @param {Array} elements Array where to add the new elements.
		 */
		scanElements = function (text, variables, elements) {
console.log("scanElements");
			var props,
				match = reElementBlock.exec(text);
			while (match) {
console.log(match[1], match[2])
				switch (match[1]) {
					case "Mirror":
						props = {
							"FaceAngle": "q"
						};
						break;
				}
				scanElement(match[1], match[2], match[3], variables, props);
				match = reElementBlock.exec(text);
			}
console.log(elements)
		}
		
	/**
	 * Parse the text file, assumed to be in LaserCanvas 5
	 * data format, to create a system.
	 * @param {string} text Source of text file.
	 */
	function fromTextFile (text) {
		var mprop = {},
			melements = [];

		var msg = null;
console.log("TODO: Check for multiple systems!")
		try {
			var lines = text
				.replace("\n\r", "\n")
				.split("\n");
			if (lines[1] !== "Resonator") {
				throw "Only `Resonator` systems can be loaded."
			}

			// Variables.
			var variables = scanVariables(text);

			// System properties.
			mprop.name = lines[0].substring(1, lines[0].length - 2);
			mprop.wavelength = scanNumber(text, "Wavelength", variables);
console.log(mprop);

			// Elements.
			scanElements(text, variables, melements);
		} catch (e) {
			alert("Unable to parse the file: " + e);
		}

	};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.fromTextFile = fromTextFile;
}(window.LaserCanvas));

(function () {
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
	window.LaserCanvas.SystemUtil.fromTextFile(text);
}());
