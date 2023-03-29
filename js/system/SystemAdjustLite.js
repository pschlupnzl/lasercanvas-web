/**
* Laser canvas system - Adjustment calculations.
*/
(function (LaserCanvas) {
LaserCanvas.systemAdjust = function (melements, calculateCartesianCoordinates, getVariables) {
	/** ************************************************
	* Calculate new property values for a drag of an
	* element with relevant constraints.
	*
	* At the beginning of the drag, the system between
	* the nearest pivot (Mirror) and the element being
	* dragged is deconstructed into a triangle of:
	*   cc  Fixed angle between drag element and pivot
	*       based on the deconstruction.
	*    B  Fixed length effective vector of other
	*       elements to pivot.
	*    A  Variable length gap between drag and the
	*       nearest element.
	*    Q  Fixed angle between fixed element vector B
	*       and the outgoing axis.
	*        
	*     Q             /\___
	*      |           / cc  \___
	*       \         /          \___  A
	*        |     B /               \___
	*   P     \     /                    \___
	*    \__   |   /                         \___
	*        \__\ / aa                      bb   \___
	*            #-----------------------------------+
	*         Pivot              C                  Drag
	*
	* When the drag element is moved, we know:
	*    C   New variable length of vector from pivot
	*        to drag.
	*    B   Length of fixed vector.
	*   cc   The fixed angle between effective vector
	*        and variable length vector.
	*    q   Newly calculated deflection angle.
	*
	* The new values are determined as follows.
	*    1.  Determine |A|, the distance between the pivot
	*        and the drag element's new position.
	*
	*    2.  Use the cosine rule to calculate the new
	*        variable length of A. Canonically, the rule
	*        is written as
	*           a^2 = b^2 + c^2 - 2bc cosA
	*        where in our case
	*           a --> |C| (because we know the fixed angle c)
	*           b --> |B|
	*           c --> |A|
	*        so that
	*           |C|^2 = |B|^2 + |A|^2 - 2|B||A| cos c.
	*        We rearrange this to get a quadratic in the new
	*        variable length |A| as
	*           |A|^2 + (-2|B| cos c)|A| + (|B|^2 - |C|^2) = 0.
	*        The canonical quadratic equation
	*           ax^2 + bx + c = 0
	*        has solutions    __________
	*                -b +/- \/b^2 - 4ac
	*           x = --------------------- ,
	*                       2a
	*        or with a = 1   _________
	*               -b +/- \/b^2 - 4c
	*          x = -------------------- .
	*                      2
	*        In our case
	*           x --> |A|
	*           a -->  1
	*           b --> -2|B| cos c := 2 Bcosc
	*           c --> |B|^2 - |C|^2
	*        so that              _____________________________
	*           |A| = Bcosc +/- \/ Bcosc^2 / 4 + |C|^2 - |B|^2
	*        This is the new distanceToNext value to
	*        assign to the stretchable gap.
	************************************************* */
	
	var
		eps = 1e-12,    // {number} Floating point precision.
		mdragData = {}, // {object} Data during drag.
		
		/**
		* Gets the index of the specified element.
		* @param {Element} Element whose index to determine.
		* @returns {number} Index of element within cavity, or -1 if not found.
		*/
		elementIndex = function (el) {
			var k;
			for (k = 0; k < melements.length; k += 1) {
				if (melements[k] === el) {
					return k;
				}
			}
			return -1;
		},
			
		/**
		* Find the surrounding pivot and stretch elements.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag Element being dragged.
		*/
		getDragElements = function (ptStart, elDrag) {
			var 
				indxDrag = elementIndex(elDrag), // {number} Element index in cavity.
				dragLoc = elDrag.location(),     // {object} Location of drag element.
				dx = dragLoc.x - ptStart.x,      // {number} (mm) Horizontal offset from mouse to drag element.
				dy = dragLoc.y - ptStart.y,      // {number} (mm) Vertical offset from mouse to drag element.

				// Assemble a standard data block for a pivot, stretch, or drag element.
				// @param {number} k Element index.
				// @param {Element} element Element whose data to capture.
				// @returns {object} Data relating to element.
				getData = function (k, element) {
					return {
						element: element,          // {Element} Element that can pivot, stretch, or drag.
						loc: LaserCanvas.Utilities.extend({}, element.location(), {
							l: element.get("distanceToNext", getVariables())
						}),
						index: k,                  // {number} Index of element.
						canPivot: element.canSetProperty('outgoingAngle') // {boolean} Value indicating whether the element can pivot.
						// construct: {} // This is only used for the drag element; prev and next have construct higher up.
					};
				},
				
				// Calculate construction parameters.
				// @param {object} pivot Data about pivoting element.
				// @param {object} stretch Data about stretching element.
				// @param {number} dir Direction -1:prev, +1:next
				// @returns {object} Construction data.
				getConstruct = function (pivot, stretch, dir) {
					var cc, Bnorm, Bcoscc, Bsincc, BQ, CB,
						Vector = LaserCanvas.Math.Vector,
						
						// Vector from pivot to mouse.
						C = new Vector(               // {Vector} Vector from pivot to mouse.
							ptStart.x - pivot.loc.x, 
							ptStart.y - pivot.loc.y)
							.scale(-dir),              // .. Opposite sense for Next segment.
							
						// Stretch vector.
						A = new Vector(               // {Vector} Stretch vector.
							Math.cos(stretch.loc.q), 
							Math.sin(stretch.loc.q))
							.scale(stretch.loc.l),
							
						// Fixed vector.
						B = C.subtract(A),            // {Vector} Fixed vector.
						
						// Angle to next.
						Q = new Vector(
							Math.cos(pivot.loc.q),
							Math.sin(pivot.loc.q));
							
					// Collapsed triangles with small angles.
					if (B.norm() > eps) {
						cc = Math.PI - Math.acos(A.normalizeDot(B)); // {number} (rad) Angle between fixed and stretch vectors.
						BQ = Math.asin(B.normalize().cross(Q));      // {number} (rad) Angle between fixed and outgoing (useful for prev only).
						CB = C.cross(B);                             // {number} Cross product, determines sense of triangle.
					} else {
						B = new Vector(0, 0);
						cc = Math.PI; // {number} (rad) Angle between fixed and stretch vectors.
						BQ = 0;       // {number} (rad) Angle between fixed and outgoing (useful for prev only).
						CB = 0;       // {number} Cross product, determines sense of triangle.
					}

					// Cosine rule factors.
					Bnorm = B.norm();             // {number} (mm) Length of fixed vector.
					Bcoscc = Bnorm * Math.cos(cc);
					Bsincc = Bnorm * Math.sin(cc);
						
					
					return {
						a: A.norm(),               // {number} (mm) Length of stretch vector.
						b: B.norm(),               // {number} (mm) Length of fixed vector.
						c: C.norm(),               // {number} (mm) Length from pivot to mouse.
						cc: cc,                    // {number} (rad) Angle between fixed and stretch vectors.
						sincc: Math.sin(cc),       // {number} Sine rule factor.
						Bsincc: Bsincc,            // {number} (mm) Sine rule factor.
						Bcoscc: Bcoscc,            // {number} (mm) Cosine rule factor.
						B2sin2cc: Bsincc * Bsincc, // {number} (mm^2) Cosine rule determinant factor.
						BQ: BQ,                    // {number} (rad) Angle between fixed and outgoing (useful for prev only).
						CB: CB                     // {number} Cross product, determines sense of triangle.
						, A: A, B: B, C: C //// TODO: Remove construction stuff.
					};
				},
				
				// Find pivot and stretch elements.
				// @param {number} k Starting element index value.
				// @param {number} dir Direction to search, -1|+1.
				// @returns {object} Construction parameters.
				findPivotStretch = function (k, dir) {
					var element,
						data = {
							pivot: null,         // {object?} Data for element that can pivot.
							stretch: null,       // {object?} Data for element that can stretch.
							construct: null      // {object} Construction parameters assembled elsewhere.
						};
					
					// Find pivot and stretch elements.
					for (; k >= 0 && k < melements.length && (!data.pivot || !data.stretch); k += dir) {
						element = melements[k];
						if (!data.pivot && element.canSetProperty('outgoingAngle') 
							&& (dir < 0 || k > indxDrag)) { // Ignore dragged item when searching for next pivot.
							data.pivot = getData(k, element);
						}
						if (!data.stretch && element.canSetProperty('distanceToNext', elDrag)) {
							data.stretch = getData(k, element);
						}
					}

					// Calculate construction parameters.
					if (data.pivot && data.stretch) {
						data.construct = getConstruct(data.pivot, data.stretch, dir);
					}
					
					// Return data.
					return data;
				};
				
			ptStart.x += dx;
			ptStart.y += dy;

			var dragData = {
				prev: findPivotStretch(indxDrag - 1, -1),
				next: findPivotStretch(indxDrag, +1),
				drag: getData(indxDrag, elDrag),
				offset: {
					dx: dx,
					dy: dy
				}
			};
			
			// If stretching "backward" (e.g. grating) then adjust distances only.
			dragData.stretchOnly = (dragData.prev.construct
				&& dragData.prev.construct.A.dot(dragData.prev.construct.B) < 0)
				|| (dragData.next.construct
				&& dragData.next.construct.A.dot(dragData.next.construct.B) < 0);

			// Return drag construct.
			return dragData;
		},

		/**
		* Start dragging an element.
		* @param {Point} pt (mm) Current mouse world coordinates during drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag Element being dragged.
		* @returns {boolean} Value indicating whether drag should start.
		*/
		dragElementStart = function (pt, elDrag) {
			mdragData = getDragElements(pt, elDrag);
			if (mdragData) {
				return true;
			}
			return false;
		},
		
		/**
		* An element is being dragged. This calculates the new stretch and
		* pivot values for the relevant anchor points and updates the system
		* coordinates on any changes.
		* @param {Point} pt (mm) Current mouse world coordinates during drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag_notused Element being dragged. The parameter is not used.
		* @returns {boolean} Value indicating whether drag caused system to change.
		*/
		dragElement = function (pt, ptStart, elDrag_notused) {
			// Offset new position.
			pt.x += mdragData.offset.dx;
			pt.y += mdragData.offset.dy;
			
			return mdragData.stretchOnly
				? dragElementStretch(pt, ptStart, elDrag_notused)
				: dragElementPivot(pt, ptStart, elDrag_notused);
		},
		
		/**
		* An element is being dragged. This calculates the new stretch
		* values for the relevant anchor element and updates the system
		* coordinates on any changes.
		* @param {Point} pt (mm) Current mouse world coordinates during drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag_notused Element being dragged. The parameter is not used.
		* @returns {boolean} Value indicating whether drag caused system to change.
		*/
		dragElementStretch = function (pt, ptStart, elDrag_notused) {
			var a, S, P, ptEnd,
				Vector = LaserCanvas.Math.Vector,      // {function} Vector construction function.
				prev = mdragData.prev,                 // {object} Previous construction element.
				next = mdragData.next;                 // {object} Next construction element.
				
			// Dragging first element: mdragData.prev.construct = null.
			if (!prev.construct) {
				S = new Vector(next.stretch.loc.l, 0)  // Stretching vector.
					.rotate(-next.stretch.loc.q);
				ptEnd = {
					x: next.stretch.loc.x + S[0],
					y: next.stretch.loc.y + S[1]
				};
				P = new Vector(ptEnd.x - pt.x, ptEnd.y - pt.y);
				S = S.normalize();
				a = S.dot(P);
				S = S.scale(a);

				if (a > 0) {
					next.stretch.element.set("distanceToNext", a);
					next.stretch.element.loc.x = ptEnd.x - S[0];
					next.stretch.element.loc.y = ptEnd.y - S[1];
					calculateCartesianCoordinates(mdragData.drag.index);
					return true;
				}

			} else {
				// Dragging end element: mdragData.next.construct = null.
				S = new Vector(1, 0)  // Stretching vector.
					.rotate(-prev.stretch.loc.q)
				a = new Vector(
					pt.x - prev.stretch.loc.x,
					pt.y - prev.stretch.loc.y)
					.dot(S);
				if (a > 0) {
					prev.stretch.element.set("distanceToNext", a);
					if (next.construct) {
						next.stretch.element.set("distanceToNext",
							prev.stretch.loc.l + next.stretch.loc.l - a);
					}
					calculateCartesianCoordinates(prev.index);
					return true;
				}
			}
			return false;
		},
		
		/**
		* An element is being dragged. This calculates the new stretch and
		* pivot values for the relevant anchor points and updates the system
		* coordinates on any changes.
		* @param {Point} pt (mm) Current mouse world coordinates during drag.
		* @param {Point} ptStart (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag_notused Element being dragged. The parameter is not used.
		* @returns {boolean} Value indicating whether drag caused system to change.
		*/
		dragElementPivot = function (pt, ptStart, elDrag_notused) {
			var
				Vector = LaserCanvas.Math.Vector,      // {function} Vector construction function.
				extend = LaserCanvas.Utilities.extend, // {function} Extend objects.
				
				dragPermitted = true,   // {boolean} Value indicating whether system has changed.
				locPrev = {},           // {object} Retain previous configuration to cancel drags.
				distPrev = null,        // {number} Retain previous distance to next to cancel drags.
				prevPivotOutgoingAngle = mdragData.prev.pivot // {number} (rad) Initial outgoing angle after pivot.
					? mdragData.prev.pivot.element.get("outgoingAngle")
					: null,

				// Calculate new stretch and angles.
				// From Wikipedia,         ____________________
				//    |A| = B cos cc +/- \/ |C|^2 - B^2sin^2cc
				// @param {object} data Data for prev or next segment.
				// @param {number} dir Direction -1:prev, +1:next.
				// @returns {boolean} Value indicating whether the move yields valid values.
				calculate = function (data, dir) {
					var loc,  // {object} Location of next pivot when aligning first drags.
						a,     // {number} (mm) New length.
						qc,    // {number} (rad) Angle of mouse vector on page.
						aa,    // {number} (rad) Angle between vector to mouse and fixed.
						q,     // {number} (rad) Angle of segment on page.
					
						// Construction parameters.
						cc = data.construct.cc,
						b = data.construct.b, // {number} (mm) Length of fixed vector.
						Bcoscc = data.construct.Bcoscc,
						B2sin2cc = data.construct.B2sin2cc,
						
						// Vector from pivot to mouse.
						C = new Vector(
							pt.x - data.pivot.loc.x,
							pt.y - data.pivot.loc.y)
							.scale(-dir), // .. Opposite sense for Next segment
						c = C.norm(), // {number} (mm) New distance to mouse.
						
						// Quadratic formula determinant.
						det = C.norm2() - B2sin2cc;
					
					// Store for construction diagram.
					data.construct.c = c;

					if (det >= 0 && c > b) {
						// New length.
						// The sign for adding or subtracting the square root
						// depends on whether the construction triangle has an
						// obtuse or acute angle between fixed and stretch vectors.
						a = Bcoscc + (cc >= 0.5 * Math.PI ? +1 : -1) * Math.sqrt(det);

						// What's going on here, you ask?
						// Well, it turns out that taking the absolute value of
						// 'a' here magically fixes drags associated with crazy
						// angles within prism compressors, say. That, plus this
						// cheap and cheerful party trick does not seem to cause
						// any negative side effects, so the overall verdict is:
						// Do it.
						a = Math.abs(a);
						if (a > 0) {
							data.stretch.element.set("distanceToNext", a);
						
							// Angle on page.
							// The sign of adding or subtracting the new deflection
							// angle aa depends on whether the construction triangle
							// goes clockwise, counterclockwise, or is a non-triangle,
							// for example if the pivot and stretch elements are the
							// same.
							if (mdragData.drag.canPivot) {
								qc = Math.atan2(C[1], C[0]);
								aa = Math.asin(data.construct.sincc * a / (C.norm() || 1));
								q = qc + data.construct.BQ +
									(data.construct.CB < 0 ? -1 :
									data.construct.CB === 0 ? 0 : +1) * aa; // {number} (rad) Angle of outgoing axis on page.
									
								
								if (dir === -1) {
									// Standard elements, calculating backward.
									data.pivot.element.set("outgoingAngle", q, data.pivot.index === 0);

								} else if (!mdragData.prev.construct) {
									// First element, calculating forwards.
									mdragData.drag.element.location({ // Set location directly.
										x: pt.x,
										y: pt.y,
										q: 0 // Angle set separately, below.
									});
									mdragData.drag.element.set("outgoingAngle", 0, true); // Set outgoing angle isFirstElement: true.
									calculateCartesianCoordinates(0, mdragData.next.pivot.index);

									// I can't for the life of me figure out the correct outgoing
									// angle of the first element. Instead, we simply calculate
									// the coordinates up to the first pivot with zero rotation,
									// then rotate the element's axis so that the pivot is back
									// where it's supposed to be.
									loc = mdragData.next.pivot.element.location();
									mdragData.drag.element.set("outgoingAngle", C.atan2() - new Vector(loc.x - pt.x, loc.y - pt.y).atan2(), true);
									calculateCartesianCoordinates(0, mdragData.next.pivot.index);
									
									// Restore next pivot angle.
									mdragData.next.pivot.element.set("outgoingAngle", mdragData.next.pivot.loc.q); // Restore original outgoing direction.
									calculateCartesianCoordinates(mdragData.drag.index);
								}
							}
							return true;
						}
					}
					return false;
				},
				
				// Continue the calculation for a pivoting element.
				// @returns {boolean} Value indicating whether drag yields valid values.
				calculatePivotDrag = function () {
					var q, pivotLoc, dragLoc, V, W;

					// Finish the calculation for the next segment.
					if (calculate(mdragData.next, +1)) {
						// Determine coordinates for everything up to next pivot.
						calculateCartesianCoordinates(0, mdragData.next.pivot.index);
						
						// Calculate required pivot angle.
						dragLoc = mdragData.drag.element.location();
						pivotLoc = mdragData.next.pivot.element.location();
						V = new Vector(
							pivotLoc.x - dragLoc.x,
							pivotLoc.y - dragLoc.y)
							.normalize();
						W = new Vector(
							mdragData.next.pivot.loc.x - dragLoc.x,
							mdragData.next.pivot.loc.y - dragLoc.y)
							.normalize();
						q = Math.asin(V.cross(W));
						
						// Apply angle.
						mdragData.drag.element.set("outgoingAngle", dragLoc.q + q); // Deflect cavity to restore next pivot point.
						calculateCartesianCoordinates(mdragData.prev.pivot.index, mdragData.next.pivot.index);
						
						// Restore next pivot angle.
						mdragData.next.pivot.element.set("outgoingAngle", mdragData.next.pivot.loc.q); // Restore original outgoing direction.
						calculateCartesianCoordinates(mdragData.drag.index);
						return true;
						
					} else {
						// Illegal placement - restore previous.
						mdragData.prev.pivot.element.set("outgoingAngle", prevPivotOutgoingAngle);
						return false;
					}
				},
				
				// Continue calculation for fixed drag element.
				// @returns {boolean} Value indicating whether drag yields valid values.
				calculateFixedDrag = function () {
					var a = mdragData.next.stretch.loc.l
						+ mdragData.prev.stretch.loc.l
						- mdragData.prev.stretch.element.get("distanceToNext", getVariables()); // {number} (mm) Amount moved.
					if (a > 0) {
						mdragData.next.stretch.element.set("distanceToNext", a);
						calculateCartesianCoordinates();
						return true;
					}
					return false;
				};
			
			// Prepare to cancel, if needed.
			if (mdragData.prev.stretch) {
				locPrev = extend(locPrev, mdragData.prev.stretch.element.loc);
				distPrev = mdragData.prev.stretch.element.get("distanceToNext", getVariables());
			}
			
			// Dragging first element (no previous).
			if (!mdragData.prev.construct) {
				dragPermitted = calculate(mdragData.next, +1);
				
				// Dragging last element (no next).
			} else if (!mdragData.next.construct) {
				dragPermitted = calculate(mdragData.prev, -1);
				if (dragPermitted) {
					calculateCartesianCoordinates(mdragData.prev.pivot.index - 1);
				}
				
				// Full drag.
			} else {
				// Calculate first piece.
				dragPermitted = calculate(mdragData.prev, -1);
				if (dragPermitted) {
					dragPermitted = mdragData.drag.canPivot 
						// Moving pivoting element.
						? calculatePivotDrag()
						// Moving fixed element(s).
						: calculateFixedDrag();
				}
			}

			if (false) {
				if (__dragElementTmr) {
					clearTimeout(__dragElementTmr);
				}
				__dragElementTmr = setTimeout(function () {
					__dragElementTmr = null;
					__dragElementConstruction(pt, ptStart, mdragData);
				}, 0);
			}

			// Cancel drag, if needed.
			if (!dragPermitted && mdragData.prev.stretch) {
				extend(mdragData.prev.stretch.element.loc, locPrev);
				mdragData.prev.stretch.element.set("distanceToNext", distPrev);
			}

			// Return success.
			return dragPermitted;
		},
		
		/**
		* Dragging ends.
		* @param {Point} ptEnd_notused (mm) Final mouse world coordinates during drag.
		* @param {Point} ptStart_notused (mm) Mouse world coordinates at start of drag.
		* @param {Element} elDrag_notused Element being dragged.
		*/
		dragElementEnd = function (ptEnd_notused, ptStart_notused, elDrag_notused) {
			mdragData = {};
		},
		
		// {number} (Handle) Timeout handle.
		__dragElementTmr = null,
	
		/**
		* Show dragging calculation constructs.
		* @param {object} dragData Data stored at start of drag.
		*/
		__dragElementConstruction = function (pt, ptStart_notused, dragData) {
			"use strict";
			var render = LaserCanvas.__render,
				x, y, r,
			
				// Show prev / next construction.
				// @param {object} data Data to show, dragData.prev|dragData.next.
				// @param {string.ColorRef} rgb Color to use for drawing.
				// @param {number} dir Direction -1:prev, +1:next.
				showConstruction = function (data, rgb, dir) {
					var 
						stretchLoc = data.stretch.element.location(),
						pivotLoc   = data.pivot.element.location(),
						B = data.construct.B, // Fixed construction vector.
						b = data.construct.b, // {number} (mm) Length of fixed vector.
						c = data.construct.c; // {number} (mm) Distance from pivot to mouse

					// Pivot anchor.
					x = pivotLoc.x;
					y = pivotLoc.y;
					render.setStroke(rgb, 4)
						.beginPath()
						.arc(x, y, 4, 0, 2 * Math.PI)
						.stroke();
					
					// Stretch (A).
					render.setStroke(rgb, 4);
					render.beginPath();
					x = stretchLoc.x;
					y = stretchLoc.y;
					render.arc(x, y, 3, 0, 2 * Math.PI);
					render.moveTo(x, y);
					r = stretchLoc.l;
					x += r * Math.cos(stretchLoc.q);
					y += r * Math.sin(stretchLoc.q);
					render.lineTo(x, y);
					render.stroke();
					
					// Fixed (B).
					x = pivotLoc.x;
					y = pivotLoc.y;
					render
						.setStroke(rgb, 2.5)
						.beginPath()
						.arc(x, y, 8, 0, 2 * Math.PI)
						.moveTo(x, y)
						.lineTo(x - dir * B[0], y - dir * B[1])
						.stroke();

					render
						.setStroke(rgb, 0.5)
						.arc(x, y, b, 0, 1.8 * Math.PI)
						.stroke();

					// Arc from pivot to mouse.
					render
						.setStroke(rgb, 2)
						.beginPath()
						.arc(x, y, c, 0, 2 * Math.PI)
						.stroke();
				};
				
			render.save();
			showConstruction(dragData.prev, '#00c', -1);
			showConstruction(dragData.next, '#a00', +1);
			render.restore();
		};
	return {
		start: dragElementStart,
		drag: dragElement,
		end: dragElementEnd
	};
};
}(window.LaserCanvas));
