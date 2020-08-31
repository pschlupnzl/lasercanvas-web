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
		reValidate = /[A-Za-z]{2,}/g,

		/** Validate the string to ensure it's safe to `eval`. */
		validate = function (stringValue) {
			var strings = stringValue.match(reValidate);
			if (strings) {
				for (var str of strings) {
					if (!allowedStrings[str]) return false;
				}
			}
			return true;
		},

		/** Regular expression matching a trailing number such as ...) + 3, ...x - 3, etc. */
		reTrailingNumber = /(^|[a-df-z0-9]|\))(\s*)([+-])\s*(\d+)$/i;

	/**
	 * Initialize a new Equation, optionally setting the initial value.
	 * @param {string|number} value Optional initial value to set.
	 */
	var Equation = function (value) {
		/** Numeric value, which takes precedence unless it is NULL. */
		this._number = 0;
		/** Expression to evaluate. */
		this._expression = null;
		this.set(value);
	};

	/**
	 * Set the equation value, e.g. in response to user input. Only
	 * number and strings are accepted. If `value` is undefined, the
	 * Equation is set to 0.
	 * @param {string|number|object} value Value or expression to set.
	 */
	Equation.prototype.set = function (value) {
		if (value === undefined) {
			this._number = 0;
			this._expression = null;
		} else if (typeof value === "number" && !isNaN(value)) {
			this._number = value;
			this._expression = null;
		} else if (typeof value === "string" && !isNaN(+value)) {
			this._number = +value;
			this._expression = null;
		} else if (typeof value === "string" && validate(value)) {
			this._number = null;
			this._expression = value;
		} else if (typeof value === "object" 
				&& value.hasOwnProperty("_number") 
				&& value.hasOwnProperty("_expression")) {
			this._number = value._number;
			this._expression = value._expression
		}
	};

	/** Returns the numeric value. */
	Equation.prototype.value = function (variables) {
		var expr, value;
		if (this._number !== null) {
			return this._number;
		} else {
			variables = variables || {};
			expr = this._expression
				.replace(reVariables, function (m, pre, name, post) {
					return `${pre}(${variables[name] || 0})${post}`;
				})
				.replace(reMath, "$1Math.$2$3")
				.replace(reConstants, function (m, pre, name, post) {
					return `${pre}${constants[name]}${post}`;
				});

			// `eval` should be safe from arbitrary scripts ibecause the expression is validated in `set`.
			try {
				value = eval(expr);
			} catch (e) {
				value = 0;
			}
			return value;
		}
	};

	/**
	 * Increment or decrement by a given amount. For numerical values,
	 * this simply changes the values; expressions are modified to result
	 * the adjusted value.
	 * @param {number} amount Amount by which to increment the value.
	 */
	Equation.prototype.increment = function (amount) {
		var match;

		// Ignore if not changing value.
		if (!amount) {
			return;
		}

		// Numerical value: Add increment amount.
		if (this._number !== null) {
			return this.set(this._number + amount);
		}

		// Simple numerical expression (unlikely): Add amount as numerical value.
		match = +this._expression;
		if (!isNaN(match)) {
			return this.set(match + amount);
		}

		// Trailing number: Adjust trailing value.
		match = reTrailingNumber.exec(this._expression);
		if (match) {
			return this.set(this._expression.replace(reTrailingNumber, function (m, pre, space, sign, value) {
				var newValue = +value + amount;
				if (sign === "+" && newValue < 0) {
					return pre + " - " + Math.abs(newValue).toString();
				} else if (sign === "-" && newValue < 0) {
					return pre + " + " + Math.abs(newValue).toString();
				}
				return pre + " " + sign + " " + newValue.toString();
			}));
		}

		// Otherwise, add as trailing offset.
		return this.set(this._expression + " " + (amount >= 0 ? "+" : "-") + " " + Math.abs(amount).toString());
	}

	/** Returns the string expression. */
	Equation.prototype.expression = function () {
		return this._expression || this._number;
	}
	
	LaserCanvas.Equation = Equation;
}(window.LaserCanvas));
