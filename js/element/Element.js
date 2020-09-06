/**
* LaserCanvas - Element utility functions.
*/
(function (LaserCanvas) {
/**
* Standard algorithm for checking whether element is at the location.
* This gets overloaded e.g. by block element for more sophisticated
* overlap calculations.
* @this {Element} Element being checked.
* @param {Point} pt Point to look at.
* @param {number} tol Tolerance (from renderer; depends on zoom, maybe).
* @returns {boolean} Value indicating whether this element is at the queried location.
*/
LaserCanvas.Element.atLocation = function (pt, tol) {
	return Math.abs(this.loc.x - pt.x) < tol && Math.abs(this.loc.y - pt.y) < tol;
};

/**
* Standard calculation of group delay dispersion given a group
* velocity dispersion and a length. The method is expected to
* be called for e.g. Dielectric or Dispersion, where there is
* a groupVelocityDispersion property, as well as an element 
* group. The GDD is only returned for the first element in the
* group. If the parameter L is not supplied, the element's
* distanceToNext property is used as the propagation length.
* @this {Element} Grouped element, e.g. Dispersion or Dielectric.
* @param {number} lam (nm) Wavelength (note units nm!).
* @param {number} L (mm) Physical length of propagation through material.
* @returns {number} (fs^2/rad) Group delay dispersion for first element in group, otherwise 0.
*/
LaserCanvas.Element.groupDelayDispersion = function (lam, L) {
	// Group delay dispersion (see e.g. https://www.newport.com/n/the-effect-of-dispersion-on-ultrashort-pulses)
	// 
	//         lam^3      d^2 n
	// GDD = ---------- --------- L.
	//        2 pi c^2   d lam^2
	//
	// Units:
	//           [nm^3]       1
	//     = ------------- -------- [mm]
	//        [um^2/fs^2]   [um^2]
	//
	//     = [nm^3 mm /um^4] [fs^2].
	//
	//     = -9 * 3 - 3 / -6 * 4
	//     = -30 / -24
	//     = -6.
	var c = LaserCanvas.constant.c; // {number} (um/fs) Speed of light.
	return this === this.group[0]
		? 1e-6 * lam * lam * lam / (2 * Math.PI * c * c) 
			* this.get("groupVelocityDispersion") 
			* L
		: false;
};
}(window.LaserCanvas));
