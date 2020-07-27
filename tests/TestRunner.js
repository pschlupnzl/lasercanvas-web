/**
 * Test runner for LaserCanvas testing scripts.
 */
(function (window) {
	window.LaserCanvas.localize = function () {};
	/**
	 * Class to handle running LaserCanvas tests.
	 */
	class TestRunner {
		/**
		 * Initialize a new instance of the TestRunner class.
		 * @param {function} logger Callback invoked with test results.
		 */
		constructor (logger) {
			this.logger = logger;
		}

		/**
		 * Run all the test cases.
		 */
		run () {
			const collection = window.testCollection;
			for (const key in collection) {
				if (collection.hasOwnProperty(key)) {
					const test = collection[key];
					for (const testCase of test.cases) {
						const result = (testCase.test || test.test)(testCase);
						this.logger.log(result);
					}
				}
			}
		}
	}

	window.TestRunner = TestRunner;
	window.testCollection = {};
}(window));
