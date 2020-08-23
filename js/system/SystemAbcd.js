/**
* ABCD calculations for system.
* This takes the array of elements, calculates the stable
* mode, and stores its calculation on each element's abcdQ
* property.
* @param {Array<Element>} melements Optical elements to calculate for.
* @param {object} systemProperties System properties to read and write.
* @param {object} variables Current variable values, passed to property getters.
* @returns {object} Object to store for system solution.
*/
(function (LaserCanvas) {
LaserCanvas.systemAbcd = function (melements, systemProperties, variables) {
	var 
		Matrix2x2 = LaserCanvas.Math.Matrix2x2, // {function} Constructor function for matrix.
		wavelength = systemProperties.wavelength.value(variables),
		initialWaist = systemProperties.initialWaist.value(variables),
		
		// Calculate the element ABCD.
		// @param {number} indx Index of element whose following space to calculate.
		// @param {number} dir Direction -1:backwards|+1:forwards.
		// @param {number.Enum:modePlane} plane Sagittal or tangential plane.
		// @returns {Matrix2x2} Transfer matrix.
		elementAbcd = function (indx, dir, plane) {
			return melements[indx].elementAbcd(dir, plane);
		},
		
		// Calculate element or default ABCD for gap
		// between given element and the next.
		// @param {number} indx Index of element whose following space to calculate.
		// @param {number} dir Direction -1:backwards|+1:forwards.
		// @param {number.Enum:modePlane} plane Sagittal or tangential plane.
		// @param {object=} len Physical and optical length to accumulate, if supplied.
		// @returns {Matrix2x2} Transfer matrix.
		spaceAbcd = function (indx, dir, plane, len) {
			var L, n, gdd,
				element = melements[indx]; // {Element} Element whose following space to calculate.
			// if (typeof element.spaceAbcd === 'function') {
			// 	return element.spaceAbcd(dir, plane);
			// }
			L = element.get("distanceToNext", variables);
			n = element.spaceRefractiveIndex 
				? element.spaceRefractiveIndex()            // e.g. propagation within prism pair.
				: element.property('refractiveIndex') || 1; // Default elements.
			gdd = element.groupDelayDispersion
				? element.groupDelayDispersion(wavelength)
				: 0;

			if (len) {
				len.physicalLength += L;
				len.opticalLength += n * L;
				len.groupDelayDispersion += gdd;
			}
			return new Matrix2x2(1,  L / n, 0, 1);
		},
		
		// The complex beam parameter q is defined as
		//      1     1          lam
		//     --- = ---  -  i--------
		//      q     R        pi w^2
		// where R is the wavefront curvature (in mm), lam the
		// wavelength (in um), and w the 1/e^2 mode radius (in
		// um).
		// The parameter passes through an ABCD transfer 
		// matrix as
		//     1     C + (1/q) D
		//    --- = -------------
		//     q     A + (1/q) B
		// A self-consistency argument requires that after a
		// resonator ABCD matrix, the initial q is given by
		//     1     D - A       i     _______________
		//    --- = ------- - ------ \/ 4 - (A + D)^2 .
		//     q       2B      2|B|
		// For the calculations here, we define reciprocal values
		//    Q := 1 / q          Reciprocal complex beam parameter.
		//    R := 1 / R          Reciprocal wavefront curvature.
		//    V := lam / pi w^2   Scaled reciprocal waist.
		// We then have
		//   Q = R - iV,
		//        C + QD
		//  Q' = --------
		//        A + QB
		//
		//        C + (R - iV)D
		//     = ---------------
		//        A + (R - iV)B
		//
		//        C + RD - iVD   A + RB + iVB
		//     = -------------- --------------
		//        A + RB - iVB   A + RB + iVB
		//
		//        (C + RD)(A + RB) + VBVD - i[(A + RB)VD - (C + RD)VB]
		//     = ------------------------------------------------------ .
		//                       (A + RB)^2 + (VB)^2
		// @param {object} Q Reciprocal complex beam parameter.
		// @param {Matrix2x2} mx Matrix to apply.
		// @returns {object} Modified reciprocal complex beam parameter Q'.
		applyMatrix = function (Q, mx) {
			var 
				A = mx[0][0],
				B = mx[0][1], 
				C = mx[1][0], 
				D = mx[1][1],
				R = Q.R,        // {number} Reciprocal radius of curvature.
				V = Q.V,        // {number} Reciprocal scaled waist.
				// Derived.
				ARB = A + R * B,
				CRD = C + R * D,
				VB = V * B,
				VD = V * D,
				S = 1 / (ARB * ARB + VB * VB);

			return {
				R: S * (CRD * ARB + VB * VD),
				V: S * (ARB * VD - CRD * VB),
				stability: Q.stability
			};
		},
		
		/**
		* Determine the initial Q value for the given
		* cavity transfer matrix.
		* @param {Matrix2x2} mx Cavity transfer matrix.
		* @returns {object?} Calculated Q, or NULL if unstable.
		*/
		initialQ = function (mx) {
			var A, B, C, D, det,
				tr = mx.trace();
				
			// Unstable cavity.
			if(Math.abs(tr) > 2) {
				return {
					stable: false,        // {boolean} Value indicating whether system is stable.
					stability: tr / 2     // {number} Stability coefficient.
				};
			}
			
			// Calculate initial Q.
			A = mx[0][0];
			B = mx[0][1]; 
			C = mx[1][0]; 
			D = mx[1][1];
			det = 4 - (A + D) * (A + D);
			return {
				R: (D - A) / (2 * B),    // {number} Reciprocal curvature.
				V: Math.sqrt(det) / (2 * Math.abs(B)), // {number} Normalized waist.
				stable: true,            // {boolean} Value indicating whether system is stable.
				stability: tr / 2        // {number} Stability.
			}
		},
		
		/**
		* Calculate propagation values for a given Q = 1/q parameter
		* stored e.g. on an element.
		* @param {object} Q Reciprocal beam parameter.
		* @param {number} lam (nm) Wavelength.
		* @returns {object} Beam propagation values z0, w0, zR.
		*/
		parametersFromQ = function (Q, lam) {
			// From the C++ notes, the distance and waist are given by
			//               [     ( pi w^2 )^2 ]^-1
			//    w0^2 = w^2 [ 1 + (--------)   ]
			//               [     (  lam R )   ]
			// and
			//             [     ( lam R  )^2 ]^-1
			//       z = R [ 1 + (--------)   ]
			//             [     ( pi w^2 )   ]
			// where a plane wavefront curvature R = 0 corresponds to
			// w0 = w and z = 0.
			// Scaled waist
			//          lam
			//    V = -------- .
			//         pi w^2
			//
			// Rayleigh length
			//          pi w0^2
			//    zR = --------- .
			//            lam
			var r, rv2, vr2, w0, z0, zR,
				w = Math.sqrt(lam / (Math.PI * Q.V)); // {number} (um) Mode size (from definition of Q.V = lam / pi w^2).
			
			if (Q.R === 0) {
				// Zero (i.e. infinite) curvature.
				r = Infinity;                   // {number} (mm) Radius of curvature.
				w0 = w;                         // {number} (um) Waist.
				z0 = 0;                         // {number} (mm) Distance to waist.
				zR = Math.PI * w0 * w0 / lam;   // {number} (mm) Rayleigh length.
			} else {
				r = 1 / Q.R;                    // {number} (mm) Radius of curvature.
				rv2 = (r * Q.V) * (r * Q.V);    // {number} Argument in brackets  (lam R / pi w^2)^2.
				vr2 = 1 / rv2;                  // {number} Argument in brackets  (pi w^2 / lam R)^2.
				w0 = w / Math.sqrt(1 + vr2);    // {number} (um) Waist.
				z0 = -r / (1 + rv2);            // {number} (mm) Distance to waist.
				zR = Math.PI * w0 * w0 / lam;   // {number} (mm) Rayleigh length.
			}
			return {
				w: w,      // {number} (um) Mode size.
				r: r,      // {number} (mm) Radius of curvature.
				w0: w0,    // {number} (um) Waist.
				z0: z0,    // {number} (mm) Distance to waist.
				zR: zR     // {number} (mm) Rayleigh length.
			};
		};


		

		
	var modePlane = LaserCanvas.Enum.modePlane,
		abcd = {
			sag: null,
			tan: null
		},
	
		// Set a single element's ABCD-Q parameters, if needed.
		// @param {Element} element Element to set.
		// @param {object|boolean} abcdQ Value to set, or FALSE if unstable.
		// @param {number:ModePlane} plane Plane for which being solved.
		setElementAbcdQ = function (element, abcdQ, plane) {
			element.abcdQ[plane] = abcdQ;
			if (element.updateAbcdQ) {
				element.updateAbcdQ(abcdQ, plane);
			}
		},
		
		// Calculate the propagation for a given plane.
		// @param {number:ModePlane} plane Plane for which to calculate.
		// @param {number} lam (nm) Wavelegth to calculate for.
		// @param {object=} len System length to accumulate, if used.
		// @returns {object} Data to store for system in this plane.
		calculatePlane = function (plane, lam, len) {
			var Q, dir, indx, w0,
				configuration = LaserCanvas.System.configuration, // {object} Configuration enum.
				mx = Matrix2x2.eye();

			if (systemProperties.configuration === configuration.propagation) {
				// Propagation system.
				//  1          lam        1
				// --- = -i ---------  + ---
				//  q        pi w0^2      R
				w0 = initialWaist; // {number} (mm) Waist.
				Q = {
					R: 0,                         // {number} (mm^-1) Wavefront curvature.
					V: lam / (Math.PI * w0 * w0), // {number} Normalized waist.
					stable: true                  // {boolean} Value indicating whether system is stable.
				};
				if (len) {
					for (indx = 0; indx < melements.length; indx += 1) {
						mx = elementAbcd(indx, dir, plane).multiply(mx);
						mx = spaceAbcd(indx, +1, plane, len).multiply(mx);
					}
				}
			} else {
				dir = +1;  // Up cavity.
				for (indx = 0; indx < melements.length; indx += 1) {
					if (indx > 0) {
						mx = elementAbcd(indx, dir, plane).multiply(mx);
					}
					if (indx < melements.length - 1) {
						mx = spaceAbcd(indx, dir, plane, len).multiply(mx);
					}
				}

				switch (systemProperties.configuration) {
					case configuration.ring:
						// Close ring.
						mx = spaceAbcd(indx - 1, dir, plane, len).multiply(mx);
						mx = elementAbcd(0, dir, plane).multiply(mx);
						break;
						
					default:
						// Down linear cavity.
						dir = -1;
						for (indx -= 2; indx >= 0; indx -= 1) {
							mx = spaceAbcd(indx, dir, plane).multiply(mx);
							mx = elementAbcd(indx, dir, plane).multiply(mx);
						}
				}
				Q = initialQ(mx);
			}
			
			if (!Q.stable) {
				for (indx = 0; indx < melements.length; indx += 1) {
					setElementAbcdQ(melements[indx], false, plane); // Mark cavity as unstable.
				}
			} else {
				// Propagate through system.
				dir = +1;
				for (indx = 0; indx < melements.length; indx += 1) {
					if (indx > 0) {
						Q = applyMatrix(Q, elementAbcd(indx, dir, plane));
					}
					setElementAbcdQ(melements[indx], parametersFromQ(Q, lam), plane);
					Q = applyMatrix(Q, spaceAbcd(indx, dir, plane));
				}
			}
			
			return {
				mx: mx,
				Q: Q
			};
		};
	
	// Prepare.
	systemProperties.physicalLength = 
		systemProperties.opticalLength =
		systemProperties.groupDelayDispersion = 0;
	
	// System matrices.
	abcd.sag = calculatePlane(modePlane.sagittal, wavelength, systemProperties);
	abcd.tan = calculatePlane(modePlane.tangential, wavelength);
	
	// Update system properties.
	systemProperties.modeSpacing = 299792.458 / (2 * systemProperties.opticalLength); // c / 2nL
	
	return abcd;
};

/**
* Prepagate the beam parameters by a certain distance.
* @param {object} params Beam parameters w0, zR, etc.
* @param {number} n Refractive index of propagation.
* @param {number} d Distance to propagate.
* @returns {object} Modified parameters (for now only w).
*/
LaserCanvas.systemAbcd.propagateParameters = function (params, n, d) {
	var w0 = params.w0,     // {number} (um) Waist size.
		zR = n * params.zR,  // {number} (mm) Rayleigh length, reduced by refractive index.
		z0 = n * params.z0,  // {number} (mm) Distance to waist, reduced by refractive index.
		z = (d - z0) / zR;   // {number} (mm) Normalized propagation distance.
	return {
		// Waist: Gaussian expansion.
		w: w0 * Math.sqrt(1 + z * z)
	};
};
}(window.LaserCanvas));
