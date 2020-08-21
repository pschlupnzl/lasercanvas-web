/**
 * A property expression or constant value, suitable for use in element
 * properties that have user input.
 */
(function (LaserCanvas) {
	var 
		/** Strings corresponding to methods or properties in `Math`. */
		mathStrings = ["abs", "cos", "sin", "tan"],

		/** Regular expression matching Math functions. */
		reMath = new RegExp(`(^|\\W)(${mathStrings.join("|")})(\\W|$)`, "g"),

		/** Constants. */
		constantStrings = ["pi"],

		/** Regular expression matching a mathematical constant in isolation. */
		reConstants = new RegExp(`(^|[^\\d\\w])(${constantStrings.join("|")})([^\\d\\w]|$)`, "g"),

		/** Mathematical constants to substitute. */
		constants = {
			"pi": "Math.PI",
		},

		/** Anticipated variable strings. */
		variableStrings = ["x", "y"],

		/** Regular expression matching an isolated string corresponding to a variable. */
		reVariables = new RegExp(`(^|\\W)(${variableStrings.join("|")})(\\W|$)`, "g"),

		/** Allowed strings of more than one character. */
		allowedStrings = (function (strings) {
			var allowed = {};
			for (var str of strings) {
				allowed[str] = str;
			}
			return allowed;
		}([].concat(mathStrings, constantStrings, variableStrings))),

		/** Regular expression matching strings to be validated. */
		reValidate = /\w{2,}/g,

		/** Validate the string to ensure it's safe to `eval`. */
		validate = function (stringValue) {
			var strings = stringValue.match(reValidate);
			if (strings) {
				for (var str of strings) {
					if (!allowedStrings[str]) return false;
				}
			}
			return true;
		};

	/**
	 * Initialize a new Equation, optionally setting the initial value.
	 * @param {string|number} value Optional initial value to set.
	 */
	var Equation = function (value) {
		/** Numeric value, which takes precedence unless it is NULL. */
		this.number = 0;
		/** Expression to evaluate. */
		this.expression = null;
		this.set(value);
	};

	/**
	 * Set the equation value, e.g. in response to user input. Only
	 * number and strings are accepted.
	 * @param {string|number|object} value Value or expression to set.
	 */
	Equation.prototype.set = function (value) {
		if (typeof value === "number" && !isNaN(value)) {
			this.number = value;
			this.expression = null;
		} else if (typeof value === "string" && validate(value)) {
			this.number = null;
			this.expression = value;
		} else if (typeof value === "object" 
				&& value.hasOwnProperty("number") 
				&& value.hasOwnProperty("expression")) {
			this.number = value.number;
			this.expression = value.expression
		}
	};

	/** Returns the numeric or expression value. */
	Equation.prototype.value = function (variables) {
		var expr;
		if (this.number !== null) {
			return this.number;
		} else {
			variables = variables || {};
			expr = this.expression
				.replace(reVariables, function (m, pre, name, post) {
					return `${pre}(${variables[name] || 0})${post}`;
				})
				.replace(reMath, "$1Math.$2$3")
				.replace(reConstants, function (m, pre, name, post) {
					return `${pre}${constants[name]}${post}`;
				});

			// We can use `eval` because the expression is validated in `set`.
			return eval(expr);
		}
	};

	LaserCanvas.Equation = Equation;
}(window.LaserCanvas));
