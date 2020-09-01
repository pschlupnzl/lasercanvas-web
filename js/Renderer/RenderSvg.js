/**
* Laser canvas rendering - to SVG (for exporting?!)
*/
// @param {System} system Optical system to render.
window.LaserCanvas.RenderSvg = function (system) {
	"use strict";
	var
		ns = window.LaserCanvas.RenderSvg.svgNS, // {string} SVG namespace.
		svg = document.createElementNS(ns, 'svg'),
		
		mpath = null,          // {Path?} Currently executing path.
		mstrokeStyle = '#000', // {string} Current stroke color.
		mlineWidth = 1,        // {number} Current stroke width.
		mgroups = [],          // {Array<Group>} Group within group (with save / restore).
		mvariablesGetter = null, // {function|null} Function to retrieve current variable values.
		
		/** Sets the callback function used to retrieve variable values. */
		setVariablesGetter = function (getter) {
			mvariablesGetter = getter;
			return this;
		},

		/** Returns the current variable values. */
		getVariables = function () {
			return mvariablesGetter ? mvariablesGetter() : {};
		},

		// -------------------------------------------------
		//  Drawing methods.
		// -------------------------------------------------
		
		/**
		* Clear the drawing container.
		* @returns {RenderSvg} This object for chaining.
		*/
		clear = function () {
			while (svg.lastChild) {
				svg.removeChild(svg.lastChild);
			}
			return this;
		},
		
		/**
		* Save the current context state.
		* In the SVG case, do this with groups. The current
		* group is always the zeroth element; if no groups
		* are active, use the SVG element directly.
		* @returns {Render} This object for chaining.
		*/
		save = function () {
			var g = document.createElementNS(ns, 'g');
			(mgroups[0] || svg).appendChild(g);
			mgroups.splice(0, 0, g); // Insert at start of group.
			return this;
		},
		
		/**
		* Restore a previous context.
		* @returns {Render} This object for chaining.
		*/
		restore = function () {
			mgroups.splice(0, 1); // Remove from start.
			return this;
		},
		
		/**
		* Translate the context origin.
		* @param {number} x (mm) Horizontal translation.
		* @param {number} y (mm) Vertical translation.
		* @returns {Render} This object for chaining.
		*/
		translate = function (x, y) {
			(mgroups[0] || svg).setAttributeNS(null, 'transform',
				window.LaserCanvas.Utilities.stringFormatPrecision(2, 'translate({0}, {1})',
				x, -y));
			return this;
		},
		
		
		/**
		* Begin a new path.
		* @returns {RenderSvg} This object for chaining.
		*/
		beginPath = function () {
			mpath = document.createElementNS(ns, 'path');
			mpath.setAttributeNS(null, 'd', ''); // Begin an empty path definition.
			return this;
		},
		
		/**
		* Move or line to the given coordinates.
		* @param {string} cmd Command to use 'M'|'L'.
		* @param {number} x (mm) Horizontal location.
		* @param {number} y (mm) Vertical location.
		* @returns {RenderSvg} Self object for chaining.
		*/
		moveOrLineTo = function (cmd, x, y) {
			var d;
			if (mpath) {
				d = mpath.getAttributeNS(null, 'd');
				d += window.LaserCanvas.Utilities.stringFormatPrecision(2, ' {0} {1} {2}', cmd, x, -y);
				mpath.setAttributeNS(null, 'd', d);
			}
			return this;
		},
		
		/**
		* Move to the given coordinates.
		* @param {number} x (mm) Horizontal location.
		* @param {number} y (mm) Vertical location.
		* @returns {RenderSvg} Self object for chaining.
		*/
		moveTo = function (x, y) {
			return moveOrLineTo('M', x, y);
		},
		
		/**
		* Line to the given coordinates.
		* @param {number} x (mm) Horizontal location.
		* @param {number} y (mm) Vertical location.
		* @returns {RenderSvg} Self object for chaining.
		*/
		lineTo = function (x, y) {
			return moveOrLineTo('L', x, y);
		},
		
		/**
		* Paint a path using SVG-like notation.
		* Path commands:
		*    M, L Move or Line to absolute location.
		*    m, l Move or Line relative location.
		* Actions:
		*    F    Fill the path.
		*    S    Stroke the path.
		* This method draws directly on the canvas (as opposed to
		* calling the Render object's methods) so that transformations
		* can be applied.
		* @param {string} cmd Path with M/m[ove] and L/l[ine] commands, as well as F[ill] and S[troke] actions.
		* @param {number} x0 Starting horizontal location.
		* @param {number} y0 Starting vertical location.
		* @param {number} q0 (rad) Object rotation.
		* @param {number} scl Scale factor for relative moves.
		* @returns {RenderSvg} This object for chaining.
		*/
		drawPath = function (cmd, x0, y0, q0, scl) {
			var 
				Utilities = window.LaserCanvas.Utilities,
				actions = /[fsz]*$/i.exec(cmd); // {string} Termination commands.
				
			// Inverse Y axis and remove terminating actions.
			cmd = cmd
				// Inverse Y axis.
				.replace(/([ml]\s+[\d+-.]+ )([\d+-.]+)/gi, function (m, c, y) {
					return Utilities.stringFormat('{0}{1}', c, -(+y));
				})
				// Terminating actions (Z is permitted).
				.replace(/[fs]/gi, '');
				
			this.beginPath();
			mpath.setAttributeNS(null, 'd', cmd);
			mpath.setAttributeNS(null, 'transform',
				Utilities.stringFormatPrecision(2, 'translate({0}, {1}) rotate({2})',
				x0, -y0, q0 * 180 / Math.PI));
				
			if (/s/i.test(actions)) {
				this.stroke();
			}
			return this;
		},
		
		/**
		* Set the stroke and line.
		* @param {string:ColorRef} strokeStyle Color of stroke to use.
		* @param {number} lineWidth Thickness of stroke to use.
		* @returns {RenderSvg} This object for chaining.
		*/
		setStroke = function (strokeStyle, lineWidth) {
			mstrokeStyle = strokeStyle;
			mlineWidth = lineWidth;
			return this;
		},
	
		/**
		* Stroke the current path.
		* @returns {RenderSvg} Self for chaining.
		*/
		stroke = function () {
			if (mpath) {
				mpath.setAttributeNS(null, 'stroke', mstrokeStyle);
				mpath.setAttributeNS(null, 'stroke-width', mlineWidth);
				(mgroups[0] || svg).appendChild(mpath);
			}
			return this;
		},
		
		/**
		* Draw some text.
		* @param {string} txt Text to draw.
		* @param {number} x Horizontal world coordinate where to draw.
		* @param {number} y Vertical world coordinate where to draw.
		* @param {number=} xem Horizontal offset, in (approximate) em units.
		* @param {number=} yem Vertical offset, in (approximate) em units.
		* @param {string=} anchor Optional anchoring 'middle'.
		* @returns {Render} This object for chaining.
		*/
		fillOrCenterText = function (txt, x, y, xem, yem, anchor) {
			var size = 12,
				text = document.createElementNS(ns, 'text'),
				textNode = document.createTextNode(txt);
			
			text.setAttributeNS(null, 'x', x);
			text.setAttributeNS(null, 'y', -y);
			text.setAttributeNS(null, 'transform', 
				window.LaserCanvas.Utilities.stringFormatPrecision(2, 'translate({0}, {1})',
					size * (xem || 0), size * (yem || 0)));
			if (anchor) {
				text.setAttributeNS(null, 'text-anchor', anchor);
			}
			text.setAttributeNS(null, 'fill', mstrokeStyle);
			text.setAttributeNS(null, 'stroke', 'none');
					
			text.appendChild(textNode);
			svg.appendChild(text);

			return this;
		},
			
		/**
		* Draw some text.
		* @param {string} txt Text to draw.
		* @param {number} x Horizontal world coordinate where to draw.
		* @param {number} y Vertical world coordinate where to draw.
		* @param {number=} xem Horizontal offset, in (approximate) em units.
		* @param {number=} yem Vertical offset, in (approximate) em units.
		* @returns {Render} This object for chaining.
		*/
		fillText = function (txt, x, y, xem, yem) {
			return fillOrCenterText(txt, x, y, xem, yem);
		},
		
		/**
		* Draw some text, centered.
		* @param {string} txt Text to draw.
		* @param {number} x Horizontal world coordinate where to draw.
		* @param {number} y Vertical world coordinate where to draw.
		* @param {number=} xem Horizontal offset, in (approximate) em units.
		* @param {number=} yem Vertical offset, in (approximate) em units.
		* @returns {Render} This object for chaining.
		*/
		centerText = function (txt, x, y, xem, yem) {
			return fillOrCenterText(txt, x, y, xem, yem, 'middle');
		},

		// -------------------------------------------------
		//  Images and patterns not implemented.
		// -------------------------------------------------
		
		/**
		* Draw the image at the given location.
		* @param {Image} image_notused The parameter is not used. Image to draw.
		* @param {number} x_notused (mm) The parameter is not used. Horizontal location where to draw.
		* @param {number} y_notused (mm) The parameter is not used. Vertical location where to draw.
		* @param {number} q_notused (rad) The parameter is not used. Rotation angle.
		* @returns {RenderSvg} This object for chaining.
		*/
		drawImage = function (image_notused, x_notused, y_notused, q_notused) {
			return this;
		},

		/**
		* Create a pattern fill for the canvas.
		* @param {Image} image_notused The parameter is not used.
		* @returns {RenderSvg} This object for chaining.
		*/
		createPattern = function (image_notused) {
			return this;
		},
		
		// -------------------------------------------------
		//  Update the system.
		// -------------------------------------------------
		
		/**
		* Update the SVG bounding box.
		*/
		updateBoundingBox = function () {
			var bbox = svg.getBBox();
			console.log(bbox);
			if (bbox.width > 0 && bbox.height > 0) {
				svg.setAttributeNS(null, 'viewBox', window.LaserCanvas.Utilities.stringFormatPrecision(2, 
					'{0} {1} {2} {3}',
					bbox.x, bbox.y, bbox.width, bbox.height));
			}
		},
		
		/**
		* Save the SVG to a new window.
		*/
		download = function () {
			var url,
				a = document.createElement('a');
			document.body.appendChild(svg);
			updateBoundingBox();
			url = 'data:image/svg+xml;utf-8,' + svg.outerHTML;
			a.href = url;
			a.target = '_blank';
			a.style.position = 'fixed';
			a.download = 'LaserCanvas.svg';
			a.click();
			svg.parentNode.removeChild(svg);
		},
		
		/**
		* Update the drawing system.
		* @returns {RenderSvg} This object for chaining.
		*/
		update = function () {
			window.LaserCanvas.Render.update(system, this, {
				drawMethod: 'wireframe',
				showDistance: true
			});
			

			return this;
		};
		
	
		
	/**
	* Public methods.
	*/
	this.download = download;    // Trigger the SVG to download.
	this.getVariables = getVariables; // Retrieve the current variable values.
	this.setVariablesGetter = setVariablesGetter; // Set the callback to retrieve variable values.
	this.update = update;        // Update the drawing.
	
	////// Used by Elements for drawing.
	////this.arc = arc;              // Draw an arc.
	this.centerText = centerText; // Fill text, centered on given location.
	this.beginPath = beginPath;   // Prepare a new path.
	this.clear = clear;           // Clear the drawing container.
	this.createPattern = createPattern; // Create a pattern for filling (not implemented).
	this.drawImage = drawImage;  // Draw an image (not implemented).
	this.drawPath = drawPath;      // Draw a path using SVG-like commands.
	this.fillText = fillText;      // Draw some text.
	this.lineTo = lineTo;          // Line to drawing point.
	this.moveTo = moveTo;          // Move drawing point.
	this.restore = restore;        // Restore the previous context state.
	this.translate = translate;    // Translate the canvas.
	this.save = save;              // Save the current context state.
	this.setStroke = setStroke;    // Set stroke and line width.
	this.stroke = stroke;          // Stroke the current line.

	
	// --- DEBUG TESTING ---
	svg.setAttribute('version', '1.1');
	svg.setAttribute('xmlns', window.LaserCanvas.RenderSvg.svgNS);
	svg.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
	svg.setAttributeNS(null, 'viewBox', '-250 -250 500 500');
	svg.setAttributeNS(null, 'fill', 'none');
	
	// ?? document.body.appendChild(svg);
	// ?? window.LaserCanvas.Utilities.draggable(svg);
	// ?? svg.onclick = function (e) {
	// ?? 	if (e.ctrlKey || e.metaKey) {
	// ?? 		saveToWindow();
	// ?? 	}
	// ?? };
};

// SVG namespace for creating elements.
window.LaserCanvas.RenderSvg.svgNS = 'http://www.w3.org/2000/svg';
