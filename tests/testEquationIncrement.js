/**
 * Equation.
 */
window.testCollection = window.testCollection || {};
(function (collection) {

	const testCases = [
		{ initial: 1, amount: 3, expect: 4 },
		{ initial: 1, amount: -3, expect: -2 },
		{ initial: -5, amount: 3, expect: -2 },
		{ initial: -5, amount: 8, expect: 3 },
		{ initial: -5, amount: -3, expect: -8 },
		{ initial: "4", amount: 2, expect: 6 },
		{ initial: "4", amount: -6, expect: -2 },
		{ initial: "-4", amount: 2, expect: -2 },
		{ initial: "-4", amount: 12, expect: 8 },
		{ initial: "-4", amount: -6, expect: -10 },
		{ initial: "3 + 4", amount: 3, expect: "3 + 7" },
		{ initial: "3 + 4", amount: -3, expect: "3 + 1" },
		{ initial: "3 + 4", amount: -6, expect: "3 - 2" },
		{ initial: "x+4", amount: 3, expect: "x + 7" },
		{ initial: "x+4", amount: -3, expect: "x + 1" },
		{ initial: "x+4", amount: -6, expect: "x - 2" },
		{ initial: "x+4", amount: -6, expect: "x - 2" },
		{ initial: "x * 2", amount: 3, expect: "x * 2 + 3" },
		{ initial: "x * 2", amount: -3, expect: "x * 2 - 3" },
		{ initial: "sin(x)", amount: 3, expect: "sin(x) + 3" },
		{ initial: "sin(x)", amount: -3, expect: "sin(x) - 3" },
		{ initial: "sin(x) + pi", amount: 3, expect: "sin(x) + pi + 3" },
		{ initial: "sin(x) + pi", amount: -3, expect: "sin(x) + pi - 3" },
		{ initial: "sin(x) - pi", amount: 3, expect: "sin(x) - pi + 3" },
		{ initial: "sin(x) - pi", amount: -3, expect: "sin(x) - pi - 3" },
		{ initial: "x + 3e2", amount: 5, expect: "x + 3e2 + 5" },
		{ initial: "x + 3e2", amount: -5, expect: "x + 3e2 - 5" },
		{ initial: "x + 3e+2", amount: 5, expect: "x + 3e+2 + 5" },
		{ initial: "x + 3e+2", amount: -5, expect: "x + 3e+2 - 5" },
		{ initial: "x + 3e-2", amount: 5, expect: "x + 3e-2 + 5" },
		{ initial: "x + 3e-2", amount: -5, expect: "x + 3e-2 - 5" },
	];

	// ------------------
	//  Test collection.
	// ------------------
	collection.equationIncrement = {
		label: "Equation Increment",
		cases: testCases,
		test: function (testCase) {
			var actual, success,
				eq = new LaserCanvas.Equation(testCase.initial);
			eq.increment(testCase.amount);
			if (typeof testCase.expect === "number") {
				actual = eq._number;
				success = actual === testCase.expect && eq._expression === null;
			} else {
				actual = eq._expression;
				success = eq._number === null && actual === testCase.expect;
			}
			return {
				label: `${testCase.initial} (+) ${testCase.amount}`,
				success: success,
				message: actual
			};
		}
	};
}(window.testCollection));
