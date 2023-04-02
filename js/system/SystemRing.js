/**
 * Utility methods for ring systems.
 */
(function (LaserCanvas) {
	var
		/**
		 * Move the start of the cavity to the next mirror, returning the offset
		 * count to the new starting element. This is useful when dragging ring
		 * cavities to prevent drags across the closing gap.
		 * @param {Element[]} melements System element array being manipulated.
		 * @param {number?} dir Direction to search for next mirror, default +1
		 * for forward search.
		 */
		moveStart = function (melements, dir) {
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
				melements._offset = ((melements._offset || 0) + melements.length - count) % melements.length;
				melements[0].set('startOptic', false);
				melements[melements.length - 1].set('endOptic', false);
				for (k = count; k > 0; k -= 1) {
					melements.push(melements.splice(0, 1)[0]);
				}
				melements[0].set('startOptic', true);
				melements[melements.length - 1].set('endOptic', true);
			}

			console.log(`moveStart -> ${count} offset=${melements._offset}`, melements)
			return count;
		};


	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.moveStart = moveStart;
}(window.LaserCanvas));
