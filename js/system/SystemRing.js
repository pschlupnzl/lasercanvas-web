/**
 * Utility methods for ring systems.
 */
(function (LaserCanvas) {
  var eps = 1e-12, // {number} Floating point precision.
    /**
     * Align the end elements of a linear cavity, by setting the mirrors to
     * normal incidence.
     * @param {Element[]} melements System elements.
     */
    alignEndElementsLinear = function (melements) {
      var el = melements[0],
        le = melements[melements.length - 1];
      // Linear cavity: Normal incidence.
      el.loc.p = el.loc.q + Math.PI;
      le.set("distanceToNext", 0);
      le.set("deflectionAngle", Math.PI);
    },
    /**
     * Calculate the closing segment of a ring cavity. This is similar to
     * the alignment calculation in SystemAdjust, except we're not
     * guaranteed to hit the closing optic, and we only have the last
     * segment to work with.
     * @param {Element[]} melements System elements.
     * @throws Error if the move cannot be completed as expected.
     * @returns The index of the last pivot element, beyond which the cartesian
     * coordinates will need to be re-calculated.
     */
    alignEndElementsRing = function (melements) {
      var Vector = LaserCanvas.Math.Vector,
        pivot, // {Element} Last pivot element, rotated to close the ring.
        pivotIndex, // {number} Index of last pivot element.
        stretches = [], // {Element[]} Candidate stretch elements.
        stretch, // {Element} Currently adjusting stretching element.
        k, // {number} Loop counter.
        el, // {Element} Loop variable.
        A, // {Vector} Stretching vector.
        B, // {Vector} Fixed components.
        C, // {Vector} Straight-line closing vector.
        C0,
        U, // {Vector} Outgoing from first element, to be bisected (given).
        V, // {Vector} Incoming to last pivot, to be bisected (given).
        W, // {Vector} Incoming to first element, to be bisected (calculated).
        Z, // {Vector} Outgoing from last pivot, to be bisected (calculated).
        q, // {number} (rad) Angle to rotate pivot to close the loop.
        dx,
        dy,
        aa, // {number} (rad) Angle opposite stretch segment.
        bb, // {number} (rad) Angle opposite fixed segment.
        cc, // {number} (rad) Angle opposite straight-line closing segment.
        l2, // {number} (mm2) Mod-squared of calculated stretch segment.
        l, // {number} (mm) Final calculated stretch length.
        first = melements[0];

      // Find pivot and stretch element(s).
      for (k = melements.length - 1; k > 0; k -= 1) {
        el = melements[k];
        // console.log(`element ${el.name} ${el.type} next=${el.canSetProperty("distanceToNext") ? "TRUE":"false"} angle=${el.canSetProperty("outgoingAngle")}`)
        if (el.canSetProperty("distanceToNext")) {
          stretches.push(el);
        }
        if (el.canSetProperty("outgoingAngle")) {
          // console.log(`found - bailing`)
          pivot = el;
          pivotIndex = k;
          break;
        }
      }

      // console.log(`alignEndElements pivot; stretches; cavity:`, pivot, stretches, melements)

      do {
        // Stretch the segment after the last optic only.
        stretch = stretches[0];

        // Accumulate fixed vector.
        const NEW_METHOD = false;
        if (NEW_METHOD) {
          B = new Vector(0, 0);
          dx = dy = 0;
          for (k = pivotIndex; k < melements.length; k += 1) {
            el = melements[k];
            if (el !== stretch) {
              l = el.get("distanceToNext");
              B = B.add(new Vector(l, 0).rotate(-el.loc.q));
              dx += l * Math.cos(el.loc.q);
              dy += l * Math.sin(el.loc.q);
            }
          }
        } else {
          // Accumulate fixed vector.
          dx = dy = 0;
          for (k = pivotIndex + 1; k < melements.length; k += 1) {
            el = melements[k];
            le = melements[k - 1];
            if (le !== stretch) {
              l = el.get("distanceToNext");
              dx += el.loc.x - le.loc.x;
              dy += el.loc.y - le.loc.y;
            }
          }
        }

        // This is similar to the SystemAdjustLite. We are closing the
        // segment between the last pivot (mirror) element, to the first
        // element (also a mirror) in the ring. We want to support
        // arbitrary elements in this leg, so we decompose the elements
        // into fixed (A) and stretchable (B) vectors.
        //  cc  Angle between fixed and stretchable vectors.
        //   B  Collection of all fixed components in the segment.
        //   A  Stretchable vector.
        //   C  Vector from last pivot to the first element in the ring.
        //             ____
        //            / cc \___
        //           /         \___   Fixed
        //  Stretch /              \___ leg
        //         / A             B   \___
        //        /                        \___
        //       /_bb_______________________aa_\
        //   First           <-C--            Pivot
        //
        // Knowing B, C, and cc, we can use the sine rule to calculate
        // bb, then sum angle rule to get aa, and thence |A|.

        // Vector outgoing from stretch element.
        A = new Vector(1, 0).rotate(-stretch.loc.q);
        // Fixed leg vector.
        B = new Vector(dx, dy);
        // Straight line from last to first pivot, cf. pivot to drag.
        C = new Vector(first.loc.x - pivot.loc.x, first.loc.y - pivot.loc.y);
        C0 = C;

        // Vector outgoing from first element, to be bisected.
        U = new Vector(1, 0).rotate(-first.loc.q);
        // Vector incoming to last pivot, to be bisected.
        V = new Vector(1, 0).rotate(-pivot.loc.p);

        if (B.norm() < eps) {
          // -- No fixed leg: Simple calculation. --
          l = C.norm(); // Distance from stretch element.
          Z = C; // Outgoing from last pivot.
          W = C; // Incoming to first pivot.
        } else {
          // -- Full calculation. --
          // Angle between fixed and stretch legs.
          cc = Math.PI - Math.acos(A.normalizeDot(B));
          // Sine rule to get second angle.
          bb = Math.asin((Math.sin(cc) * B.norm()) / C.norm());
          // Sum angle formula for third angle.
          aa = Math.PI - bb - cc;
          if (isNaN(aa)) {
            throw new Error("Ring close error calculating construction angle aa");
          }

          // Cosine rule to get stretch length.
          l2 = B.norm2() + C.norm2() - 2 * B.norm() * C.norm() * Math.cos(aa);

          // Length of stretch vector, limited to zero.
          if (l2 < 0) {
            throw new Error("Ring stretch error l2 < 0: " + l2);
          }
          l = l2 < 0 ? 0 : Math.sqrt(l2);
          // Scaled stretch vector.
          A = A.normalize().scale(l);
          // Determine whether this completes the leg.
          if (Math.abs(A.add(B).norm() - C.norm()) > eps) {
            throw new Error("Ring not closed with stretch segment.");
          }
          // Rotate last pivot to line up the endpoints.
        //   q = Math.acos(A.add(B).normalizeDot(C));
          q = -Math.asin(A.add(B).normalizeCross(C));

        //   console.log((Math.acos(B.add(A).normalizeDot(C)) * 180) / Math.PI);
        //   console.log(`q=${(q * 180) / Math.PI}˚`);

          W = A.rotate(q);
          Z = new Vector(1, 0).rotate(-pivot.loc.q).rotate(q);

          ////// const n = (v) => `${v.toFixed(3)} (${(v * 180 / Math.PI).toFixed(1)}˚)`
          ////
          ////// console.log(`aa=${n(aa)} B->${n(B.atan2())} pivot.loc.q=${n(pivot.loc.q)} dot=${n(Z.normalizeDot(B))}`)
          ////// Z = C.normalize().rotate(aa).rotate(B.atan2() - pivot.loc.q)
          ////
          ////// // Bisected incoming vector to last element.
          ////// V = new Vector(1, 0).rotate(-pivot.loc.p);
          ////// // Outgoing angle: To first pivot, plus triangle, plus angle to fixed.
          ////// Z = new Vector(1, 0).rotate(-pivot.loc.q).rotate(q);
          ////// // .rotate(q);
          //   // For display, rotate to line up with new angle.
          //   A = A.rotate(q);
          //   B = B.rotate(q);
          //   C = C.rotate(-q);

          ////// // Z = V.rotate(Math.PI);
          ////// // Z = C.rotate(aa).normalize(); // Target outgoing angle.
          ////// // Z = new Vector(1, 0);
          ////// // // Z = new Vector(1, 0).rotate(30 * Math.PI / 180);
          ////// pivot.set("deflectionAngle", Math.atan2(V.cross(Z), V.dot(Z))); // Updates angleOfIncidence.
          ////// pivot.loc.q = Z.atan2();
          ////
          ////// // stretch.set("distanceToNext", l);
          ////
          ////// // Incoming vector to first element.
          ////// // W = new Vector(1, 0).rotate(melements[melements.length - 1].loc.q)//.rotate(q);
          ////// W = new Vector(1, 0).rotate(Math.PI / 2)
          ////// // Bisected outgoing vector from first element.
          ////// U = new Vector(1, 0).rotate(-first.loc.q);
          ////// // Vector incoming
          ////// // first.set("deflectionAngle", Math.atan2(W.cross(U), W.dot(U))); // Updates angleOfIncidence.
          ////// // first.set("deflectionAngle", Math.atan2(W.cross(U), W.dot(U))); // Updates angleOfIncidence.
          ////// // first.set("deflectionAngle", Math.atan2(U.cross(W), U.dot(W))); // Updates angleOfIncidence.
          ////// first.set("deflectionAngle", Math.PI); // Updates angleOfIncidence.
        }

        // Alignments.
        first.loc.p = W.atan2();
        first.set("deflectionAngle", Math.atan2(W.cross(U), W.dot(U))); // Updates angleOfIncidence.
        pivot.set("deflectionAngle", Math.atan2(V.cross(Z), V.dot(Z))); // Updates angleOfIncidence.
        pivot.loc.q = Z.atan2();
        stretch.set("distanceToNext", l);
      } while (false);

      ////// // Z = new Vector(le.loc.x - el.loc.x, le.loc.y - el.loc.y);
      ////// // Z = new Vector(el.loc.x - le.loc.x, el.loc.y - le.loc.y);
      ////// Z = new Vector(0,  1);
      ////// console.log(`(${el.loc.x}, ${el.loc.y}) -> (${le.loc.x}, ${le.loc.y}) Z.atan2=${Z.atan2()}`)
      ////// Z = Z.normalize();
      ////// U = new Vector(1, 0).rotate(-el.loc.q); // Bisected outgoing vector from first element.
      ////// V = new Vector(1, 0).rotate(-le.loc.p); // Bisected incoming vector to last element.
      ////
      ////// le.set("deflectionAngle", Math.atan2(Z.cross(U), Z.dot(U))); // Updates angleOfIncidence.
      ////// el.set("deflectionAngle", Math.atan2(V.cross(Z), V.dot(Z))); // Updates angleOfIncidence.
      ////// el.loc.q = Z.atan2();
      ////
      ////// pivot.set("outgoingAngle", Z.atan2());
      ////// var Vector = LaserCanvas.Math.Vector, // {function} Vector construction function.
      ////// 	U, V, Z, l,         // Vectors for ring cavity.
      ////// 	el = melements[0],  // {Element} Starting element.
      ////// 	le = melements[melements.length - 1]; // {Element} Final element.
      ////
      ////// Ring cavity construction vectors.
      ////// This closes the space between the last optic (mirror or
      ////// other) to the start optic (always mirror).
      ////// Z = new Vector(el.loc.x - le.loc.x, el.loc.y - le.loc.y);
      ////// l = Z.norm();                           // Vector length.
      ////// Z = Z.normalize();                      // Vector from last to first element.
      ////// U = new Vector(1, 0).rotate(-el.loc.q); // Bisected outgoing vector from first element.
      ////// V = new Vector(1, 0).rotate(-le.loc.p); // Bisected incoming vector to last element.
      ////
      ////// // Alignments.
      ////// el.loc.p = Z.atan2();
      ////// el.set("deflectionAngle", Math.atan2(Z.cross(U), Z.dot(U))); // Updates angleOfIncidence.
      ////// le.set("deflectionAngle", Math.atan2(V.cross(Z), V.dot(Z))); // Updates angleOfIncidence.
      ////// le.loc.q = Z.atan2();
      ////// le.set("distanceToNext", l);
      ////
      /////** Final outgoing angle of the pivot. */
      ////
      ////// q = 0;
      ////// // P = new Vector(1, 0).rotate(-pivot.loc.p);
      ////// /** Normalized vector representing angle incoming to pivot. */
      ////// V = new Vector(1, 0).rotate(-pivot.loc.p);
      ////// /** Normalized vector representing outgoing angle from pivot. */
      ////// Z = new Vector(1, 0).rotate(-90 * Math.PI / 180);
      ////
      ////// Z: Vector from last to first element, i.e. target angle.
      ////// V: Bisected incoming vector to last (pivot) element.
      ////// pivot.set("deflectionAngle", Math.atan2(V.cross(Z), V.dot(Z))); // Updates angleOfIncidence.

      setTimeout(function () {
        try {
          var render = LaserCanvas.__render;

          // Original straight-line segment.
          render
            .drawVector(C0, pivot.loc.x, pivot.loc.y)
            .setStroke(q > 0 ? "#093" : "#903", 5)
            .stroke();

          // FROM element.
          render
            .drawPath("M -32 0 L 32 0 M 0 -32 L 0 32", pivot.loc.x, pivot.loc.y)
            .setStroke("red", 1)
            .stroke();
          // render.drawVector(Z.normalize().scale(pivot.get("distanceToNext")), pivot.loc.x, pivot.loc.y, "red");

          render.drawVector(
            B.add(A), //.normalize().scale(pivot.get("distanceToNext")),
            pivot.loc.x,
            pivot.loc.y,
            "#c90"
          );

          // TO element.
          render
            .drawPath("M -32 0 L 32 0 M 0 -32 L 0 32", first.loc.x, first.loc.y)
            .setStroke("blue", 1)
            .stroke();
          render.drawVector(
            U.normalize().scale(100),
            first.loc.x,
            first.loc.y,
            "blue"
          );
          render.drawVector(
            W.normalize().scale(20),
            first.loc.x,
            first.loc.y,
            "skyblue"
          );

          // Between FROM TO element (straight-line).
          render
            .drawVector(C, pivot.loc.x, pivot.loc.y)
            .setStroke("#c90", 2)
            .stroke();
          render
            .beginPath()
            .arc(pivot.loc.x, pivot.loc.y, C.norm(), 0, 2 * Math.PI)
            .setStroke("#c90", 0.5)
            .stroke();

          // A: Stretch outgoing vector.
          render.drawVector(A, stretch.loc.x, stretch.loc.y, "#66c");
          render
            .beginPath()
            .arc(pivot.loc.x, pivot.loc.y, A.add(B).norm(), 0, 2 * Math.PI)
            .setStroke("#66c", 0.5)
            .stroke();
          // B: Fixed vector.
          render.drawVector(B, pivot.loc.x, pivot.loc.y, "green");
          render
            .beginPath()
            .arc(pivot.loc.x, pivot.loc.y, B.norm(), 0, 2 * Math.PI)
            .setStroke("green", 0.5)
            .stroke();

          // aa: Angle at pivot.
          render.fillText(
            ((180 / Math.PI) * aa).toFixed(0),
            pivot.loc.x,
            pivot.loc.y,
            0,
            -1
          );

          // bb: Angle at end angle.
          render.fillText(
            ((bb * 180) / Math.PI).toFixed(0),
            first.loc.x,
            first.loc.y,
            -3,
            0
          );

          // cc: Angle between stretch and fixed vector.
          render.fillText(
            ((cc * 180) / Math.PI).toFixed(0),
            stretch.loc.x,
            stretch.loc.y,
            0.5,
            0
          );

          // Moved angle.
          render.fillText(
            ((q * 180) / Math.PI).toFixed(1),
            first.loc.x,
            first.loc.y,
            0,
            5
          );

          // render
          // 	.drawVector(B, pivot.loc.x, pivot.loc.y)
          // 	.setStroke("green", 2)
          // 	.stroke();

          // render
          // 	.drawVector(
          // 		Z,
          // 		pivot.loc.x,
          // 		pivot.loc.y)
          // 	.setStroke("red", 2)
          // 	.stroke();
        } catch (err) {
          // don't care
        }
      }, 0);

      return pivotIndex;
    },
    /**
     * Update the rotation of the cavity end elements. The
     * elements are most likely mirrors.
     * For a standing wave cavity, the mirrors are at normal
     * incidence, so incoming and outgoing vectors will be
     * anti-parallel.
     * Returns a value indicating whether cartesian coordinates need to be
     * updated.
     * @param {object} mprop System properties.
     * @param {Element[]} melements System elements.
     */
    alignEndElements = function (mprop, melements) {
      // var Vector = LaserCanvas.Math.Vector, // {function} Vector construction function.
      // 	U, V, Z, l,         // Vectors for ring cavity.
      // 	el = melements[0],  // {Element} Starting element.
      // 	le = melements[melements.length - 1]; // {Element} Final element.

      if (mprop.configuration === LaserCanvas.System.configuration.ring) {
        return alignEndElementsRing(melements);
      } else {
        alignEndElementsLinear(melements);
      }
    },
    /**
     * Move the start of the cavity to the next mirror, returning the offset
     * count to the new starting element. This is useful when dragging ring
     * cavities to prevent drags across the closing gap.
     * @param {Element[]} melements System element array being manipulated.
     * @param {number?} dir Direction to search for next mirror, default +1
     * for forward search.
     */
    moveStart = function (melements, dir) {
      return 0; // TODO Remove this
      var k,
        count = 0,
        isMirror = function (el) {
          return el.type === LaserCanvas.Element.Mirror.Type;
        };
      if (dir < 0) {
        // Reverse: Find last mirror, then the one before it.
        count = melements.length - 1;
        for (; count >= 0 && !isMirror(melements[count]); count -= 1);
        for (; count >= 0 && !isMirror(melements[count]); count -= 1);
      } else {
        // Forward: First element is mirror, so find next mirror.
        count = melements.slice(1).findIndex(isMirror) + 1;
      }
      if (count > 0) {
        melements._offset =
          ((melements._offset || 0) + melements.length - count) %
          melements.length;
        melements[0].set("startOptic", false);
        for (k = count; k > 0; k -= 1) {
          melements.push(melements.splice(0, 1)[0]);
        }
        melements[0].set("startOptic", true);
      }

      console.log(
        `moveStart -> ${count} offset=${melements._offset}`,
        melements
      );
      return count;
    };

  LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
  LaserCanvas.SystemUtil.alignEndElements = alignEndElements;
  LaserCanvas.SystemUtil.moveStart = moveStart;
})(window.LaserCanvas);
