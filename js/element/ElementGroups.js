(function (LaserCanvas) {
	/**
	 * Collect groups from a given system. This includes dispersion (prism) pairs
	 * as well as dielectric blocks including a thermal lens.
	 * @param {Array<object:Elements>} elements Elements of the system to combine.
	 */
	LaserCanvas.Element.collectGroups = function (elements) {
		var groupable,    // {boolean} Value indicating whether element is to be grouped.
			group = null; // {Array<object:Element>} Grouped elements.

		for (var element of elements) {
			// Dielectric and Dispersion.
			groupable = element.hasOwnProperty("group");
			if (!group && groupable) {
				// Start a new group.
				group = [element];
				// TODO: What was this for?
				// if (element.type === 'Dielectric') {
				// 	element.prop.thickness.set(element.expression("distanceToNext"));
				// 	element.set("thickness", element.get("distanceToNext"));
				// }
				
			} else if (group && element.type === "Lens") {
				// Continue group with thermal lens.
				group.push(element);

			} else if (group && groupable) {
				// Finish group.
				group.push(element);
				for (var m = 0; m < group.length; m += 1) {
					if (group[m].hasOwnProperty("group")) {
						group[m].group = group;
					}
				}
				group[0].updateAngles();
				group = null;
			}
		}
	};
}(window.LaserCanvas));
