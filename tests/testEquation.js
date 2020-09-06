/**
 * Equation.
 */
window.testCollection = window.testCollection || {};
(function (collection) {

	const testCases = [
		{ value: 1, expect: 1 },
		{ value: "1", expect: 1 },
		{ value: "pi", expect: Math.PI },
		{ value: "cos(0)", expect: 1 },
		{ value: "cos(pi)", expect: -1 },
		{ value: "sin(pi)", expect: 0 },
		{ value: "sin(pi / 2)", expect: 1 },
		{ value: "sin(pi) + cos(2*pi)", expect: 1 },
		{ value: "nope", expect: 0 },
		{ value: "1 + nope", expect: 0 },
		{ value: "2 / nope + 1", expect: 0 },
		{ value: "x", variables: { x: 22 }, expect: 22 },
		{ value: "x", expect: 0 },
		{ value: "2 * x + sin(y)", variables: { x: 2.5, y: Math.PI / 2 }, expect: 6 }
	];

	// ------------------
	//  Test collection.
	// ------------------
	collection.equation = {
		label: "Equation",
		cases: testCases,
		test: function (testCase) {
			var eq = new LaserCanvas.Equation(testCase.value),
				actual = eq.value(testCase.variables),
				success = Math.abs(testCase.expect - actual) < 1e-7;
			return {
				label: testCase.value,
				success: success,
				message: success ? testCase.expect.toString() : actual
			};
		}
	};
}(window.testCollection));
