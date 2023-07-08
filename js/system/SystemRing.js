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
        if (el.canSetProperty("distanceToNext")) {
          stretches.push(el);
        }
        if (el.canSetProperty("outgoingAngle")) {
          pivot = el;
          pivotIndex = k;
          break;
        }
      }

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
            throw new Error(
              "Ring close error calculating construction angle aa"
            );
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
          q = -Math.asin(A.add(B).normalizeCross(C));

          W = A.rotate(q);
          Z = new Vector(1, 0).rotate(-pivot.loc.q).rotate(q);
        }

        // Alignments.
        first.loc.p = W.atan2();
        first.set("deflectionAngle", Math.atan2(W.cross(U), W.dot(U))); // Updates angleOfIncidence.
        pivot.set("deflectionAngle", Math.atan2(V.cross(Z), V.dot(Z))); // Updates angleOfIncidence.
        pivot.loc.q = Z.atan2();
        stretch.set("distanceToNext", l);
      } while (false);
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
      if (mprop.configuration === LaserCanvas.System.configuration.ring) {
        return alignEndElementsRing(melements);
      } else {
        alignEndElementsLinear(melements);
      }
    };

  LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
  LaserCanvas.SystemUtil.alignEndElements = alignEndElements;
})(window.LaserCanvas);
